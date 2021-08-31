import fs from 'fs'
import { resolve } from 'path'
import { LanguageGeneratorResult, ModuleOverview } from '../types'

export function generateJSON(
  filePath: string,
  withModules: boolean,
  moduleOverview: ModuleOverview,
  modules: string[] = [],
  modFiles: string[] = []
): LanguageGeneratorResult {
  const gen = new languageGenerator(filePath, moduleOverview, modules, modFiles)
  const content = gen.generateJSON(withModules)
  return { content: content, log: gen.log }
}

export function generateJavaLegacy(
  filePath: string,
  withModules: boolean,
  moduleOverview: ModuleOverview,
  modules: string[] = [],
  modFiles: string[] = []
): LanguageGeneratorResult {
  const gen = new languageGenerator(filePath, moduleOverview, modules, modFiles)
  return { content: gen.generateJavaLegacy(withModules), log: gen.log }
}

export function generateBedrock(
  filePath: string,
  withModules: boolean,
  moduleOverview: ModuleOverview,
  modules: string[] = []
): LanguageGeneratorResult {
  const gen = new languageGenerator(filePath, moduleOverview, modules)
  return { content: gen.generateBedrock(withModules), log: gen.log }
}

function ensureAscii(value: string): string {
  const arr: string[] = []
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    arr[i] = code < 128 ? value[i] : `\\u${code.toString(16).padStart(4, '0')}`
  }
  return arr.join('')
}

export class languageGenerator {
  filePath: string
  moduleOverview?: ModuleOverview
  modules: string[]
  modFiles: string[]
  log: string[]

  constructor(
    filePath: string,
    moduleOverview?: ModuleOverview,
    modules: string[] = [],
    modFiles: string[] = []
  ) {
    this.filePath = resolve(filePath)
    this.moduleOverview = moduleOverview
    this.modules = modules
    this.modFiles = modFiles
    this.log = []
  }

  _appendLog(entry: string | string[]): void {
    this.log.push(...entry)
  }

  getContent(): Record<string, string> {
    let content: Record<string, string> = {}
    const data = fs.readFileSync(this.filePath, { flag: 'r', encoding: 'utf8' })
    if (this.filePath.endsWith('.json')) {
      content = JSON.parse(data)
    } else if (this.filePath.endsWith('.lang')) {
      content = this.langToJSON(data)
    }
    return content
  }

  mergeModules(content: Record<string, string>): Record<string, string> {
    const modules = this.modules || []
    const modulePath = this.moduleOverview?.modulePath || ''
    for (const module of modules) {
      const addFile = resolve(modulePath, module, 'add.json')
      if (fs.existsSync(addFile)) {
        const addContent = JSON.parse(
          fs.readFileSync(addFile, { encoding: 'utf8' })
        )
        for (const k in addContent) {
          content[k] = addContent[k]
        }
      }
      const removeFile = resolve(modulePath, module, 'remove.json')
      if (fs.existsSync(removeFile)) {
        const removeContent = JSON.parse(
          fs.readFileSync(removeFile, { encoding: 'utf8' })
        )
        for (const k in removeContent) {
          if (content[removeContent[k]]) {
            delete content[removeContent[k]]
          } else {
            this.log.push(`Key "${removeContent[k]}" does not exist, skipping.`)
          }
        }
      }
    }
    return content
  }

  mergeMods(content: Record<string, string>): Record<string, string> {
    if (this.modFiles) {
      for (const mod of this.modFiles) {
        let modContent: Record<string, string> = {}
        const data = fs.readFileSync(`${mod}`, { encoding: 'utf8' })
        if (mod.endsWith('.lang')) {
          modContent = this.langToJSON(data)
        }
        if (mod.endsWith('.json')) {
          modContent = JSON.parse(data)
        }
        for (const k in modContent) {
          content[k] = modContent[k]
        }
      }
    }
    return content
  }

  generateJSON(withModules: boolean): string {
    let content = this.getContent()
    if (withModules) {
      content = this.mergeModules(content)
    }
    return ensureAscii(JSON.stringify(content, null, 4))
  }

  generateJavaLegacy(withModules: boolean): string {
    let content = this.getContent()
    if (withModules) {
      content = this.mergeModules(content)
    }
    return this.JSONToLang(content)
  }

  generateBedrock(withModules: boolean): string {
    let content = this.getContent()
    if (withModules) {
      content = this.mergeModules(content)
    }
    return this.JSONToLang(content).replace(/\n/g, '\t#\n')
  }

  langToJSON(content: string): Record<string, string> {
    const result: Record<string, string> = {}
    for (const value of content.replace(/\r\n/g, '\n').split('\n')) {
      if (value.trim() !== '' && !value.startsWith('#')) {
        const keyValuePair = value.split('=', 2)
        if (keyValuePair.length < 2) {
          this._appendLog(`Warning: Invalid entry "${value}".`)
          continue
        }
        result[keyValuePair[0].trim()] = keyValuePair[1].trim()
      }
    }
    return result
  }

  JSONToLang(object: Record<string, string>): string {
    const arr = []
    for (const k in object) {
      arr.push(`${k}=${object[k]}`)
    }
    return arr.join('\n')
  }
}
