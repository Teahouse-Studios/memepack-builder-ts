/**
 * @method PackBuilder
 * @param {Object}
 */

import fs from 'fs'
import { createHash } from 'crypto'
import { zip } from 'compressing'
import { BuilderConfig, BuildOptions, ModuleOverview } from '../types'
import { defaultConfig } from '../constants'
import path from 'path'

export class PackBuilder {
  config: BuilderConfig
  resourcePath: string
  moduleOverview: ModuleOverview
  options: BuildOptions
  log: string[] = []

  constructor(
    resourcePath: string,
    moduleOverview: ModuleOverview,
    options?: BuildOptions
  ) {
    this.config = fs.existsSync(
      `${process.env.HOME || process.env.USERPROFILE}/.memepack-builder.json`
    )
      ? JSON.parse(
          fs.readFileSync(`${process.env.HOME}/.memepack-builder.json`, {
            encoding: 'utf8',
          })
        )
      : defaultConfig
    this.resourcePath = path.resolve(resourcePath)
    this.moduleOverview = moduleOverview
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
    this.clearLog()
    excludedFileNames.push('add.json', 'remove.json', 'module_manifest.json')
    const modulePath = this.moduleOverview.modulePath
    const validModules = this.moduleOverview.modules.resource.map((value) => {
      return value.name
    })
    this.appendLog(`Building pack.`)
    const zipStream = new zip.Stream()
    for (const file of extraFiles) {
      zipStream.addEntry(`${this.resourcePath}/${file}`, {
        relativePath: `${file}`,
      })
    }
    for (const entry in extraContent) {
      if (extraContent[entry] !== '') {
        zipStream.addEntry(Buffer.from(extraContent[entry], 'utf8'), {
          relativePath: entry,
          mtime: new Date(0),
        })
      }
    }
    for (const module of this.mergeCollectionIntoResource()) {
      if (!validModules.includes(module)) {
        this.appendLog(
          `Warning: Resource module "${module}" does not exist, skipping.`
        )
        continue
      }
      const fileList: string[] = []
      const destFileList: string[] = []
      this.#readFileList(`${modulePath}/${module}/`, fileList)
      const re = new RegExp(`(${excludedFileNames.join('|')})$`, 'g')
      for (const file of fileList) {
        if (re.test(file)) {
          continue
        }
        const destFilePath = file
          .replace(path.resolve(modulePath, module), '')
          .replace(/^[/\\]*/g, '')
        if (!destFileList.includes(destFilePath)) {
          zipStream.addEntry(file, { relativePath: destFilePath })
          destFileList.push(destFilePath)
        } else {
          this.appendLog(`Warning: Duplicated "${destFilePath}", skipping.`)
        }
      }
    }
    return new Promise((r) => {
      const bufs: Buffer[] = []
      const hash = createHash('sha256')
      zipStream
        .on('readable', () => {
          let buf: Buffer
          while ((buf = zipStream.read())) {
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
          r({
            name,
            buf,
          })
        })
    })
  }

  #readFileList(prefix: string, fileList: string[]): void {
    for (const file of fs.readdirSync(prefix)) {
      const stat = fs.statSync(path.resolve(prefix, file))
      if (stat.isDirectory()) {
        this.#readFileList(path.resolve(prefix, file), fileList)
      }
      if (stat.isFile()) {
        fileList.push(path.resolve(prefix, file))
      }
    }
  }

  mergeCollectionIntoResource(): string[] {
    const selectedCollections = this.options?.modules.collection || []
    const selectedResources = new Set(this.options?.modules.resource)
    const collections = this.moduleOverview.modules.collection
    for (const item of selectedCollections) {
      const target = collections.find((value) => {
        return value.name === item
      })
      if (!target) {
        this.appendLog(
          `Warning: Collection module "${item}" does not exist, skipping.`
        )
        continue
      }
      for (const containedModule of target?.contains || []) {
        selectedResources.add(containedModule)
      }
    }
    return Array.from(selectedResources)
  }
}
