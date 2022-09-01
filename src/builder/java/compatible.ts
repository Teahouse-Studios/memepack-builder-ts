import { mergeModsIntoLanguageMap } from '../../mod'
import { getJavaLanguageMapFromOptions, getMcMetaFile } from '../../module'
import { JavaOptionValidator } from '../../option'
import { PackagingWorker } from '../../packaging'
import {
  ArchiveMap,
  JavaBuildOptions,
  LanguageMap,
  ModuleManifestWithDirectory,
  SingleLanguage,
} from '../../types'
import { PackBuilder } from '../builder'

export class JavaCompatiblePackBuilder extends PackBuilder {
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
      'assets/minecraft/lang/zh_meme.json',
    ])
    const moduleOtherResources = await this.getModuleOtherResources(
      selectedModules
    )
    const otherResources = this.#getJavaOtherResources(
      baseOtherResources,
      moduleOtherResources
    )
    const otherObjects = await this.#getJavaOtherObjects(options)
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
    selectedModules: ModuleManifestWithDirectory[]
  ): Promise<LanguageMap> {
    const result = await getJavaLanguageMapFromOptions(
      this.baseResourcePath,
      this.parsedModules.modulePath,
      selectedModules
    )
    const keys = Array.from(result.keys())
    keys
      .filter((key) => key.endsWith('zh_meme.json'))
      .forEach((key) => {
        const value: SingleLanguage = result.get(key) ?? new Map()
        result.set(key.replace(/zh_meme\.json$/g, 'zh_cn.json'), value)
        result.delete(key)
      })
    return result
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
        const value = result.get(key) ?? ''
        result.set(key.replace(/zh_meme\.json$/g, 'zh_cn.json'), value)
        result.delete(key)
      })
    return result
  }

  async #getJavaOtherObjects(
    options: JavaBuildOptions
  ): Promise<Map<string, string>> {
    const result: Map<string, string> = new Map()
    result.set(
      'pack.mcmeta',
      await getMcMetaFile(this.baseResourcePath, options)
    )
    return result
  }
}
