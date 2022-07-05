import { RawLanguage } from '../types'

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

export function javaLangToJSON(content: string): RawLanguage {
  const entries = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/#.*$/g, '').trimStart())
    .filter((line) => line !== '' && line.includes('='))
    .map((line) => line.split('=', 2))
  return Object.fromEntries(entries)
}

export function bedrockLangToJSON(content: string): RawLanguage {
  const entries = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/(?:##|\t#).*$/g, '').trimStart())
    .filter((line) => line !== '' && line.includes('='))
    .map((line) => line.split('=', 2))
  return Object.fromEntries(entries)
}

export function JSONToJavaLang(obj: RawLanguage): string {
  return Object.entries(obj)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
}

export function JSONToBedrockLang(obj: RawLanguage): string {
  return Object.entries(obj)
    .map(([key, value]) => `${key}=${value}\t#`)
    .join('\n')
}

export function priorityToArray(content: string): string[] {
  const entries = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/#.*$/g, '').trim())
    .filter((line) => line !== '')
  return entries
}
