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

  // Add toJson method
  result += `${indent}    public JSONObject toJson() {\n`
  result += `${indent}        JSONObject json = new JSONObject();\n`
  for (const [key, value] of Object.entries(data)) {
    const { type } = getJavaTypeWithNesting(
      value,
      capitalizeFirstLetter(key),
      indentLevel + 1
    )
    if (type.startsWith('List<')) {
      result += `${indent}        JSONArray ${key}Array = new JSONArray();\n`
      result += `${indent}        for (${type.slice(5, -1)} item : ${key}) {\n`
      result += `${indent}            ${key}Array.put(item${
        type.includes('Object') ? '' : '.toJson()'
      });\n`
      result += `${indent}        }\n`
      result += `${indent}        json.put("${key}", ${key}Array);\n`
    } else if (['String', 'Integer', 'Double', 'Boolean'].includes(type)) {
      result += `${indent}        json.put("${key}", ${key});\n`
    } else {
      result += `${indent}        json.put("${key}", ${key}.toJson());\n`
    }
  }
  result += `${indent}        return json;\n`
  result += `${indent}    }\n\n`

  // Add fromJson method
  result += `${indent}    public static ${className} fromJson(JSONObject json) {\n`
  result += `${indent}        ${className} obj = new ${className}();\n`
  for (const [key, value] of Object.entries(data)) {
    const { type } = getJavaTypeWithNesting(
      value,
      capitalizeFirstLetter(key),
      indentLevel + 1
    )
    const capitalizedKey = capitalizeFirstLetter(key)
    if (type.startsWith('List<')) {
      const itemType = type.slice(5, -1)
      result += `${indent}        if (json.has("${key}")) {\n`
      result += `${indent}            JSONArray ${key}Array = json.getJSONArray("${key}");\n`
      result += `${indent}            obj.${key} = new ArrayList<>();\n`
      result += `${indent}            for (int i = 0; i < ${key}Array.length(); i++) {\n`
      if (['String', 'Integer', 'Double', 'Boolean'].includes(itemType)) {
        result += `${indent}                obj.${key}.add(${key}Array.get${itemType}(i));\n`
      } else {
        result += `${indent}                obj.${key}.add(${itemType}.fromJson(${key}Array.getJSONObject(i)));\n`
      }
      result += `${indent}            }\n`
      result += `${indent}        }\n`
    } else if (type === 'String') {
      result += `${indent}        if (json.has("${key}")) obj.set${capitalizedKey}(json.getString("${key}"));\n`
    } else if (type === 'Integer') {
      result += `${indent}        if (json.has("${key}")) obj.set${capitalizedKey}(json.getInt("${key}"));\n`
    } else if (type === 'Double') {
      result += `${indent}        if (json.has("${key}")) obj.set${capitalizedKey}(json.getDouble("${key}"));\n`
    } else if (type === 'Boolean') {
      result += `${indent}        if (json.has("${key}")) obj.set${capitalizedKey}(json.getBoolean("${key}"));\n`
    } else {
      result += `${indent}        if (json.has("${key}")) obj.set${capitalizedKey}(${type}.fromJson(json.getJSONObject("${key}")));\n`
    }
  }
  result += `${indent}        return obj;\n`
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
      0
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
