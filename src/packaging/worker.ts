import { ZipFile } from 'yazl'
import { ArchiveMap, LanguageMap } from '../types'

export class PackagingWorker {
  baseResourcePath: string
  languageMap: LanguageMap
  excludedFiles: string[]
  otherResources: ArchiveMap

  constructor({
    baseResourcePath,
    languageMap,
    otherResources,
    excludedFiles,
  }: {
    baseResourcePath: string
    languageMap: LanguageMap
    otherResources?: ArchiveMap
    excludedFiles?: string[]
  }) {
    this.baseResourcePath = baseResourcePath
    this.languageMap = languageMap
    this.otherResources = otherResources ?? new Map()
    this.excludedFiles = excludedFiles ?? []
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
        Buffer.from(JSON.stringify(mapToObject(value)), 'utf-8'),
        key
      )
    }
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

const mapToObject = (map: Map<string, string>): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const [key, value] of map) {
    result[key] = value
  }
  return result
}
