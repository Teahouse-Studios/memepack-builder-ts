/**
 * @method PackBuilder
 * @param {Object}
 */

import fse from 'fs-extra'
import klaw from 'klaw'
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
} from '../types'
import { defaultConfig } from '../constants'

export class PackBuilder {
  config: BuilderConfig
  resourcePath: string
  moduleOverview: ModuleOverview
  options: JEBuildOptions | BEBuildOptions
  log: string[] = []

  constructor(
    resourcePath?: string,
    moduleOverview?: ModuleOverview,
    options?: JEBuildOptions | BEBuildOptions
  ) {
    this.config = defaultConfig
    this.resourcePath = path.resolve(resourcePath || '.')
    this.moduleOverview = moduleOverview || {
      modulePath: path.resolve('./modules'),
      modules: {
        resource: [],
        collection: [],
      },
    }
    this.options = options || {
      type: 'normal',
      outputDir: path.resolve('.'),
      modules: {
        resource: [],
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
    extraFiles: string[] = [],
    extraContent: Record<string, string> = {},
    excludedFileNames: string[] = []
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
      null
    }
    this.clearLog()
    excludedFileNames.push('add.json', 'remove.json', 'module_manifest.json')
    const modulePath = this.moduleOverview.modulePath
    this.appendLog(`Building pack.`)
    const zipFile = new ZipFile()
    extraFiles.forEach((value) => {
      zipFile.addFile(path.resolve(this.resourcePath, value), value)
    })
    for (const entry in extraContent) {
      if (extraContent[entry] !== '') {
        zipFile.addBuffer(Buffer.from(extraContent[entry], 'utf8'), entry, {
          mtime: new Date(0),
        })
      }
    }
    for (const module of this.mergeCollectionIntoResource()) {
      const fileList: string[] = []
      klaw(path.resolve(modulePath, module.dirName)).on('data', (item) => {
        if (
          item.stats.isFile() &&
          excludedFileNames.every((value) => {
            !item.path.endsWith(value)
          })
        ) {
          fileList.push(item.path)
        }
      })
      const destFileList: string[] = []
      for (const file of fileList) {
        const destPath = path.relative(modulePath, file)
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

  #checkExists(source: string[], check: ModuleInfo[]): ModuleInfo[] {
    const res: ModuleInfo[] = []
    for (const item of source) {
      const target = check.find((value) => value.name === item)
      if (!target) {
        this.appendLog(`Warning: Module "${item}" does not exist, skipping.`)
        continue
      }
      res.push(target)
    }
    return res
  }

  mergeCollectionIntoResource(): ModuleInfo[] {
    const optCollections = this.options?.modules.collection || []
    const optResources = this.options?.modules.resource || []
    const modules = this.moduleOverview.modules
    const resultResources = new Set<ModuleInfo>(
      this.#checkExists(optResources, modules.resource)
    )
    for (const { contains } of this.#checkExists(
      optCollections,
      modules.collection
    )) {
      for (const item of this.#checkExists(contains || [], modules.resource)) {
        resultResources.add(item)
      }
    }
    return Array.from(resultResources)
  }
}
