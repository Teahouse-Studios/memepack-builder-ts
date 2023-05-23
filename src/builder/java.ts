import type {
  ArchiveDetail,
  ArchiveMap,
  JavaBuildOptions,
  ResourceModule,
  TransformOptions,
} from '../types'
import { PackBuilder } from './base'
import fs from 'fs-extra'
import { ZipFile } from 'yazl'
import _ from 'lodash'
import { _jsonDumpEnsureAscii, JsonTransformation, LangFileConvertor } from '../json'

/**
 * @public
 */
export class JavaPackBuilder extends PackBuilder {
  #legacyMappingFilePath: string

  constructor(
    parsedModules: ResourceModule[],
    priorityFilePath: string,
    legacyMappingFilePath: string
  ) {
    super(parsedModules, priorityFilePath)
    this.#legacyMappingFilePath = legacyMappingFilePath
  }

  #applyMcMetaModification(mcMetaOptions: TransformOptions): ArchiveDetail | undefined {
    const mcMetaDetail = this.entries.get('pack.mcmeta')
    if (mcMetaDetail) {
      mcMetaDetail.modification.nestedKey = {}
      if (mcMetaOptions.compatible) {
        mcMetaDetail.modification.nestedKey.deletion = new Set('language')
      }
      mcMetaDetail.modification.nestedKey.addition = new Map([
        ['pack.pack_format', mcMetaOptions.format],
      ])
      this.entries.set('pack.mcmeta', mcMetaDetail)
    }
    return mcMetaDetail
  }

  async #transformContentToLegacy(content: Record<string, any>): Promise<Record<string, any>> {
    const legacyMapping: Record<string, string> = await fs.readJSON(this.#legacyMappingFilePath)
    const contentKeys = Object.keys(content)
    for (const [k, v] of Object.entries(legacyMapping)) {
      if (contentKeys.includes(k)) {
        content[v] = content[k]
        delete content[k]
      }
    }
    return content
  }

  #transformStoreToCompatible() {
    const newEntries: ArchiveMap = new Map()
    for (const [k, v] of this.entries) {
      newEntries.set(k.replace(/zh_meme/, 'zh_cn'), v)
    }
    this.entries = newEntries
  }

  async build(options: JavaBuildOptions): Promise<Buffer> {
    this.decideSelectedModules(options)
    await this.getPackEntries()
    const zipFile = new ZipFile()
    this.#applyMcMetaModification({
      compatible: options.compatible,
      format: options.format,
    })
    if (options.compatible) {
      this.#transformStoreToCompatible()
    }
    const toLegacy = options.type === 'legacy'
    this.entries.forEach(async (detail, key) => {
      if (/\.(?:json|mcmeta|lang)$/.test(key)) {
        const finalContent = await this.#makeJsonFinalContent(detail, toLegacy)
        if (key.endsWith('.mcmeta')) {
          const storeContent = JSON.stringify(finalContent, undefined, 4)
          zipFile.addBuffer(Buffer.from(storeContent), key, { mtime: new Date(0) })
        } else {
          if (toLegacy) {
            const storeContent = LangFileConvertor.dumpJavaLang(finalContent)
            const storeKey = key.replace(/zh_(?:meme|cn)\.json/g, 'zh_cn.lang')
            zipFile.addBuffer(Buffer.from(storeContent), storeKey, { mtime: new Date(0) })
          } else {
            const storeContent = _jsonDumpEnsureAscii(finalContent)
            zipFile.addBuffer(Buffer.from(storeContent), key, { mtime: new Date(0) })
          }
        }
      } else {
        if (detail.filePath) {
          zipFile.addFile(detail.filePath, key)
        }
      }
    })
    zipFile.end()
    return new Promise((resolve) => {
      const bufs: Buffer[] = []
      zipFile.outputStream
        .on('data', (data: Buffer | string) => bufs.push(Buffer.from(data)))
        .on('end', () => resolve(Buffer.concat(bufs)))
    })
  }

  async #makeJsonFinalContent(
    detail: ArchiveDetail,
    toLegacy: boolean
  ): Promise<Record<string, any>> {
    let content: Record<string, any>
    if (detail.content) {
      content = JsonTransformation.applyJsonContentModification(
        _.cloneDeep(detail.content),
        detail.modification
      )
    } else if (detail.filePath) {
      content = await JsonTransformation.applyJsonModification(detail.filePath, detail.modification)
    } else {
      content = {}
    }
    if (toLegacy) {
      return await this.#transformContentToLegacy(content)
    } else {
      return content
    }
  }
}
