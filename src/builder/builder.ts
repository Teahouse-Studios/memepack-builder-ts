import { createHash } from 'crypto'
import klaw from 'klaw'
import path from 'path'
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

  async getBaseOtherResources(
    excludedFiles: string[] = []
  ): Promise<ArchiveMap> {
    const resources: ArchiveMap = new Map()
    for await (const item of klaw(this.baseResourcePath)) {
      if (
        item.stats.isFile() &&
        excludedFiles.every((f) => !item.path.endsWith(f))
      ) {
        const archivePath = path.relative(this.baseResourcePath, item.path)
        resources.set(archivePath, item.path)
      }
    }
    return resources
  }

  async getModuleOtherResources(
    selectedModules: ModuleManifestWithDirectory[],
    excludedFiles: string[] = []
  ): Promise<ArchiveMap> {
    const resources = await extractResources(
      this.parsedModules.modulePath,
      selectedModules,
      excludedFiles
    )
    return resources
  }

  static getPackHash(content: Buffer): string {
    const hash = createHash('sha256').update(content).digest('hex')
    return hash
  }
}
