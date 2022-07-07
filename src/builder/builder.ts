import fse from 'fs-extra'
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
import { mergeCollectionIntoResource, priorityToArray } from '../utils'
import _ from 'lodash'
import { MODULE_PRIORITY_FILE_NAME } from '../constants'
import { Logger } from '../log'

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
    const modules = mergeCollectionIntoResource(this.parsedModules, {
      resource: options.modules.resource,
      collection: options.modules.collection,
    })

    const priorityRaw = fse
      .readFileSync(
        this.parsedModules.modulePath + '/' + MODULE_PRIORITY_FILE_NAME
      )
      .toString('utf8')
    const priority = priorityToArray(priorityRaw)
    const sorted: ModuleManifestWithDirectory[] = []

    priority.forEach((rank) => {
      const manifest = modules.find((m) => m.name === rank)
      if (manifest) {
        sorted.push(manifest)
      }
    })
    const left = modules.filter((m) => !priority.includes(m.name))

    if (left.length > 0) {
      Logger.appendLog(
        `Warning: Module ${left
          .map((m) => m.name)
          .join(
            ', '
          )} is/are not in the priority rank and will be applied last.`
      )
    }

    return [...sorted, ...left]
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
