import { PackBuilder } from './index.js'
import { readJSON } from 'fs-extra/esm'
import { ZipFile } from 'yazl'
import { _jsonDumpEnsureAscii } from '../json/index.js'
import {
  _isJsonContentEntry,
  type ArchiveJsonContentEntry,
  type ArchiveMap,
  _isFileEntry,
  _isPatchableEntry,
  type ArchivePatchableEntry,
} from '../archive/index.js'
import type { ResourceModule } from '../module/index.js'
import type { JavaBuildOptions } from '../option/java.js'
import type { TransformOptions } from '../option/index.js'
import { LangFileConverter } from '../lang/converter.js'
import { JsonPatch } from '../json/patch.js'

/**
 * @public
 */
export const LEGACY_FILENAMES = ['assets/minecraft/lang/zh_cn.lang']

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

  #applyMcMetaModification(mcMetaOptions: TransformOptions): ArchiveJsonContentEntry {
    const mcMetaDetail = this.entries.get('pack.mcmeta')
    if (!mcMetaDetail) {
      throw new Error('pack.mcmeta does not exist')
    }
    if (!_isJsonContentEntry(mcMetaDetail)) {
      throw new Error('pack.mcmeta is not a json file')
    }
    mcMetaDetail.patch = {}
    mcMetaDetail.patch.nestedKey = {}
    if (mcMetaOptions.compatible) {
      mcMetaDetail.patch.nestedKey.deletion = new Set('language')
    }
    mcMetaDetail.patch.nestedKey.addition = new Map([['pack.pack_format', mcMetaOptions.format]])
    this.entries.set('pack.mcmeta', mcMetaDetail)

    return mcMetaDetail
  }

  async #transformContentToLegacy(content: Record<string, any>): Promise<Record<string, any>> {
    const legacyMapping: Record<string, string> = await readJSON(this.#legacyMappingFilePath)
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
    for (const [key, entry] of this.entries) {
      if (_isPatchableEntry(entry)) {
        const patchedContent = await this.#makePatchedContent(entry)
        if (key.endsWith('.mcmeta')) {
          const storeContent = JSON.stringify(patchedContent, undefined, 4)
          zipFile.addBuffer(Buffer.from(storeContent), key, { mtime: new Date(0) })
        } else {
          if (toLegacy) {
            const legacyKey = key.replace(/zh_(?:meme|cn)\.json/g, 'zh_cn.lang')
            if (LEGACY_FILENAMES.some((name) => key.includes(name))) {
              const storeContent = LangFileConverter.dumpJavaLang(
                await this.#transformContentToLegacy(patchedContent)
              )
              zipFile.addBuffer(Buffer.from(storeContent), legacyKey, { mtime: new Date(0) })
              continue
            } else {
              const storeContent = _jsonDumpEnsureAscii(patchedContent)
              zipFile.addBuffer(Buffer.from(storeContent), key, { mtime: new Date(0) })
            }
          } else {
            const storeContent = _jsonDumpEnsureAscii(patchedContent)
            zipFile.addBuffer(Buffer.from(storeContent), key, { mtime: new Date(0) })
          }
        }
        continue
      }
      if (_isFileEntry(entry)) {
        zipFile.addFile(entry.filePath, key)
        continue
      }
    }
    zipFile.end()
    return new Promise((resolve) => {
      const bufs: Buffer[] = []
      zipFile.outputStream
        .on('data', (data) => bufs.push(Buffer.from(data)))
        .on('end', () => resolve(Buffer.concat(bufs)))
    })
  }

  async #makePatchedContent(entry: ArchivePatchableEntry): Promise<Record<string, any>> {
    if (_isJsonContentEntry(entry)) {
      if (entry.patch) {
        return JsonPatch.applyJsonContentPatch(structuredClone(entry.content), entry.patch)
      } else {
        return entry.content
      }
    } else {
      if (entry.patch) {
        return await JsonPatch.applyJsonFilePatch(entry.filePath, entry.patch)
      } else {
        return await readJSON(entry.filePath)
      }
    }
  }
}
