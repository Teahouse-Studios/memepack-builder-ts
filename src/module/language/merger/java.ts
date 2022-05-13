import fse from 'fs-extra'
import path from 'path'
import { JAVA_BASE_LANGUAGE_FILE } from '../../../constants'
import {
  LanguageMap,
  LanguageSet,
  RawLanguage,
  SingleLanguage,
} from '../../../types'
import { javaLangToJSON } from '../../../utils'

export class JavaLanguageMerger {
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
    await this.handleJavaDefaultLanguageFile(result)
    await this.handleAddMap(result)
    await this.handleRemoveSet(result)
    return result
  }

  async handleJavaDefaultLanguageFile(languageMap: LanguageMap): Promise<void> {
    const baseLanguageMap = await this.loadBaseFile(JAVA_BASE_LANGUAGE_FILE)
    languageMap.set(JAVA_BASE_LANGUAGE_FILE, baseLanguageMap)
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
      let content: RawLanguage
      if (path.endsWith('.json')) {
        content = await fse.readJSON(path)
      } else {
        content = javaLangToJSON(await fse.readFile(path, 'utf8'))
      }
      return new Map(Object.entries(content))
    } catch (error) {
      return new Map()
    }
  }
}
