import { mergeModsIntoLanguageMap } from '../mod'
import { getLanguageMapFromOptions, getMcMetaFile } from '../module'
import { JavaOptionValidator } from '../option'
import { PackagingWorker } from '../packaging'
import {
  ArchiveMap,
  JavaBuildOptions,
  LanguageMap,
  ModuleManifestWithDirectory,
} from '../types'
import { JSONToJavaLang } from '../utils'
import { PackBuilder } from './builder'

export class JavaPackBuilder extends PackBuilder {
  async build(
    options: JavaBuildOptions
  ): Promise<{ name: string; content: Buffer }> {
    const optionValidator = new JavaOptionValidator(options)
    if (!optionValidator.validateOptions()) {
      return Promise.reject('Invalid options')
    }
    const selectedModules = this.setSelectedModules(options)
    let languageMap = await this.setJavaLanguageMap(
      selectedModules,
      options.compatible
    )
    if (this.modDirectory && this.modFiles) {
      languageMap = await mergeModsIntoLanguageMap(languageMap, {
        modDirectory: this.modDirectory,
        modFiles: this.modFiles,
      })
    }
    const otherResources = this.setJavaOtherResources(
      await this.setOtherResources(selectedModules)
    )
    const otherObjects = await this.setJavaOtherObjects(options)
    if (options.type === 'legacy') {
      this.setJavaLegacyMode(languageMap, otherObjects)
      languageMap = new Map()
    }
    const packagingWorker = new PackagingWorker({
      baseResourcePath: this.baseResourcePath,
      languageMap,
      otherResources,
      otherObjects,
    })
    const buf = await packagingWorker.pack()
    return { name: this.setPackName(buf), content: buf }
  }

  async setJavaLanguageMap(
    selectedModules: ModuleManifestWithDirectory[],
    isCompatibleMode: boolean
  ): Promise<LanguageMap> {
    const map = await getLanguageMapFromOptions(
      'java',
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

  setJavaLegacyMode(
    languageMap: LanguageMap,
    otherObjects: Record<string, string>
  ): void {
    for (const [key, value] of languageMap) {
      otherObjects[key.replace(/zh_meme\.json$/g, 'zh_cn.lang')] =
        JSONToJavaLang(Object.fromEntries(value))
    }
  }

  setJavaOtherResources(resources: ArchiveMap): ArchiveMap {
    resources.set('pack.png', `${this.baseResourcePath}/pack.png`)
    resources.set(
      'assets/minecraft/texts/credits.json',
      `${this.baseResourcePath}/assets/minecraft/texts/credits.json`
    )
    return resources
  }

  async setJavaOtherObjects(
    options: JavaBuildOptions
  ): Promise<Record<string, string>> {
    return {
      'pack.mcmeta': await getMcMetaFile(this.baseResourcePath, options),
    }
  }
}
