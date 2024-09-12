import { capitalizeFirstLetter } from '../converter'

export function convertToCSharp(
  data: Record<string, unknown>,
  className: string = 'ApiResponse',
  indentLevel: number = 0
): string {
  const indent = '    '.repeat(indentLevel)
  let result = `${indent}public class ${className}\n${indent}{\n`
  const nestedClasses: string[] = []

  for (const [key, value] of Object.entries(data)) {
    const { type, nestedClass } = getCSharpTypeWithNesting(
      value,
      capitalizeFirstLetter(key),
      indentLevel + 1
    )
    const capitalizedKey = capitalizeFirstLetter(key)
    result += `${indent}    public ${type} ${capitalizedKey} { get; set; }\n`
    if (nestedClass) {
      nestedClasses.push(nestedClass)
    }
  }

  // Constructor
  result += `\n${indent}    public ${className}()\n${indent}    {\n${indent}    }\n\n`

  // Parameterized constructor
  result += `${indent}    public ${className}(\n`
  for (const [key, value] of Object.entries(data)) {
    const { type } = getCSharpTypeWithNesting(
      value,
      capitalizeFirstLetter(key),
      indentLevel + 1
    )
    result += `${indent}        ${type} ${key.toLowerCase()},\n`
  }
  result = result.slice(0, -2) + '\n' // Remove last comma
  result += `${indent}    )\n${indent}    {\n`
  for (const key of Object.keys(data)) {
    const capitalizedKey = capitalizeFirstLetter(key)
    result += `${indent}        ${capitalizedKey} = ${key.toLowerCase()};\n`
  }
  result += `${indent}    }\n\n`

  // FromJson method
  result += `${indent}    public static ${className} FromJson(string json)\n`
  result += `${indent}    {\n`
  result += `${indent}        return System.Text.Json.JsonSerializer.Deserialize<${className}>(json);\n`
  result += `${indent}    }\n\n`

  // ToJson method
  result += `${indent}    public string ToJson()\n`
  result += `${indent}    {\n`
  result += `${indent}        return System.Text.Json.JsonSerializer.Serialize(this);\n`
  result += `${indent}    }\n`

  result += `${indent}}\n\n`
  result += nestedClasses.join('\n')
  return result.trimEnd() + '\n'
}

function getCSharpTypeWithNesting(
  value: unknown,
  nestedClassName: string,
  indentLevel: number
): { type: string; nestedClass: string | null } {
  if (value === null) return { type: 'object', nestedClass: null }
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'List<object>', nestedClass: null }
    const { type, nestedClass } = getCSharpTypeWithNesting(
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
    const nestedResult = convertToCSharp(
      value as Record<string, unknown>,
      nestedClassName,
      indentLevel
    )
    return { type: nestedClassName, nestedClass: nestedResult }
  }
  switch (typeof value) {
    case 'string':
      return { type: 'string', nestedClass: null }
    case 'number':
      return { type: 'double', nestedClass: null }
    case 'boolean':
      return { type: 'bool', nestedClass: null }
    default:
      return { type: 'object', nestedClass: null }
  }
}
