import { JAVA_BASE_LANGUAGE_FILE } from '~'
import { LanguageMap, SingleLanguage } from '~/types'

export class ModMerger {
  languageMap: LanguageMap
  modModification: LanguageMap

  constructor({
    languageMap,
    modModification,
  }: {
    languageMap: LanguageMap
    modModification: LanguageMap
  }) {
    this.languageMap = languageMap
    this.modModification = modModification
  }

  mergeModification(): LanguageMap {
    const result = new Map(this.languageMap)
    for (const modification of this.modModification.values()) {
      const map: SingleLanguage =
        result.get(JAVA_BASE_LANGUAGE_FILE) ?? new Map()
      for (const [key, value] of modification) {
        map.set(key, value)
      }
      result.set(JAVA_BASE_LANGUAGE_FILE, map)
    }
    return result
  }
}
