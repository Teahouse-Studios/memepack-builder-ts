import { mergeModsIntoLanguageMap } from '../../mod'
import { getJavaLanguageMapFromOptions, getMcMetaFile } from '../../module'
import { JavaOptionValidator } from '../../option'
import { PackagingWorker } from '../../packaging'
import {
  ArchiveMap,
  JavaBuildOptions,
  LanguageMap,
  ModuleManifestWithDirectory,
  ModuleOverview,
  SingleLanguage,
} from '../../types'
import { JSONToJavaLang } from '../../utils'
import { PackBuilder } from '../builder'
import fse from 'fs-extra'
import {
  JAVA_BASE_LANGUAGE_FILE,
  LEGACY_LANGUAGE_MAPPING_FILE,
} from '../../constants'
import { resolve } from 'path'

export class JavaLegacyPackBuilder extends PackBuilder {
  languageMappingPath: string

  constructor(
    parsedModules: ModuleOverview,
    baseResourcePath: string,
    {
      modDirectory,
      modFiles,
    }: {
      modDirectory?: string
      modFiles?: string[]
    },
    languageMappingPath: string
  ) {
    super(parsedModules, baseResourcePath, { modDirectory, modFiles })
    this.languageMappingPath = languageMappingPath
  }

  async build(
    options: JavaBuildOptions
  ): Promise<{ content: Buffer; hash: string }> {
    const optionValidator = new JavaOptionValidator(options)
    if (!optionValidator.validateOptions()) {
      return Promise.reject('Invalid options')
    }
    const selectedModules = await this.getSelectedModules(options)
    let languageMap = await this.#getJavaLanguageMap(selectedModules)
    if (this.modDirectory && this.modFiles) {
      languageMap = await mergeModsIntoLanguageMap(languageMap, {
        modDirectory: this.modDirectory,
        modFiles: this.modFiles,
      })
    }
    const baseOtherResources = await this.getBaseOtherResources([
      'pack.mcmeta',
      JAVA_BASE_LANGUAGE_FILE,
    ])
    const moduleOtherResources = await this.getModuleOtherResources(
      selectedModules
    )
    const otherResources = this.#getJavaOtherResources(
      baseOtherResources,
      moduleOtherResources
    )
    const otherObjects = await this.#getJavaOtherObjects(options)
    await this.#processLagacyMode(languageMap, otherObjects)
    const packagingWorker = new PackagingWorker({
      baseResourcePath: this.baseResourcePath,
      languageMap: new Map(),
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
    selectedModules: ModuleManifestWithDirectory[]
  ): Promise<LanguageMap> {
    const result = await getJavaLanguageMapFromOptions(
      this.baseResourcePath,
      this.parsedModules.modulePath,
      selectedModules
    )
    return result
  }

  async #getLanguageKeyMapping(): Promise<Map<string, string>> {
    const mappingIndex: string[] = await fse.readJSON(
      resolve(this.languageMappingPath, LEGACY_LANGUAGE_MAPPING_FILE)
    )
    const result: Map<string, string> = new Map()
    for (const i of mappingIndex) {
      const content: Record<string, string> = await fse.readJSON(
        resolve(this.languageMappingPath, `${i}.json`)
      )
      for (const entries of Object.entries(content)) {
        result.set(entries[0], entries[1])
      }
    }
    return result
  }

  async #processLagacyMode(
    languageMap: LanguageMap,
    otherObjects: Record<string, string>
  ) {
    const languageKeyMapping = await this.#getLanguageKeyMapping()
    const mainLanguage: SingleLanguage =
      languageMap.get(JAVA_BASE_LANGUAGE_FILE) ?? new Map()
    languageMap.delete(JAVA_BASE_LANGUAGE_FILE)
    for (const [mappedKey, originalKey] of languageKeyMapping) {
      if (mappedKey !== originalKey && mainLanguage.has(originalKey)) {
        const languageValue = mainLanguage.get(originalKey) ?? ''
        mainLanguage.delete(originalKey)
        mainLanguage.set(mappedKey, languageValue)
      }
    }
    languageMap.set('assets/minecraft/lang/zh_cn.lang', mainLanguage)
    for (const [key, value] of languageMap) {
      otherObjects[key.replace(/zh_(?:cn|meme)\.json$/g, 'zh_cn.lang')] =
        JSONToJavaLang(Object.fromEntries(value))
    }
  }

  #getJavaOtherResources(
    baseOtherResources: ArchiveMap,
    moduleOtherResources: ArchiveMap
  ): ArchiveMap {
    const result = new Map(baseOtherResources)
    for (const [key, value] of moduleOtherResources) {
      result.set(key, value)
    }
    const keys = Array.from(result.keys())
    keys
      .filter((key) => key.endsWith('zh_meme.json'))
      .forEach((key) => {
        result.delete(key)
      })
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
