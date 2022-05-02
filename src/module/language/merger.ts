import fse from 'fs-extra'
import path from 'path'
import { BASE_LANGUAGE_FILE } from '../..'
import {
  LanguageMap,
  LanguageSet,
  RawLanguage,
  SingleLanguage,
} from '../../types'

export class LanguageMerger {
  addMap: LanguageMap
  removeSet: LanguageSet
  resourcePath: string

  constructor({
    resourcePath,
    modification: { add, remove },
  }: {
    resourcePath: string
    modification: {
      add: LanguageMap
      remove: LanguageSet
    }
  }) {
    this.addMap = add
    this.removeSet = remove
    this.resourcePath = resourcePath
  }

  async mergeModification(): Promise<LanguageMap> {
    const result = new Map()
    await this.handleDefaultLanguageFile(result)
    await this.handleAddMap(result)
    await this.handleRemoveSet(result)
    return result
  }

  async handleDefaultLanguageFile(languageMap: LanguageMap): Promise<void> {
    const baseLanguageMap = await this.loadBaseFile(BASE_LANGUAGE_FILE)
    languageMap.set(BASE_LANGUAGE_FILE, baseLanguageMap)
  }

  async handleAddMap(languageMap: LanguageMap): Promise<void> {
    for (const [file, addMap] of this.addMap) {
      const baseLanguageMap =
        languageMap.get(file) ??
        (await this.loadBaseFile(path.join(this.resourcePath, file)))
      for (const [key, value] of addMap) {
        baseLanguageMap.set(key, value)
      }
      languageMap.set(file, baseLanguageMap)
    }
  }

  async handleRemoveSet(languageMap: LanguageMap): Promise<void> {
    for (const [file, removeSet] of this.removeSet) {
      const baseLanguageMap =
        languageMap.get(file) ??
        (await this.loadBaseFile(path.resolve(this.resourcePath, file)))
      for (const key of removeSet) {
        baseLanguageMap.delete(key)
      }
      languageMap.set(file, baseLanguageMap)
    }
  }

  async loadBaseFile(path: string): Promise<SingleLanguage> {
    try {
      const content: RawLanguage = await fse.readJSON(path)
      return new Map(Object.entries(content))
    } catch (error) {
      return new Map()
    }
  }
}
