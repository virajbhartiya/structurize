import { capitalizeFirstLetter } from '../converter'

export function convertToJavaScript(
  data: Record<string, unknown>,
  className: string = 'ApiResponse',
  indentLevel: number = 0
): string {
  const indent = '  '.repeat(indentLevel)
  let result = `${indent}class ${className} {\n`
  const nestedClasses: string[] = []

  // Constructor
  result += `${indent}  constructor({\n`
  for (const [key] of Object.entries(data)) {
    result += `${indent}    ${key},\n`
  }
  result += `${indent}  }) {\n`
  for (const key of Object.keys(data)) {
    result += `${indent}    this.${key} = ${key};\n`
  }
  result += `${indent}  }\n\n`

  // fromJson static method
  result += `${indent}  static fromJson(json) {\n`
  result += `${indent}    return new ${className}(JSON.parse(json));\n`
  result += `${indent}  }\n\n`

  // toJson method
  result += `${indent}  toJson() {\n`
  result += `${indent}    return JSON.stringify(this);\n`
  result += `${indent}  }\n`

  result += `${indent}}\n\n`

  for (const [key, value] of Object.entries(data)) {
    const { nestedClass } = getJavaScriptTypeWithNesting(
      value,
      capitalizeFirstLetter(key),
      indentLevel + 1
    )
    if (nestedClass) {
      nestedClasses.push(nestedClass)
    }
  }

  result += nestedClasses.join('\n')
  return result.trimEnd() + '\n'
}

function getJavaScriptTypeWithNesting(
  value: unknown,
  nestedClassName: string,
  indentLevel: number
): { type: string; nestedClass: string | null } {
  if (value === null) return { type: 'null', nestedClass: null }
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'Array', nestedClass: null }
    const { type, nestedClass } = getJavaScriptTypeWithNesting(
      value[0],
      nestedClassName,
      indentLevel
    )
    return {
      type: `Array<${type}>`,
      nestedClass: nestedClass,
    }
  }
  if (typeof value === 'object') {
    const nestedResult = convertToJavaScript(
      value as Record<string, unknown>,
      nestedClassName,
      indentLevel
    )
    return { type: nestedClassName, nestedClass: nestedResult }
  }
  return { type: typeof value, nestedClass: null }
}
