import { mergeModsIntoLanguageMap } from '../mod'
import { getJavaLanguageMapFromOptions, getMcMetaFile } from '../module'
import { JavaOptionValidator } from '../option'
import { PackagingWorker } from '../packaging'
import {
  ArchiveMap,
  JavaBuildOptions,
  LanguageMap,
  ModuleManifestWithDirectory,
  SingleLanguage,
} from '../types'
import { JSONToJavaLang } from '../utils'
import { PackBuilder } from './builder'
import fse from 'fs-extra'
import {
  JAVA_BASE_LANGUAGE_FILE,
  LEGACY_LANGUAGE_MAPPING_FILE,
} from '../constants'

export class JavaPackBuilder extends PackBuilder {
  async build(
    options: JavaBuildOptions
  ): Promise<{ content: Buffer; hash: string }> {
    const optionValidator = new JavaOptionValidator(options)
    if (!optionValidator.validateOptions()) {
      return Promise.reject('Invalid options')
    }
    const selectedModules = await this.getSelectedModules(options)
    let languageMap = await this.#getJavaLanguageMap(
      selectedModules,
      options.compatible
    )
    if (this.modDirectory && this.modFiles) {
      languageMap = await mergeModsIntoLanguageMap(languageMap, {
        modDirectory: this.modDirectory,
        modFiles: this.modFiles,
      })
    }
    const baseOtherResources = await this.getBaseOtherResources([
      'pack.mcmeta',
      'assets/minecraft/lang/zh_meme.json',
    ])
    const moduleOtherResources = await this.getModuleOtherResources(
      selectedModules
    )
    const otherResources = this.#getJavaOtherResources(
      baseOtherResources,
      moduleOtherResources,
      options.compatible
    )
    const otherObjects = await this.#getJavaOtherObjects(options)
    if (options.type === 'legacy') {
      await this.#setJavaLegacyMode(languageMap, otherObjects)
      languageMap = new Map()
    }
    const packagingWorker = new PackagingWorker({
      baseResourcePath: this.baseResourcePath,
      languageMap,
      otherResources,
      otherObjects,
    })
    const buf = await packagingWorker.pack()
    const result = {
      content: buf,
      hash: PackBuilder.getPackHash(buf),
    }
    return result
  }

  async #getJavaLanguageMap(
    selectedModules: ModuleManifestWithDirectory[],
    isCompatibleMode: boolean
  ): Promise<LanguageMap> {
    const map = await getJavaLanguageMapFromOptions(
      this.baseResourcePath,
      this.parsedModules.modulePath,
      selectedModules
    )
    const result = isCompatibleMode ? new Map() : map
    if (isCompatibleMode) {
      for (const [key, value] of map) {
        result.set(key.replace(/zh_meme\.json$/g, 'zh_cn.json'), value)
      }
    }
    return result
  }

  async #setJavaLegacyMode(
    languageMap: LanguageMap,
    otherObjects: Record<string, string>
  ): Promise<void> {
    const languageKeyMapping: Record<string, string> = await fse.readJSON(
      LEGACY_LANGUAGE_MAPPING_FILE
    )
    const mainLanguage: SingleLanguage =
      languageMap.get(JAVA_BASE_LANGUAGE_FILE) ?? new Map()
    for (const [originalKey, mappedKey] of Object.entries(languageKeyMapping)) {
      if (mainLanguage.has(originalKey)) {
        const languageValue = mainLanguage.get(originalKey) ?? ''
        mainLanguage.delete(languageValue)
        mainLanguage.set(mappedKey, languageValue)
      }
    }
    for (const [key, value] of languageMap) {
      otherObjects[key.replace(/zh_meme\.json$/g, 'zh_cn.lang')] =
        JSONToJavaLang(Object.fromEntries(value))
    }
  }

  #getJavaOtherResources(
    baseOtherResources: ArchiveMap,
    moduleOtherResources: ArchiveMap,
    isCompatibleMode: boolean
  ): ArchiveMap {
    const result = new Map(baseOtherResources)
    for (const [key, value] of moduleOtherResources) {
      result.set(key, value)
    }
    if (isCompatibleMode) {
      const keys = Array.from(result.keys())
      keys
        .filter((key) => key.endsWith('zh_meme.json'))
        .forEach((key) => {
          const value = result.get(key) ?? ''
          result.set(key.replace(/zh_meme\.json$/g, 'zh_cn.json'), value)
          result.delete(key)
        })
    }
    return result
  }

  async #getJavaOtherObjects(
    options: JavaBuildOptions
  ): Promise<Record<string, string>> {
    return {
      'pack.mcmeta': await getMcMetaFile(this.baseResourcePath, options),
    }
  }
}
