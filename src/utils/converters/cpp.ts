import { capitalizeFirstLetter } from '../converter'

export function convertToCpp(
  data: Record<string, unknown>,
  className: string = 'ApiResponse',
  indentLevel: number = 0
): string {
  const indent = '    '.repeat(indentLevel)
  let result = `#include <nlohmann/json.hpp>\n#include <string>\n#include <vector>\n\n`
  result += `${indent}class ${className} {\n`
  result += `${indent}public:\n`
  const nestedClasses: string[] = []

  for (const [key, value] of Object.entries(data)) {
    const { type, nestedClass } = getCppTypeWithNesting(
      value,
      capitalizeFirstLetter(key),
      indentLevel + 1
    )
    result += `${indent}    ${type} ${key};\n`
    if (nestedClass) {
      nestedClasses.push(nestedClass)
    }
  }

  // Constructor
  result += `\n${indent}    ${className}() {}\n\n`

  // Parameterized constructor
  result += `${indent}    ${className}(\n`
  for (const [key, value] of Object.entries(data)) {
    const { type } = getCppTypeWithNesting(
      value,
      capitalizeFirstLetter(key),
      indentLevel + 1
    )
    result += `${indent}        ${type} ${key},\n`
  }
  result = result.slice(0, -2) + `\n${indent}    ) :\n`
  for (const key of Object.keys(data)) {
    result += `${indent}        ${key}(${key}),\n`
  }
  result = result.slice(0, -2) + ` {}\n\n`

  // Serialise something (cuz c++ cant auto bruh)
  result += `${indent}    nlohmann::json to_json() const {\n`
  result += `${indent}        return nlohmann::json{\n`
  for (const key of Object.keys(data)) {
    result += `${indent}            { "${key}", ${key} },\n`
  }
  result = result.slice(0, -2) + `\n${indent}        };\n`
  result += `${indent}    }\n\n`

  // Deserialise something (cuz c++ cant auto bruh)
  result += `${indent}    static ${className} from_json(const nlohmann::json& j) {\n`
  result += `${indent}        return ${className}{\n`
  for (const [key, value] of Object.entries(data)) {
    result += `${indent}            j.at("${key}").get<${getCppType(
      value
    )}>(),\n`
  }
  result = result.slice(0, -2) + `\n${indent}        };\n`
  result += `${indent}    }\n`

  result += `${indent}};\n\n`

  result += nestedClasses.join('\n')
  return result.trimEnd() + '\n'
}

function getCppTypeWithNesting(
  value: unknown,
  nestedClassName: string,
  indentLevel: number
): { type: string; nestedClass: string | null } {
  if (value === null) return { type: 'std::string', nestedClass: null }
  if (Array.isArray(value)) {
    if (value.length === 0)
      return { type: 'std::vector<std::string>', nestedClass: null }
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
      indentLevel
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
      return { type: 'std::string', nestedClass: null }
  }
}

function getCppType(value: unknown): string {
  if (value === null) return 'std::string'
  if (Array.isArray(value)) return 'std::vector<std::string>'
  switch (typeof value) {
    case 'string':
      return 'std::string'
    case 'number':
      return Number.isInteger(value) ? 'int' : 'double'
    case 'boolean':
      return 'bool'
    default:
      return 'std::string'
  }
}
