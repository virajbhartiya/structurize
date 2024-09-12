import { convertToCSharp } from './converters/csharp'
import { convertToDart } from './converters/dart'
import { convertToJava } from './converters/java'
import { convertToJavaScript } from './converters/javascript'
import { convertToTypeScript } from './converters/typescript'
import { convertToGo } from './converters/go'
import { convertToPython } from './converters/python'
import { convertToCpp } from './converters/cpp'
export function convertToInterface(
  apiResponse: string,
  language: string
): string {
  try {
    const data = JSON.parse(apiResponse)

    switch (language) {
      case 'typescript':
        return convertToTypeScript(data)
      case 'java':
        return convertToJava(data)
      case 'csharp':
        return convertToCSharp(data)
      case 'dart':
        return convertToDart(data)
      case 'javascript':
        return convertToJavaScript(data)
      case 'go':
        return convertToGo(data)
      case 'python':
        return convertToPython(data)
      case 'cpp':
        return convertToCpp(data)
      default:
        throw new Error('Unsupported language')
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return `Error: ${error.message}`
    }
    return 'An unknown error occurred'
  }
}

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
