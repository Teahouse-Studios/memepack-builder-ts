import fse from 'fs-extra'
import path from 'path'
import { BELangToJSON } from '.'
import { ModuleInfo, NameContentList } from '../types'

export class LanguageGenerator {
  resourcePath: string
  modulePath: string
  modules: ModuleInfo[]
  modFiles: NameContentList

  constructor({
    resourcePath,
    modulePath,
    modules = [],
    modFiles = {},
  }: {
    resourcePath: string
    modulePath: string
    modules?: ModuleInfo[]
    modFiles?: NameContentList
  }) {
    this.resourcePath = path.resolve(resourcePath)
    this.modulePath = modulePath
    this.modules = modules
    this.modFiles = modFiles
  }

  async #getBaseFile(p: string): Promise<Record<string, string>> {
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

  async mergeModules(mainLanguageFile: string): Promise<NameContentList> {
    const result: NameContentList = {
      [mainLanguageFile]: await this.#getBaseFile(
        path.resolve(this.resourcePath, mainLanguageFile)
      ),
    }
    for (const module of this.modules) {
      for (const modification of module.languageModification || []) {
        if (!result[modification.file]) {
          result[modification.file] = await this.#getBaseFile(modification.file)
        }
        const entry = result[modification.file]
        for (const k in modification.add) {
          entry[k] = modification.add[k]
        }
        for (const k of modification.remove) {
          delete entry[k]
        }
      }
    }
    return result
  }

  async mergeMods(content: NameContentList): Promise<NameContentList> {
    for (const mod in this.modFiles) {
      for (const k in this.modFiles[mod]) {
        content[mod][k] = this.modFiles[mod][k]
      }
    }
    return content
  }
}
