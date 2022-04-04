import fse from 'fs-extra'
import path from 'path'
import { BELangToJSON } from '.'
import { ModuleInfo, LanguageMap } from '../types'

export class LanguageGenerator {
  resourcePath: string
  mainLanguageFile: string
  modulePath: string
  modules: ModuleInfo[]
  modFiles: LanguageMap
  #content: LanguageMap = new Map()

  constructor({
    resourcePath,
    mainLanguageFile,
    modulePath,
    modules = [],
    modFiles = new Map(),
  }: {
    resourcePath: string
    mainLanguageFile: string
    modulePath: string
    modules?: ModuleInfo[]
    modFiles?: LanguageMap
  }) {
    this.resourcePath = path.resolve(resourcePath)
    this.mainLanguageFile = mainLanguageFile
    this.modulePath = modulePath
    this.modules = modules
    this.modFiles = modFiles
  }

  async #getContent(p: string): Promise<Record<string, string>> {
    const realPath = path.resolve(this.resourcePath, p)
    try {
      if (p.endsWith('.json')) {
        return await fse.readJSON(realPath)
      } else {
        return BELangToJSON(await fse.readFile(realPath, 'utf8'))
      }
    } catch (e) {
      console.error(e)
      return {}
    }
  }

  async mergeModules(): Promise<void> {
    this.#content.set(
      this.mainLanguageFile,
      await this.#getContent(this.mainLanguageFile)
    )
    for (const module of this.modules) {
      for (const modification of module.languageModification || []) {
        if (!this.#content.has(modification.file)) {
          this.#content.set(
            modification.file,
            await this.#getContent(modification.file)
          )
        }
        const entry = this.#content.get(modification.file) ?? {}
        Object.assign(entry, modification.add)
        for (const k of modification.remove) {
          delete entry[k]
        }
      }
    }
  }

  async mergeMods(): Promise<void> {
    for (const mod in this.modFiles) {
      Object.assign(this.#content.get(mod) ?? {}, this.modFiles.get(mod) ?? {})
    }
  }

  get content(): LanguageMap {
    return this.#content
  }
}
