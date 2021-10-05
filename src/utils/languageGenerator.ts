import fse from 'fs-extra'
import { resolve } from 'path'
import { LanguageGeneratorResult, ModuleOverview } from '../types'

export async function generateJSON(
  filePath: string,
  withModules: boolean,
  moduleOverview: ModuleOverview,
  modules: string[] = [],
  modFiles: string[] = []
): Promise<LanguageGeneratorResult> {
  const gen = new languageGenerator(filePath, moduleOverview, modules, modFiles)
  return { content: await gen.generateJSON(withModules), log: gen.log }
}

export async function generateJavaLegacy(
  filePath: string,
  withModules: boolean,
  moduleOverview: ModuleOverview,
  modules: string[] = [],
  modFiles: string[] = []
): Promise<LanguageGeneratorResult> {
  const gen = new languageGenerator(filePath, moduleOverview, modules, modFiles)
  return { content: await gen.generateJavaLegacy(withModules), log: gen.log }
}

export async function generateBedrock(
  filePath: string,
  withModules: boolean,
  moduleOverview: ModuleOverview,
  modules: string[] = []
): Promise<LanguageGeneratorResult> {
  const gen = new languageGenerator(filePath, moduleOverview, modules)
  return { content: await gen.generateBedrock(withModules), log: gen.log }
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

  #appendLog(entry: string | string[]): void {
    this.log.push(...entry)
  }

  async getContent(): Promise<Record<string, string>> {
    let content: Record<string, string> = {}
    if (this.filePath.endsWith('.json')) {
      content = await fse.readJSON(this.filePath, { encoding: 'utf8' })
    } else if (this.filePath.endsWith('.lang')) {
      content = this.langToJSON(
        await fse.readFile(this.filePath, { encoding: 'utf8' })
      )
    }
    return content
  }

  async mergeModules(
    content: Record<string, string>
  ): Promise<Record<string, string>> {
    const modules = this.modules || []
    const modulePath = this.moduleOverview?.modulePath || ''
    for (const module of modules) {
      try {
        const addFile = resolve(modulePath, module, 'add.json')
        const removeFile = resolve(modulePath, module, 'remove.json')
        const addContent = await fse.readJSON(addFile, { encoding: 'utf8' })
        const removeContent = await fse.readJSON(removeFile, {
          encoding: 'utf8',
        })
        for (const k in addContent) {
          content[k] = addContent[k]
        }
        for (const k in removeContent) {
          if (content[removeContent[k]]) {
            delete content[removeContent[k]]
          } else {
            this.log.push(`Key "${removeContent[k]}" does not exist, skipping.`)
          }
        }
      } catch (e) {
        continue
      }
    }
    return content
  }

  async mergeMods(
    content: Record<string, string>
  ): Promise<Record<string, string>> {
    if (this.modFiles) {
      for (const mod of this.modFiles) {
        let modContent: Record<string, string> = {}
        if (mod.endsWith('.json')) {
          modContent = await fse.readJSON(mod, { encoding: 'utf8' })
        }
        if (mod.endsWith('.lang')) {
          modContent = this.langToJSON(
            await fse.readFile(mod, { encoding: 'utf8' })
          )
        }
        for (const k in modContent) {
          content[k] = modContent[k]
        }
      }
    }
    return content
  }

  async generateJSON(withModules: boolean): Promise<string> {
    let content = await this.getContent()
    if (withModules) {
      content = await this.mergeModules(content)
    }
    return ensureAscii(JSON.stringify(content, null, 4))
  }

  async generateJavaLegacy(withModules: boolean): Promise<string> {
    let content = await this.getContent()
    if (withModules) {
      content = await this.mergeModules(content)
    }
    return this.JSONToLang(content)
  }

  async generateBedrock(withModules: boolean): Promise<string> {
    let content = await this.getContent()
    if (withModules) {
      content = await this.mergeModules(content)
    }
    return this.JSONToLang(content).replace(/\n/g, '\t#\n')
  }

  langToJSON(content: string): Record<string, string> {
    const result: Record<string, string> = {}
    for (let value of content.replace(/\r\n/g, '\n').split('\n')) {
      value = value.replace(/##.*$/g, '').trim()
      if (value !== '') {
        const keyValuePair = value.split('=', 2)
        if (keyValuePair.length < 2) {
          this.#appendLog(`Warning: Invalid entry "${value}".`)
          continue
        }
        result[keyValuePair[0]] = keyValuePair[1].replace(/\t?#?$/g, '')
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
