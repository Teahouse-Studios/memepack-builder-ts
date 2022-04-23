import { BASE_LANGUAGE_FILE } from '..'

export class ModMerger {
  languageMap: Map<string, Map<string, string>>
  modModification: Map<string, Map<string, string>>

  constructor({
    languageMap,
    modModification,
  }: {
    languageMap: Map<string, Map<string, string>>
    modModification: Map<string, Map<string, string>>
  }) {
    this.languageMap = languageMap
    this.modModification = modModification
  }

  mergeModification(): Map<string, Map<string, string>> {
    const result = new Map(this.languageMap)
    for (const modification of this.modModification.values()) {
      const map: Map<string, string> =
        result.get(BASE_LANGUAGE_FILE) ?? new Map()
      for (const [key, value] of modification) {
        map.set(key, value)
      }
      result.set(BASE_LANGUAGE_FILE, map)
    }
    return result
  }
}
