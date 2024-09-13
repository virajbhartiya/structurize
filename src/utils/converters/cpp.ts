import { capitalizeFirstLetter } from '../converter'

export function convertToCpp(
  data: Record<string, unknown>,
  className: string = 'ApiResponse',
  indentLevel: number = 0
): string {
  const indent = '  '.repeat(indentLevel)
  let result = `${indent}class ${className} {\n`
  let publicSection = `${indent}public:\n`
  let privateSection = `${indent}private:\n`
  const nestedClasses: string[] = []

  for (const [key, value] of Object.entries(data)) {
    const { type, nestedClass } = getCppTypeWithNesting(
      value,
      capitalizeFirstLetter(key) + 'Type',
      indentLevel + 1
    )
    privateSection += `${indent}  ${type} ${key};\n`
    publicSection += `${indent}  ${type} get${capitalizeFirstLetter(
      key
    )}() const { return ${key}; }\n`
    publicSection += `${indent}  void set${capitalizeFirstLetter(
      key
    )}(${type} value) { ${key} = value; }\n\n`
    if (nestedClass) {
      nestedClasses.push(nestedClass)
    }
  }

  // Constructor
  publicSection += `${indent}  ${className}() = default;\n\n`
  publicSection += `${indent}  explicit ${className}(const nlohmann::json& json) {\n`
  for (const key of Object.keys(data)) {
    publicSection += `${indent}    ${key} = json["${key}"];\n`
  }
  publicSection += `${indent}  }\n\n`

  // toJson method
  publicSection += `${indent}  nlohmann::json toJson() const {\n`
  publicSection += `${indent}    return nlohmann::json{\n`
  for (const key of Object.keys(data)) {
    publicSection += `${indent}      {"${key}", ${key}},\n`
  }
  publicSection += `${indent}    };\n`
  publicSection += `${indent}  }\n`

  result += privateSection + '\n' + publicSection + `${indent}};\n\n`
  // Add nested classes without additional indentation
  result += nestedClasses.join('\n\n')
  return result.trimEnd() + '\n'
}

function getCppTypeWithNesting(
  value: unknown,
  nestedClassName: string,
  indentLevel: number
): { type: string; nestedClass: string | null } {
  if (value === null) return { type: 'std::nullptr_t', nestedClass: null }
  if (Array.isArray(value)) {
    if (value.length === 0)
      return { type: 'std::vector<std::any>', nestedClass: null }
    const { type, nestedClass } = getCppTypeWithNesting(
      value[0],
      nestedClassName,
      indentLevel
    )
    return {
      type: `std::vector<${type}>`,
      nestedClass: nestedClass,
    }
  }
  if (typeof value === 'object') {
    const nestedResult = convertToCpp(
      value as Record<string, unknown>,
      nestedClassName,
      0
    )
    return { type: nestedClassName, nestedClass: nestedResult }
  }
  switch (typeof value) {
    case 'string':
      return { type: 'std::string', nestedClass: null }
    case 'number':
      return {
        type: Number.isInteger(value) ? 'int' : 'double',
        nestedClass: null,
      }
    case 'boolean':
      return { type: 'bool', nestedClass: null }
    default:
      return { type: 'std::any', nestedClass: null }
  }
}
