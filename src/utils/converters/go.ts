import { capitalizeFirstLetter } from '../converter'

export function convertToGo(
  data: Record<string, unknown>,
  structName: string = 'ApiResponse',
  indentLevel: number = 0
): string {
  const indent = '\t'.repeat(indentLevel)
  let result = `${indent}type ${structName} struct {\n`
  const nestedStructs: string[] = []

  for (const [key, value] of Object.entries(data)) {
    const fieldName = capitalizeFirstLetter(key)
    const { type, nestedStruct } = getGoTypeWithNesting(
      value,
      fieldName + 'Type',
      indentLevel + 1
    )
    result += `${indent}\t${fieldName} ${type} \`json:"${key}"\`\n`
    if (nestedStruct) {
      nestedStructs.push(nestedStruct)
    }
  }
  result += `${indent}}\n\n`

  // New function (constructor-like)
  result += `${indent}func New${structName}(data map[string]interface{}) *${structName} {\n`
  result += `${indent}\treturn &${structName}{\n`
  for (const [key, value] of Object.entries(data)) {
    const fieldName = capitalizeFirstLetter(key)
    const { type } = getGoTypeWithNesting(
      value,
      fieldName + 'Type',
      indentLevel + 1
    )
    result += `${indent}\t\t${fieldName}: data["${key}"].(${type}),\n`
  }
  result += `${indent}\t}\n`
  result += `${indent}}\n\n`

  // FromJSON function
  result += `${indent}func ${structName}FromJSON(jsonStr string) (*${structName}, error) {\n`
  result += `${indent}\tvar data map[string]interface{}\n`
  result += `${indent}\terr := json.Unmarshal([]byte(jsonStr), &data)\n`
  result += `${indent}\tif err != nil {\n`
  result += `${indent}\t\treturn nil, err\n`
  result += `${indent}\t}\n`
  result += `${indent}\treturn New${structName}(data), nil\n`
  result += `${indent}}\n\n`

  // ToJSON method
  result += `${indent}func (a *${structName}) ToJSON() (string, error) {\n`
  result += `${indent}\tjsonBytes, err := json.Marshal(a)\n`
  result += `${indent}\tif err != nil {\n`
  result += `${indent}\t\treturn "", err\n`
  result += `${indent}\t}\n`
  result += `${indent}\treturn string(jsonBytes), nil\n`
  result += `${indent}}\n\n`

  result += nestedStructs.join('\n')
  return result.trimEnd() + '\n'
}

function getGoTypeWithNesting(
  value: unknown,
  nestedStructName: string,
  indentLevel: number
): { type: string; nestedStruct: string | null } {
  if (value === null) return { type: 'interface{}', nestedStruct: null }
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: '[]interface{}', nestedStruct: null }
    const { type, nestedStruct } = getGoTypeWithNesting(
      value[0],
      nestedStructName,
      indentLevel
    )
    return {
      type: `[]${type}`,
      nestedStruct: nestedStruct,
    }
  }
  if (typeof value === 'object') {
    const nestedResult = convertToGo(
      value as Record<string, unknown>,
      nestedStructName,
      indentLevel
    )
    return { type: '*' + nestedStructName, nestedStruct: nestedResult }
  }
  if (typeof value === 'number') {
    return {
      type: Number.isInteger(value) ? 'int' : 'float64',
      nestedStruct: null,
    }
  }
  return { type: typeof value, nestedStruct: null }
}
