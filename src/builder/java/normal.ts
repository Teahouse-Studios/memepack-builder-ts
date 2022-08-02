import { mergeModsIntoLanguageMap } from '../../mod'
import { getJavaLanguageMapFromOptions, getMcMetaFile } from '../../module'
import { JavaOptionValidator } from '../../option'
import { PackagingWorker } from '../../packaging'
import {
  ArchiveMap,
  JavaBuildOptions,
  LanguageMap,
  ModuleManifestWithDirectory,
} from '../../types'
import { PackBuilder } from '../builder'

export class JavaNormalPackBuilder extends PackBuilder {
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
    const map = await getJavaLanguageMapFromOptions(
      this.baseResourcePath,
      this.parsedModules.modulePath,
      selectedModules
    )
    return map
  }

  #getJavaOtherResources(
    baseOtherResources: ArchiveMap,
    moduleOtherResources: ArchiveMap
  ): ArchiveMap {
    const result = new Map(baseOtherResources)
    for (const [key, value] of moduleOtherResources) {
      result.set(key, value)
    }
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
