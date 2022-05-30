import { BEDROCK_BASE_LANGUAGE_FILE } from '../constants'
import {
  getBedrockLanguageMapFromOptions,
  getBedrockTextureFile,
} from '../module'
import { BedrockOptionValidator } from '../option'
import { PackagingWorker } from '../packaging'
import {
  BedrockBuildOptions,
  ModuleManifestWithDirectory,
  LanguageMap,
  ArchiveMap,
  SingleLanguage,
} from '../types'
import { JSONToBedrockLang } from '../utils'
import { PackBuilder } from './builder'

export class BedrockPackBuilder extends PackBuilder {
  async build(
    options: BedrockBuildOptions
  ): Promise<{ content: Buffer; hash: string }> {
    const optionValidator = new BedrockOptionValidator(options)
    if (!optionValidator.validateOptions()) {
      return Promise.reject('Invalid options')
    }
    const selectedModules = this.getSelectedModules(options)
    const languageMap = await this.#getBedrockLanguageMap(selectedModules)
    const baseOtherResources = await this.getBaseOtherResources([
      'texts/language_names.json',
      'texts/languages.json',
      'texts/zh_CN.lang',
    ])
    const moduleOtherResources = await this.getModuleOtherResources(
      selectedModules,
      ['textures/item_texture.json', 'textures/terrain_texture.json']
    )
    const otherObjects = await this.#getBedrockOtherObjects(
      selectedModules,
      languageMap,
      options.compatible
    )
    const otherResources = this.#getBedrockOtherResources(
      baseOtherResources,
      moduleOtherResources,
      options.compatible
    )
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

  async #getBedrockLanguageMap(
    selectedModules: ModuleManifestWithDirectory[]
  ): Promise<LanguageMap> {
    return getBedrockLanguageMapFromOptions(
      this.baseResourcePath,
      this.parsedModules.modulePath,
      selectedModules
    )
  }

  #getBedrockOtherResources(
    baseOtherResources: ArchiveMap,
    moduleOtherResources: ArchiveMap,
    isCompatibleMode: boolean
  ): ArchiveMap {
    const result = new Map(baseOtherResources)
    for (const [key, value] of moduleOtherResources) {
      result.set(key, value)
    }
    if (!isCompatibleMode) {
      result.set(
        'texts/language_names.json',
        `${this.baseResourcePath}/texts/language_names.json`
      )
      result.set(
        'texts/languages.json',
        `${this.baseResourcePath}/texts/languages.json`
      )
      result.set(
        'texts/zh_CN.lang',
        `${this.baseResourcePath}/texts/zh_CN.lang`
      )
    }
    return result
  }

  async #getBedrockOtherObjects(
    selectedModules: ModuleManifestWithDirectory[],
    languageMap: LanguageMap,
    isCompatibleMode: boolean
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {
      'textures/item_texture.json': await getBedrockTextureFile(
        'item_texture.json',
        this.parsedModules.modulePath,
        selectedModules
      ),
      'textures/terrain_texture.json': await getBedrockTextureFile(
        'terrain_texture.json',
        this.parsedModules.modulePath,
        selectedModules
      ),
    }
    if (isCompatibleMode) {
      const mainLanguage: SingleLanguage =
        languageMap.get(BEDROCK_BASE_LANGUAGE_FILE) ?? new Map()
      languageMap.set('texts/zh_CN.lang', mainLanguage)
      languageMap.delete(BEDROCK_BASE_LANGUAGE_FILE)
    }
    for (const [lang, langMap] of languageMap) {
      result[lang] = JSONToBedrockLang(Object.fromEntries(langMap))
    }
    return result
  }
}
