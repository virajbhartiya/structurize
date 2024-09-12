import { capitalizeFirstLetter } from '../converter'

export function convertToDart(
  data: Record<string, unknown>,
  className: string = 'ApiResponse',
  indentLevel: number = 0
): string {
  const indent = '  '.repeat(indentLevel)
  let result = `${indent}class ${className} {\n`
  const nestedClasses: string[] = []

  for (const [key, value] of Object.entries(data)) {
    const { type, nestedClass } = getDartTypeWithNesting(
      value,
      capitalizeFirstLetter(key),
      indentLevel + 1
    )
    result += `${indent}  ${type} ${key};\n`
    if (nestedClass) {
      nestedClasses.push(nestedClass)
    }
  }

  // Constructor
  result += `\n${indent}  ${className}({\n`
  for (const key of Object.keys(data)) {
    result += `${indent}    required this.${key},\n`
  }
  result += `${indent}  });\n\n`

  // fromJson factory
  result += `${indent}  factory ${className}.fromJson(Map<String, dynamic> json) => ${className}(\n`
  for (const [key, value] of Object.entries(data)) {
    const { type } = getDartTypeWithNesting(
      value,
      capitalizeFirstLetter(key),
      indentLevel + 1
    )
    if (type.startsWith('List<')) {
      result += `${indent}    ${key}: (json['${key}'] as List<dynamic>).map((e) => ${type.slice(
        5,
        -1
      )}.fromJson(e as Map<String, dynamic>)).toList(),\n`
    } else if (!['String', 'int', 'double', 'bool'].includes(type)) {
      result += `${indent}    ${key}: ${type}.fromJson(json['${key}'] as Map<String, dynamic>),\n`
    } else {
      result += `${indent}    ${key}: json['${key}'] as ${type},\n`
    }
  }
  result += `${indent}  );\n\n`

  // toJson method
  result += `${indent}  Map<String, dynamic> toJson() => {\n`
  for (const [key, value] of Object.entries(data)) {
    const { type } = getDartTypeWithNesting(
      value,
      capitalizeFirstLetter(key),
      indentLevel + 1
    )
    if (
      type.startsWith('List<') ||
      !['String', 'int', 'double', 'bool'].includes(type)
    ) {
      result += `${indent}    '${key}': ${key}.map((e) => e.toJson()).toList(),\n`
    } else {
      result += `${indent}    '${key}': ${key},\n`
    }
  }
  result += `${indent}  };\n`

  result += `${indent}}\n\n`
  result += nestedClasses.join('\n')
  return result.trimEnd() + '\n'
}

function getDartTypeWithNesting(
  value: unknown,
  nestedClassName: string,
  indentLevel: number
): { type: string; nestedClass: string | null } {
  if (value === null) return { type: 'dynamic', nestedClass: null }
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'List<dynamic>', nestedClass: null }
    const { type, nestedClass } = getDartTypeWithNesting(
      value[0],
      nestedClassName,
      indentLevel
    )
    return {
      type: `List<${type}>`,
      nestedClass: nestedClass,
    }
  }
  if (typeof value === 'object') {
    const nestedResult = convertToDart(
      value as Record<string, unknown>,
      nestedClassName,
      indentLevel
    )
    return { type: nestedClassName, nestedClass: nestedResult }
  }
  switch (typeof value) {
    case 'string':
      return { type: 'String', nestedClass: null }
    case 'number':
      return { type: 'double', nestedClass: null }
    case 'boolean':
      return { type: 'bool', nestedClass: null }
    default:
      return { type: 'dynamic', nestedClass: null }
  }
}
