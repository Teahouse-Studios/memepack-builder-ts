import fse from 'fs-extra'
import { getLanguageMapFromOptions, getBedrockTextureFile } from '../module'
import { BedrockOptionValidator } from '../option'
import { PackagingWorker } from '../packaging'
import {
  BedrockBuildOptions,
  ModuleManifestWithDirectory,
  LanguageMap,
  ArchiveMap,
} from '../types'
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
    const otherResources = this.#getBedrockOtherResources(
      await this.getOtherResources(selectedModules),
      options.compatible
    )
    const otherObjects = await this.#getBedrockOtherObjects(
      selectedModules,
      options.compatible
    )
    const packagingWorker = new PackagingWorker({
      baseResourcePath: this.baseResourcePath,
      languageMap: new Map(),
      otherResources,
      otherObjects,
    })
    const buf = await packagingWorker.pack()
    return { name: this.getPackName(buf), content: buf }
  }

  // not used?
  async #getBedrockLanguageMap(
    selectedModules: ModuleManifestWithDirectory[]
  ): Promise<LanguageMap> {
    return getLanguageMapFromOptions(
      'bedrock',
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
      'credits/credit.json',
      `${this.baseResourcePath}/credits/credit.json`
    )
    if (!isCompatibleMode) {
      resources.set(
        `${this.baseResourcePath}/texts/language_names.json`,
        'texts/language_names.json'
      )
      resources.set(
        `${this.baseResourcePath}/texts/languages.json`,
        'texts/languages.json'
      )
      resources.set(
        `${this.baseResourcePath}/texts/zh_CN.lang`,
        'texts/zh_CN.lang'
      )
    }
    return resources
  }

  async #getBedrockOtherObjects(
    selectedModules: ModuleManifestWithDirectory[],
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
      result['texts/zh_CN.lang'] = await fse.readFile(
        `${this.baseResourcePath}/texts/zh_ME.lang`,
        'utf8'
      )
    } else {
      result['texts/zh_ME.lang'] = await fse.readFile(
        `${this.baseResourcePath}/texts/zh_ME.lang`,
        'utf8'
      )
    }
    return result
  }
}
