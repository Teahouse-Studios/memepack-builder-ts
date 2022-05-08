import { createHash } from 'crypto'
import { extractResources } from '../module/resource'
import {
  JavaBuildOptions,
  BedrockBuildOptions,
  ModuleOverview,
  ModuleManifestWithDirectory,
  ArchiveMap,
} from '../types'
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

  getSelectedModules(
    options: JavaBuildOptions | BedrockBuildOptions
  ): ModuleManifestWithDirectory[] {
    return mergeCollectionIntoResource(this.parsedModules, {
      resource: options.modules.resource,
      collection: options.modules.collection,
    })
  }

  async getOtherResources(
    selectedModules: ModuleManifestWithDirectory[]
  ): Promise<ArchiveMap> {
    const resources = await extractResources(
      this.parsedModules.modulePath,
      selectedModules
    )
    resources.set('LICENSE', `${this.baseResourcePath}/LICENSE`)
    return resources
  }

  getPackName(content: Buffer): string {
    return createHash('sha256').update(content).digest('hex').slice(0, 8)
  }
}
