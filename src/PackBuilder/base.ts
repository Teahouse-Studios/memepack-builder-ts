/**
 * @method PackBuilder
 * @param {Object}
 */

import fse from 'fs-extra'
import klaw from 'klaw'
import _ from 'lodash'
import path from 'path'
import { createHash } from 'crypto'
import { ZipFile } from 'yazl'
import { homedir } from 'os'
import {
  BuilderConfig,
  JEBuildOptions,
  BEBuildOptions,
  ModuleOverview,
  ModuleInfo,
  ModuleType,
} from '../types'
import { defaultConfig } from '../constants'

export class PackBuilder {
  config: BuilderConfig
  resourcePath: string
  moduleOverview: ModuleOverview
  options: JEBuildOptions | BEBuildOptions
  log: string[] = []

  constructor({
    resourcePath,
    moduleOverview,
    options,
  }: {
    resourcePath?: string
    moduleOverview?: ModuleOverview
    options?: JEBuildOptions | BEBuildOptions
  } = {}) {
    this.config = defaultConfig
    this.resourcePath = path.resolve(resourcePath || '.')
    this.moduleOverview = moduleOverview || {
      modulePath: path.resolve('./modules'),
      modules: [],
    }
    this.options = options || {
      type: 'normal',
      modules: {
        resource: [],
        collection: [],
      },
    }
  }

  appendLog(entry: string | string[]): void {
    if (Array.isArray(entry)) {
      this.log = this.log.concat(entry)
    } else {
      this.log.push(entry)
    }
  }

  clearLog(): void {
    this.log = []
  }

  async build(
    files: string[] = [],
    content: Record<string, string> = {},
    excludedFiles: string[] = []
  ): Promise<{
    name: string
    buf: Buffer
  }> {
    try {
      this.config = await fse.readJSON(
        path.resolve(homedir(), '.memepack-builder.json'),
        { encoding: 'utf8' }
      )
    } catch (e) {
      void 0
    }
    this.clearLog()
    excludedFiles.push('add.json', 'remove.json', 'module_manifest.json')
    const modulePath = this.moduleOverview.modulePath
    this.appendLog(`Building pack...`)
    const zipFile = new ZipFile()
    for (const k of files) {
      zipFile.addFile(path.resolve(this.resourcePath, k), k)
    }
    for (const k in content) {
      if (content[k] !== '') {
        zipFile.addBuffer(Buffer.from(content[k], 'utf8'), k, {
          mtime: new Date(0),
        })
      }
    }
    for (const module of this.mergeCollectionIntoResource()) {
      const moduleDir = path.resolve(modulePath, module.dirName)
      const fileList: string[] = []
      for await (const item of klaw(moduleDir)) {
        if (
          item.stats.isFile() &&
          excludedFiles.every((value) => !item.path.endsWith(value))
        ) {
          fileList.push(item.path)
        }
      }
      const destFileList: string[] = []
      for (const file of fileList) {
        const destPath = path.relative(moduleDir, file)
        if (!destFileList.includes(destPath)) {
          zipFile.addFile(file, destPath)
          destFileList.push(destPath)
        } else {
          this.appendLog(`Warning: Duplicated "${destPath}", skipping.`)
        }
      }
    }
    zipFile.end()
    return new Promise((r) => {
      const bufs: Buffer[] = []
      const hash = createHash('sha256')
      zipFile.outputStream
        .on('readable', () => {
          let buf: Buffer
          while ((buf = zipFile.outputStream.read() as Buffer)) {
            bufs.push(buf)
            hash.update(buf)
          }
        })
        .on('end', () => {
          const buf = Buffer.concat(bufs)
          let name =
            this.options.outputName || `${this.config.defaultFileName}.zip`
          if (this.options?.hash) {
            name = name.replace(
              /\.(\w+)$/gi,
              `.${hash.digest('hex').slice(0, 7)}.$1`
            )
          }
          this.appendLog(`Successfully built ${name}.`)
          r({ name, buf })
        })
    })
  }

  moduleNameToInfo(type: ModuleType): ModuleInfo[] {
    return _.intersectionWith(
      this.moduleOverview.modules,
      this.options?.modules[type] || [],
      (a, b) => a.name === b
    )
  }

  mergeCollectionIntoResource(): ModuleInfo[] {
    const resourceModules = this.moduleOverview.modules.filter(
      (value) => value.type === 'resource'
    )
    const collectionModules = this.moduleOverview.modules.filter(
      (value) => value.type === 'collection'
    )
    const optCollections = this.options?.modules.collection || []
    const optResources = this.options?.modules.resource || []
    const resultResources = new Set(
      _.intersectionWith(resourceModules, optResources, (a, b) => a.name === b)
    )
    for (const { contains } of _.intersectionWith(
      collectionModules,
      optCollections,
      (a, b) => a.name === b
    )) {
      for (const item of _.intersectionWith(
        resourceModules,
        contains ?? [],
        (a, b) => a.name === b
      )) {
        resultResources.add(item)
      }
    }
    return Array.from(resultResources)
  }
}
