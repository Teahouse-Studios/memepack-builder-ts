import { ZipFile } from 'yazl'
import { ArchiveMap, LanguageMap } from '../types'

export class PackagingWorker {
  baseResourcePath: string
  languageMap: LanguageMap
  excludedFiles: string[]
  otherResources: ArchiveMap
  otherObjects: Record<string, string | Buffer | null>

  constructor({
    baseResourcePath,
    languageMap,
    otherResources = new Map(),
    otherObjects = {},
    excludedFiles = [],
  }: {
    baseResourcePath: string
    languageMap: LanguageMap
    otherResources?: ArchiveMap
    otherObjects?: Record<string, string | Buffer | null>
    excludedFiles?: string[]
  }) {
    this.baseResourcePath = baseResourcePath
    this.languageMap = languageMap
    this.otherResources = otherResources
    this.otherObjects = otherObjects
    this.excludedFiles = excludedFiles
  }

  async pack(): Promise<Buffer> {
    const excludedFiles = [...this.excludedFiles, ...this.languageMap.keys()]
    const otherResources: ArchiveMap = new Map()
    for (const [key, value] of this.otherResources) {
      if (!excludedFiles.includes(key)) {
        otherResources.set(key, value)
      }
    }
    const zipFile = new ZipFile()
    for (const [key, value] of otherResources) {
      zipFile.addFile(value, key)
    }
    for (const [key, value] of this.languageMap) {
      zipFile.addBuffer(
        Buffer.from(
          JSON.stringify(Object.fromEntries(value), null, 4),
          'utf-8'
        ),
        key,
        { mtime: new Date(0) }
      )
    }
    Object.entries(this.otherObjects)
      .filter(([key, value]) => key && value && value !== '')
      .forEach(([key, value]) => {
        if (value instanceof Buffer) {
          zipFile.addBuffer(value, key, { mtime: new Date(0) })
        } else if (typeof value === 'string') {
          zipFile.addBuffer(Buffer.from(value, 'utf-8'), key, {
            mtime: new Date(0),
          })
        }
      })
    zipFile.end()
    return new Promise((resolve) => {
      const bufs: Buffer[] = []
      zipFile.outputStream
        .on('readable', () => {
          let buf: Buffer
          while ((buf = zipFile.outputStream.read() as Buffer)) {
            bufs.push(buf)
          }
        })
        .on('end', () => {
          const buf = Buffer.concat(bufs)
          resolve(buf)
        })
    })
  }
}
