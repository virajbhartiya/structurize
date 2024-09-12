import { capitalizeFirstLetter } from '../converter'

export function convertToC(
  data: Record<string, unknown>,
  structName: string = 'ApiResponse',
  indentLevel: number = 0
): string {
  const indent = '    '.repeat(indentLevel)
  let result = `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <cjson/cJSON.h>\n\n`
  result += `typedef struct ${structName} {\n`
  const nestedStructs: string[] = []

  // Struct members
  for (const [key, value] of Object.entries(data)) {
    const { type, nestedStruct } = getCTypeWithNesting(
      value,
      capitalizeFirstLetter(key),
      indentLevel + 1
    )
    result += `${indent}    ${type} ${key};\n`
    if (nestedStruct) {
      nestedStructs.push(nestedStruct)
    }
  }

  result += `${indent}} ${structName};\n\n`

  // Serialization
  result += `cJSON* ${structName}_to_json(const ${structName}* obj) {\n`
  result += `${indent}    cJSON* json = cJSON_CreateObject();\n`
  for (const key of Object.keys(data)) {
    const { type } = getCTypeWithNesting(
      data[key],
      capitalizeFirstLetter(key),
      indentLevel
    )
    if (type === 'char*') {
      result += `${indent}    cJSON_AddStringToObject(json, "${key}", obj->${key});\n`
    } else if (type === 'int') {
      result += `${indent}    cJSON_AddNumberToObject(json, "${key}", obj->${key});\n`
    } else if (type === 'bool') {
      result += `${indent}    cJSON_AddBoolToObject(json, "${key}", obj->${key});\n`
    }
  }
  result += `${indent}    return json;\n`
  result += `}\n\n`

  // Deserialization 
  result += `void ${structName}_from_json(${structName}* obj, const cJSON* json) {\n`
  for (const [key, value] of Object.entries(data)) {
    const { type } = getCTypeWithNesting(
      value,
      capitalizeFirstLetter(key),
      indentLevel
    )
    if (type === 'char*') {
      result += `${indent}    cJSON* json_${key} = cJSON_GetObjectItem(json, "${key}");\n`
      result += `${indent}    if (json_${key} && cJSON_IsString(json_${key})) {\n`
      result += `${indent}        obj->${key} = strdup(json_${key}->valuestring);\n`
      result += `${indent}    }\n`
    } else if (type === 'int') {
      result += `${indent}    cJSON* json_${key} = cJSON_GetObjectItem(json, "${key}");\n`
      result += `${indent}    if (json_${key} && cJSON_IsNumber(json_${key})) {\n`
      result += `${indent}        obj->${key} = json_${key}->valueint;\n`
      result += `${indent}    }\n`
    } else if (type === 'bool') {
      result += `${indent}    cJSON* json_${key} = cJSON_GetObjectItem(json, "${key}");\n`
      result += `${indent}    if (json_${key} && cJSON_IsBool(json_${key})) {\n`
      result += `${indent}        obj->${key} = cJSON_IsTrue(json_${key});\n`
      result += `${indent}    }\n`
    }
  }
  result += `}\n\n`

  result += nestedStructs.join('\n')
  return result.trimEnd() + '\n'
}

function getCTypeWithNesting(
  value: unknown,
  nestedStructName: string,
  indentLevel: number
): { type: string; nestedStruct: string | null } {
  if (value === null) return { type: 'char*', nestedStruct: null }
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'char**', nestedStruct: null }
    const { type, nestedStruct } = getCTypeWithNesting(
      value[0],
      nestedStructName,
      indentLevel
    )
    return {
      type: `char**`, // Default to char* for simplicity in arrays
      nestedStruct: nestedStruct,
    }
  }
  if (typeof value === 'object') {
    const nestedResult = convertToC(
      value as Record<string, unknown>,
      nestedStructName,
      indentLevel
    )
    return { type: `struct ${nestedStructName}`, nestedStruct: nestedResult }
  }
  switch (typeof value) {
    case 'string':
      return { type: 'char*', nestedStruct: null }
    case 'number':
      return {
        type: Number.isInteger(value) ? 'int' : 'double',
        nestedStruct: null,
      }
    case 'boolean':
      return { type: 'bool', nestedStruct: null }
    default:
      return { type: 'char*', nestedStruct: null }
  }
}
