export function ensureAscii(value: string): string {
  const arr: string[] = []
  for (let i = 0; i < value.length; i++) {
    arr.push(
      value[i] < '\u00FF'
        ? value[i]
        : `\\u${value[i].charCodeAt(0).toString(16).padStart(4, '0')}`
    )
  }
  return arr.join('')
}

export function javaLangToJSON(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (let value of content.replace(/\r\n/g, '\n').split('\n')) {
    value = value.replace(/#.*$/g, '').trimStart()
    if (value !== '' && value.includes('=')) {
      const keyValuePair = value.split('=', 2)
      result[keyValuePair[0]] = keyValuePair[1]
    }
  }
  return result
}

export function bedrockLangToJSON(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (let value of content.replace(/\r\n/g, '\n').split('\n')) {
    value = value.replace(/(?:##|\t).*$/g, '').trimStart()
    if (value !== '' && value.includes('=')) {
      const keyValuePair = value.split('=', 2)
      result[keyValuePair[0]] = keyValuePair[1]
    }
  }
  return result
}

export function JSONToJavaLang(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
}

export function JSONToBedrockLang(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([key, value]) => `${key}=${value}\t#`)
    .join('\n')
}
