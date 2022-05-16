import klaw from 'klaw'
import path from 'path'
import { mergeModsIntoLanguageMap } from '../mod'
import { getJavaLanguageMapFromOptions, getMcMetaFile } from '../module'
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
  ): Promise<{ content: Buffer; hash: string }> {
    const optionValidator = new JavaOptionValidator(options)
    if (!optionValidator.validateOptions()) {
      return Promise.reject('Invalid options')
    }
    const selectedModules = this.getSelectedModules(options)
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
    const otherResources = await this.#getJavaOtherResources(
      await this.getOtherResources(selectedModules),
      options.compatible
    )
    const otherObjects = await this.#getJavaOtherObjects(options)
    if (options.type === 'legacy') {
      this.#setJavaLegacyMode(languageMap, otherObjects)
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

  #setJavaLegacyMode(
    languageMap: LanguageMap,
    otherObjects: Record<string, string>
  ): void {
    for (const [key, value] of languageMap) {
      otherObjects[key.replace(/zh_meme\.json$/g, 'zh_cn.lang')] =
        JSONToJavaLang(Object.fromEntries(value))
    }
  }

  async #getJavaOtherResources(
    resources: ArchiveMap,
    isCompatibleMode: boolean
  ): Promise<ArchiveMap> {
    const excluded = ['pack.mcmeta', 'assets/minecraft/lang/zh_meme.json']
    for await (const item of klaw(this.baseResourcePath)) {
      if (
        item.stats.isFile() &&
        excluded.every((e) => !item.path.endsWith(e))
      ) {
        const archivePath = path.relative(this.baseResourcePath, item.path)
        resources.set(archivePath, item.path)
      }
    }
    if (isCompatibleMode) {
      const res = new Map(resources)
      for (const [key, value] of res) {
        resources.set(key.replace(/zh_meme\.json$/g, 'zh_cn.json'), value)
        resources.delete(key)
      }
    }
    return resources
  }

  async #getJavaOtherObjects(
    options: JavaBuildOptions
  ): Promise<Record<string, string>> {
    return {
      'pack.mcmeta': await getMcMetaFile(this.baseResourcePath, options),
    }
  }
}
