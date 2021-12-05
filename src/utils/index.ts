import { ModuleInfo, NameContentList } from '../types'
import { LanguageGenerator } from './LanguageGenerator'
export { LanguageGenerator } from './LanguageGenerator'

export function ensureAscii(value: string): string {
  const arr: string[] = []
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    arr[i] = code < 128 ? value[i] : `\\u${code.toString(16).padStart(4, '0')}`
  }
  return arr.join('')
}

export function JELangToJSON(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (let value of content.replace(/\r\n/g, '\n').split('\n')) {
    value = value.replace(/#.*$/g, '').trim()
    if (value !== '') {
      const keyValuePair = value.split('=', 2)
      if (keyValuePair.length < 2) {
        continue
      }
      result[keyValuePair[0]] = keyValuePair[1]
    }
  }
  return result
}

export function BELangToJSON(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (let value of content.replace(/\r\n/g, '\n').split('\n')) {
    value = value.replace(/##.*$/g, '').trim()
    if (value !== '') {
      const keyValuePair = value.split('=', 2)
      if (keyValuePair.length < 2) {
        continue
      }
      result[keyValuePair[0]] = keyValuePair[1].replace(/\t#.*$/g, '')
    }
  }
  return result
}

export function JSONToJELang(obj: Record<string, string>): string {
  const arr = []
  for (const k in obj) {
    arr.push(`${k}=${obj[k]}`)
  }
  return arr.join('\n')
}

export function JSONToBELang(obj: Record<string, string>): string {
  const arr = []
  for (const k in obj) {
    arr.push(`${k}=${obj[k]}\t#`)
  }
  return arr.join('\n')
}

export async function generateJSON({
  resourcePath,
  mainLanguageFile,
  modulePath,
  modules = [],
  modFiles = {},
}: {
  resourcePath: string
  mainLanguageFile: string
  modulePath: string
  modules?: ModuleInfo[]
  modFiles?: NameContentList
}): Promise<NameContentList> {
  const gen = new LanguageGenerator({
    resourcePath,
    modulePath,
    modules,
    modFiles,
  })
  return await gen.mergeMods(await gen.mergeModules(mainLanguageFile))
}
