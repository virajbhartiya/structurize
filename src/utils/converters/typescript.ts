import { capitalizeFirstLetter } from '../converter'

export function convertToTypeScript(
  data: Record<string, unknown>,
  interfaceName: string = 'IApiResponse',
  indentLevel: number = 0
): string {
  const indent = '  '.repeat(indentLevel)
  let result = `${indent}export interface ${interfaceName} {\n`
  const nestedInterfaces: string[] = []

  for (const [key, value] of Object.entries(data)) {
    const { type, nestedInterface } = getTypeScriptTypeWithNesting(
      value,
      capitalizeFirstLetter(key) + 'Type',
      0 // Change this to 0 to remove indentation for nested interfaces
    )
    result += `${indent}  ${key}: ${type};\n`
    if (nestedInterface) {
      nestedInterfaces.push(nestedInterface)
    }
  }
  result += `${indent}}\n\n`

  // Add class implementation
  result += `${indent}export class ${interfaceName.slice(
    1
  )} implements ${interfaceName} {\n`
  for (const [key, value] of Object.entries(data)) {
    const { type } = getTypeScriptTypeWithNesting(
      value,
      capitalizeFirstLetter(key) + 'Type',
      indentLevel + 1
    )
    result += `${indent}  ${key}: ${type};\n`
  }

  // Constructor
  result += `\n${indent}  constructor(data: ${interfaceName}) {\n`
  for (const key of Object.keys(data)) {
    result += `${indent}    this.${key} = data.${key};\n`
  }
  result += `${indent}  }\n\n`

  // fromJson static method
  result += `${indent}  static fromJson(json: string): ${interfaceName.slice(
    1
  )} {\n`
  result += `${indent}    return new ${interfaceName.slice(
    1
  )}(JSON.parse(json));\n`
  result += `${indent}  }\n\n`

  // toJson method
  result += `${indent}  toJson(): string {\n`
  result += `${indent}    return JSON.stringify(this);\n`
  result += `${indent}  }\n`

  result += `${indent}}\n\n`
  result += nestedInterfaces.join('\n\n')
  return result.trimEnd() + '\n'
}

function getTypeScriptTypeWithNesting(
  value: unknown,
  nestedInterfaceName: string,
  indentLevel: number
): { type: string; nestedInterface: string | null } {
  if (value === null) return { type: 'null', nestedInterface: null }
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'any[]', nestedInterface: null }
    const { type, nestedInterface } = getTypeScriptTypeWithNesting(
      value[0],
      nestedInterfaceName,
      indentLevel
    )
    return {
      type: `${type}[]`,
      nestedInterface: nestedInterface,
    }
  }
  if (typeof value === 'object') {
    const nestedResult = convertToTypeScript(
      value as Record<string, unknown>,
      nestedInterfaceName,
      0
    )
    return { type: nestedInterfaceName, nestedInterface: nestedResult }
  }
  return { type: typeof value, nestedInterface: null }
}
