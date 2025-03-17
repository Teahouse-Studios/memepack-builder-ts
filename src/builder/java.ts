import { PackBuilder } from './index.js'
import { readJSON } from 'fs-extra/esm'
import { ZipFile } from 'yazl'
import { _jsonDumpEnsureAscii } from '../json/index.js'
import {
  _isJsonContentEntry,
  type ArchiveMap,
  _isFileEntry,
  _isPatchableEntry,
  type ArchivePatchableEntry,
  _isJsonEntry,
  type ArchiveJsonEntry,
} from '../archive/index.js'
import type { ResourceModule } from '../module/index.js'
import type { JavaBuildOptions } from '../option/java.js'
import type { TransformOptions } from '../option/index.js'
import { LangFileConverter } from '../lang/converter.js'
import { JsonPatch } from '../json/patch.js'
import { normalize } from 'node:path'

/**
 * @public
 */
export const LEGACY_FILENAME_CONFIG = {
  'assets/minecraft/lang/zh_meme\\.(.+)': 'assets/minecraft/lang/zh_cn.lang',
  'assets/minecraft/lang/zh_cn\\.(.+)': 'assets/minecraft/lang/zh_cn.lang',
  'assets/minecraft/textures/block/(.+)': 'assets/minecraft/textures/blocks/$1',
  'assets/minecraft/textures/item/(.+)': 'assets/minecraft/textures/items/$1',
}

/**
 * @public
 */
export const LEGACY_FILE_CONTENT_CONFIG = {
  'assets/minecraft/lang/zh_cn.lang': { requireLegacyMapping: true },
}

/**
 * @public
 */
export const COMPATIBLE_FILENAME_CONFIG = {
  'assets/minecraft/lang/zh_meme\\.(.+)': 'assets/minecraft/lang/zh_cn.$1',
}

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

  #applyMcMetaModification(mcMetaOptions: TransformOptions): ArchiveJsonEntry {
    const mcMetaDetail = this.entries.get('pack.mcmeta')
    if (!mcMetaDetail) {
      throw new Error('pack.mcmeta does not exist')
    }
    if (!_isJsonEntry(mcMetaDetail)) {
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
      let newKey = k.replaceAll('\\', '/')
      for (const [pattern, replacement] of Object.entries(COMPATIBLE_FILENAME_CONFIG)) {
        newKey = newKey.replaceAll(new RegExp(`^${pattern}$`, 'g'), replacement)
      }
      newKey = normalize(newKey)
      newEntries.set(newKey, v)
    }
    this.entries = newEntries
  }

  async build(options: JavaBuildOptions): Promise<Buffer> {
    this.decideSelectedModules(options)
    await this.getPackEntries()
    const zipFile = new ZipFile()
    if (options.compatible) {
      this.#transformStoreToCompatible()
    }
    await this.#addMcMetaEntry(zipFile, options)
    const toLegacy = options.type === 'legacy'
    if (toLegacy) {
      await this.#addLegacyEntries(zipFile)
    } else {
      await this.#addEntries(zipFile)
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

  async #addMcMetaEntry(zipFile: ZipFile, mcMetaOptions: TransformOptions) {
    const mcMetaDetail = this.entries.get('pack.mcmeta')
    if (!mcMetaDetail) {
      throw new Error('pack.mcmeta does not exist')
    }
    if (!_isJsonEntry(mcMetaDetail)) {
      throw new Error('pack.mcmeta is not a json file')
    }
    this.entries.delete('pack.mcmeta')
    mcMetaDetail.patch = {}
    mcMetaDetail.patch.nestedKey = {}
    if (mcMetaOptions.compatible) {
      mcMetaDetail.patch.nestedKey.deletion = new Set('language')
    }
    mcMetaDetail.patch.nestedKey.addition = new Map([['pack.pack_format', mcMetaOptions.format]])

    const patchedContent = await this.#makePatchedContent(mcMetaDetail)
    const storeContent = JSON.stringify(patchedContent, undefined, 4)
    zipFile.addBuffer(Buffer.from(storeContent), 'pack.mcmeta', { mtime: new Date(0) })
  }

  async #addEntries(zipFile: ZipFile) {
    for (const [key, entry] of this.entries) {
      if (_isPatchableEntry(entry)) {
        const patchedContent = await this.#makePatchedContent(entry)
        const storeContent = _jsonDumpEnsureAscii(patchedContent)
        zipFile.addBuffer(Buffer.from(storeContent), key, { mtime: new Date(0) })
        continue
      }
      if (_isFileEntry(entry)) {
        zipFile.addFile(entry.filePath, key)
        continue
      }
    }
  }

  async #addLegacyEntries(zipFile: ZipFile) {
    for (const [key, entry] of this.entries) {
      // key handling
      let legacyKey = key
      legacyKey = key.replaceAll('\\', '/')
      for (const [pattern, replacement] of Object.entries(LEGACY_FILENAME_CONFIG)) {
        legacyKey = legacyKey.replaceAll(new RegExp(`^${pattern}$`, 'g'), replacement)
      }
      legacyKey = normalize(legacyKey)

      // content handling
      if (_isPatchableEntry(entry)) {
        const patchedContent = await this.#makePatchedContent(entry)
        let handled = false
        for (const [key, config] of Object.entries(LEGACY_FILE_CONTENT_CONFIG)) {
          if (normalize(key) === legacyKey && config.requireLegacyMapping) {
            const storeContent = LangFileConverter.dumpJavaLang(
              await this.#transformContentToLegacy(patchedContent)
            )
            zipFile.addBuffer(Buffer.from(storeContent), legacyKey, { mtime: new Date(0) })
            handled = true
            break
          }
        }
        if (!handled) {
          const storeContent = _jsonDumpEnsureAscii(patchedContent)
          zipFile.addBuffer(Buffer.from(storeContent), legacyKey, { mtime: new Date(0) })
        }
        continue
      }
      if (_isFileEntry(entry)) {
        zipFile.addFile(entry.filePath, legacyKey)
        continue
      }
    }
  }
}
