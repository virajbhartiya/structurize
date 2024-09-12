import { capitalizeFirstLetter } from '../converter'

export function convertToPython(
  data: Record<string, unknown>,
  className: string = 'ApiResponse',
  indentLevel: number = 0
): string {
  const indent = '    '.repeat(indentLevel)
  let result = 'from typing import List, Dict, Any\nimport json\n\n'
  result += `${indent}class ${className}:\n`
  const nestedClasses: string[] = []

  // Type hints
  for (const [key, value] of Object.entries(data)) {
    const { type, nestedClass } = getPythonTypeWithNesting(
      value,
      capitalizeFirstLetter(key) + 'Type',
      indentLevel + 1
    )
    result += `${indent}    ${key}: ${type}\n`
    if (nestedClass) {
      nestedClasses.push(nestedClass)
    }
  }

  // Constructor
  result += `\n${indent}    def __init__(self, data: Dict[str, Any]):\n`
  for (const key of Object.keys(data)) {
    result += `${indent}        self.${key} = data['${key}']\n`
  }

  // from_json class method
  result += `\n${indent}    @classmethod\n`
  result += `${indent}    def from_json(cls, json_str: str) -> '${className}':\n`
  result += `${indent}        data = json.loads(json_str)\n`
  result += `${indent}        return cls(data)\n`

  // to_json method
  result += `\n${indent}    def to_json(self) -> str:\n`
  result += `${indent}        return json.dumps(self.__dict__)\n`

  result += '\n'
  result += nestedClasses.join('\n')
  return result.trimEnd() + '\n'
}

function getPythonTypeWithNesting(
  value: unknown,
  nestedClassName: string,
  indentLevel: number
): { type: string; nestedClass: string | null } {
  if (value === null) return { type: 'None', nestedClass: null }
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'List[Any]', nestedClass: null }
    const { type, nestedClass } = getPythonTypeWithNesting(
      value[0],
      nestedClassName,
      indentLevel
    )
    return {
      type: `List[${type}]`,
      nestedClass: nestedClass,
    }
  }
  if (typeof value === 'object') {
    const nestedResult = convertToPython(
      value as Record<string, unknown>,
      nestedClassName,
      indentLevel
    )
    return { type: nestedClassName, nestedClass: nestedResult }
  }
  switch (typeof value) {
    case 'string':
      return { type: 'str', nestedClass: null }
    case 'number':
      return {
        type: Number.isInteger(value) ? 'int' : 'float',
        nestedClass: null,
      }
    case 'boolean':
      return { type: 'bool', nestedClass: null }
    default:
      return { type: 'Any', nestedClass: null }
  }
}
