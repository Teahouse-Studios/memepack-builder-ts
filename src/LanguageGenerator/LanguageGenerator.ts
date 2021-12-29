import fse from 'fs-extra'
import path from 'path'
import { BELangToJSON } from '.'
import { ModuleInfo, NameContentList } from '../types'

export class LanguageGenerator {
  resourcePath: string
  mainLanguageFile: string
  modulePath: string
  modules: ModuleInfo[]
  modFiles: NameContentList
  #content: NameContentList = {}

  constructor({
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
  }) {
    this.resourcePath = path.resolve(resourcePath)
    this.mainLanguageFile = mainLanguageFile
    this.modulePath = modulePath
    this.modules = modules
    this.modFiles = modFiles
  }

  async #getContent(p: string): Promise<Record<string, string>> {
    if (await fse.pathExists(path.resolve(this.modulePath, p))) {
      if (p.endsWith('.json')) {
        return await fse.readJSON(path.resolve(this.modulePath, p))
      } else {
        return BELangToJSON(
          await fse.readFile(path.resolve(this.modulePath, p), 'utf8')
        )
      }
    } else {
      return {}
    }
  }

  async mergeModules(): Promise<void> {
    this.#content = {
      [this.mainLanguageFile]: await this.#getContent(
        path.resolve(this.resourcePath, this.mainLanguageFile)
      ),
    }
    for (const module of this.modules) {
      for (const modification of module.languageModification || []) {
        if (!this.#content[modification.file]) {
          this.#content[modification.file] = await this.#getContent(
            modification.file
          )
        }
        const entry = this.#content[modification.file]
        Object.assign(entry, modification.add)
        for (const k of modification.remove) {
          delete entry[k]
        }
      }
    }
  }

  async mergeMods(): Promise<void> {
    for (const mod in this.modFiles) {
      Object.assign(this.#content[mod], this.modFiles[mod])
    }
  }

  get content(): NameContentList {
    return this.#content
  }
}
