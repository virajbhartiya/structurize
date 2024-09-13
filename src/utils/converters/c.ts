import { capitalizeFirstLetter } from '../converter'

export function convertToC(
  data: Record<string, unknown>,
  structName: string = 'ApiResponse',
  indentLevel: number = 0
): string {
  const indent = '  '.repeat(indentLevel)
  let result = `${indent}typedef struct ${structName} {\n`
  const nestedStructs: string[] = []

  for (const [key, value] of Object.entries(data)) {
    const { type, nestedStruct } = getCTypeWithNesting(
      value,
      capitalizeFirstLetter(key) + 'Type',
      0
    )
    result += `${indent}  ${type} ${key};\n`
    if (nestedStruct) {
      nestedStructs.push(nestedStruct)
    }
  }
  result += `${indent}} ${structName};\n\n`

  // Add function prototypes
  result += `${indent}${structName}* ${structName}_create(void);\n`
  result += `${indent}void ${structName}_destroy(${structName}* obj);\n`
  result += `${indent}${structName}* ${structName}_from_json(const char* json);\n`
  result += `${indent}char* ${structName}_to_json(const ${structName}* obj);\n\n`

  // Add function implementations
  result += `${indent}${structName}* ${structName}_create(void) {\n`
  result += `${indent}  return (${structName}*)calloc(1, sizeof(${structName}));\n`
  result += `${indent}}\n\n`

  result += `${indent}void ${structName}_destroy(${structName}* obj) {\n`
  result += `${indent}  if (obj) {\n`
  // Add cleanup for string members
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      result += `${indent}    free(obj->${key});\n`
    }
  }
  result += `${indent}    free(obj);\n`
  result += `${indent}  }\n`
  result += `${indent}}\n\n`

  // Implement from_json function
  result += `${indent}${structName}* ${structName}_from_json(const char* json) {\n`
  result += `${indent}  ${structName}* obj = ${structName}_create();\n`
  result += `${indent}  cJSON* root = cJSON_Parse(json);\n`
  result += `${indent}  if (root == NULL) {\n`
  result += `${indent}    ${structName}_destroy(obj);\n`
  result += `${indent}    return NULL;\n`
  result += `${indent}  }\n\n`

  for (const [key, value] of Object.entries(data)) {
    const { type } = getCTypeWithNesting(
      value,
      capitalizeFirstLetter(key) + 'Type',
      0
    )
    result += `${indent}  cJSON* ${key}_json = cJSON_GetObjectItemCaseSensitive(root, "${key}");\n`
    result += `${indent}  if (${key}_json) {\n`
    if (type === 'int') {
      result += `${indent}    obj->${key} = ${key}_json->valueint;\n`
    } else if (type === 'double') {
      result += `${indent}    obj->${key} = ${key}_json->valuedouble;\n`
    } else if (type === 'char*') {
      result += `${indent}    obj->${key} = strdup(${key}_json->valuestring);\n`
    } else if (type === 'bool') {
      result += `${indent}    obj->${key} = cJSON_IsTrue(${key}_json);\n`
    }
    result += `${indent}  }\n`
  }

  result += `${indent}  cJSON_Delete(root);\n`
  result += `${indent}  return obj;\n`
  result += `${indent}}\n\n`

  // Implement to_json function
  result += `${indent}char* ${structName}_to_json(const ${structName}* obj) {\n`
  result += `${indent}  cJSON* root = cJSON_CreateObject();\n`

  for (const [key, value] of Object.entries(data)) {
    const { type } = getCTypeWithNesting(
      value,
      capitalizeFirstLetter(key) + 'Type',
      0
    )
    if (type === 'int') {
      result += `${indent}  cJSON_AddNumberToObject(root, "${key}", obj->${key});\n`
    } else if (type === 'double') {
      result += `${indent}  cJSON_AddNumberToObject(root, "${key}", obj->${key});\n`
    } else if (type === 'char*') {
      result += `${indent}  if (obj->${key}) cJSON_AddStringToObject(root, "${key}", obj->${key});\n`
    } else if (type === 'bool') {
      result += `${indent}  cJSON_AddBoolToObject(root, "${key}", obj->${key});\n`
    }
  }

  result += `${indent}  char* json_str = cJSON_Print(root);\n`
  result += `${indent}  cJSON_Delete(root);\n`
  result += `${indent}  return json_str;\n`
  result += `${indent}}\n\n`

  result += nestedStructs.join('\n')
  return result.trimEnd() + '\n'
}

function getCTypeWithNesting(
  value: unknown,
  nestedStructName: string,
  indentLevel: number
): { type: string; nestedStruct: string | null } {
  if (value === null) return { type: 'void*', nestedStruct: null }
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'void*', nestedStruct: null }
    const { type, nestedStruct } = getCTypeWithNesting(
      value[0],
      nestedStructName,
      indentLevel
    )
    return {
      type: `${type}*`,
      nestedStruct: nestedStruct,
    }
  }
  if (typeof value === 'object') {
    const nestedResult = convertToC(
      value as Record<string, unknown>,
      nestedStructName,
      0
    )
    return { type: `${nestedStructName}*`, nestedStruct: nestedResult }
  }
  switch (typeof value) {
    case 'number':
      return {
        type: Number.isInteger(value) ? 'int' : 'double',
        nestedStruct: null,
      }
    case 'string':
      return { type: 'char*', nestedStruct: null }
    case 'boolean':
      return { type: 'bool', nestedStruct: null }
    default:
      return { type: 'void*', nestedStruct: null }
  }
}
