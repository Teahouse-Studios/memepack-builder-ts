import { deprecate } from 'util'
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
} from '../types'
import { JSONToBedrockLang } from '../utils'
import { PackBuilder } from './builder'

export class BedrockPackBuilder extends PackBuilder {
  async build(
    options: BedrockBuildOptions
  ): Promise<{ name: string; content: Buffer }> {
    const optionValidator = new BedrockOptionValidator(options)
    if (!optionValidator.validateOptions()) {
      return Promise.reject('Invalid options')
    }
    const selectedModules = this.getSelectedModules(options)
    const languageMap = await this.#getBedrockLanguageMap(selectedModules)
    const otherResources = this.#getBedrockOtherResources(
      await this.getOtherResources(selectedModules),
      options.compatible
    )
    const otherObjects = await this.#getBedrockOtherObjects(
      selectedModules,
      languageMap,
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
      name: deprecate(() => '', 'name is deprecated')(),
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
    resources: ArchiveMap,
    isCompatibleMode: boolean
  ): ArchiveMap {
    resources.set('pack_icon.png', `${this.baseResourcePath}/pack_icon.png`)
    resources.set('manifest.json', `${this.baseResourcePath}/manifest.json`)
    resources.set(
      'credits/credits.json',
      `${this.baseResourcePath}/credits/credits.json`
    )
    if (!isCompatibleMode) {
      resources.set(
        'texts/language_names.json',
        `${this.baseResourcePath}/texts/language_names.json`
      )
      resources.set(
        'texts/languages.json',
        `${this.baseResourcePath}/texts/languages.json`
      )
      resources.set(
        'texts/zh_CN.lang',
        `${this.baseResourcePath}/texts/zh_CN.lang`
      )
    }
    return resources
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
      const mainLanguage =
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
