import { capitalizeFirstLetter } from '../converter'

export function convertToJava(
  data: Record<string, unknown>,
  className: string = 'ApiResponse',
  indentLevel: number = 0
): string {
  const indent = '    '.repeat(indentLevel)
  let result = `${indentLevel === 0 ? '' : indent}public class ${className} {\n`
  const nestedClasses: string[] = []

  for (const [key, value] of Object.entries(data)) {
    const { type, nestedClass } = getJavaTypeWithNesting(
      value,
      capitalizeFirstLetter(key),
      indentLevel + 1
    )

    result += `${indent}    private ${type} ${key};\n`
    if (nestedClass) {
      nestedClasses.push(nestedClass)
    }
  }

  // Default constructor
  result += `\n${indent}    public ${className}() {}\n\n`

  // Parameterized constructor
  result += `${indent}    public ${className}(`
  result += Object.entries(data)
    .map(([key, value]) => {
      const { type } = getJavaTypeWithNesting(
        value,
        capitalizeFirstLetter(key),
        indentLevel + 1
      )
      return `${type} ${key}`
    })
    .join(', ')
  result += `) {\n`
  for (const key of Object.keys(data)) {
    result += `${indent}        this.${key} = ${key};\n`
  }
  result += `${indent}    }\n\n`

  // Getters and setters
  for (const [key, value] of Object.entries(data)) {
    const { type } = getJavaTypeWithNesting(
      value,
      capitalizeFirstLetter(key),
      indentLevel + 1
    )
    const capitalizedKey = capitalizeFirstLetter(key)
    result += `${indent}    public ${type} get${capitalizedKey}() {\n${indent}        return ${key};\n${indent}    }\n\n`
    result += `${indent}    public void set${capitalizedKey}(${type} ${key}) {\n${indent}        this.${key} = ${key};\n${indent}    }\n\n`
  }

  // fromJson method
  result += `${indent}    public static ${className} fromJson(String json) {\n`
  result += `${indent}        // TODO: Implement JSON deserialization\n`
  result += `${indent}        return new ${className}();\n`
  result += `${indent}    }\n\n`

  // toJson method
  result += `${indent}    public String toJson() {\n`
  result += `${indent}        // TODO: Implement JSON serialization\n`
  result += `${indent}        return "";\n`
  result += `${indent}    }\n`

  result += `${indentLevel === 0 ? '' : indent}}\n\n`
  result += nestedClasses.join('\n')
  return result.trimEnd() + '\n'
}

function getJavaTypeWithNesting(
  value: unknown,
  nestedClassName: string,
  indentLevel: number
): { type: string; nestedClass: string | null } {
  if (value === null) return { type: 'Object', nestedClass: null }
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'List<Object>', nestedClass: null }
    const { type, nestedClass } = getJavaTypeWithNesting(
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
    const nestedResult = convertToJava(
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
      return { type: 'boolean', nestedClass: null }
    default:
      return { type: 'Object', nestedClass: null }
  }
}
