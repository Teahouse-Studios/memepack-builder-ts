import { createHash } from 'crypto'
import { mergeModsIntoLanguageMap } from '../mod/wrapper'
import { getLanguageMapFromOptions } from '../module/language'
import { extractResources } from '../module/resource'
import { JavaOptionValidator } from '../option'
import { PackagingWorker } from '../packaging'
import { JavaBuildOptions, ModuleOverview } from '../types'
import { mergeCollectionIntoResource } from '../utils'

export class PackBuilder {
  parsedModules: ModuleOverview
  baseResourcePath: string
  modDirectory?: string
  modFiles?: string[]

  constructor(
    parsedModules: ModuleOverview,
    baseResourcePath: string,
    {
      modDirectory,
      modFiles,
    }: {
      modDirectory?: string
      modFiles?: string[]
    }
  ) {
    this.parsedModules = parsedModules
    this.baseResourcePath = baseResourcePath
    this.modDirectory = modDirectory
    this.modFiles = modFiles
  }

  async build(
    options: JavaBuildOptions
  ): Promise<{ name: string; content: Buffer }> {
    const optionValidator = new JavaOptionValidator(options)
    if (!optionValidator.validateOptions()) {
      return Promise.reject('Invalid options')
    }

    const selectedModules = mergeCollectionIntoResource(this.parsedModules, {
      resource: options.modules.resource,
      collection: options.modules.collection,
    })

    let languageMap = await getLanguageMapFromOptions(
      this.baseResourcePath,
      this.parsedModules.modulePath,
      selectedModules
    )

    if (this.modDirectory && this.modFiles) {
      languageMap = await mergeModsIntoLanguageMap(languageMap, {
        modDirectory: this.modDirectory,
        modFiles: this.modFiles,
      })
    }

    const otherResources = await extractResources(
      this.parsedModules.modulePath,
      selectedModules
    )

    const packagingWorker = new PackagingWorker({
      baseResourcePath: this.baseResourcePath,
      languageMap,
      otherResources,
    })

    const buf = await packagingWorker.pack()
    return { name: this.getPackName(buf), content: buf }
  }

  getPackName(content: Buffer): string {
    return createHash('sha256').update(content).digest('hex').slice(0, 8)
  }
}
