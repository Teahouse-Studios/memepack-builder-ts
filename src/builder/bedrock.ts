import { resolve } from 'node:path'
import { exists, readJSON, readFile } from 'fs-extra'
import { ZipFile } from 'yazl'
import { PackBuilder } from './index.js'
import { JsonPatch } from '../json/patch.js'
import { LangFileConverter } from '../lang/converter.js'
import type { BedrockBuildOptions } from '../option/bedrock.js'
import type { ResourceModule } from '../module/index.js'
import {
  _isJsonContentEntry,
  type ArchiveMap,
  _isLangFileEntry,
  type ArchiveJsonContentEntry,
  type ArchiveLangFileEntry,
  type ArchiveJsonEntry,
  _isFileEntry,
  _isJsonEntry,
} from '../archive/index.js'

/**
 * @public
 */
export interface BedrockTextureFile {
  texture_data: Record<string, unknown>
}

/**
 *
 * @param textureFileName - output file name
 * @param selectedModules - generate file from these modules
 * @returns
 * @public
 */
export async function generateBedrockTextureFile(
  textureFileName: string,
  selectedModules: ResourceModule[]
): Promise<BedrockTextureFile> {
  const texture: BedrockTextureFile = { texture_data: {} }
  selectedModules.forEach(async (module) => {
    const targetPath = resolve(module.path, 'textures', textureFileName)
    if (await exists(targetPath)) {
      Object.assign(
        texture.texture_data,
        (
          await readJSON(targetPath, {
            encoding: 'utf8',
          })
        ).texture_data
      )
    }
  })
  return texture
}

/**
 * @public
 */
export class BedrockPackBuilder extends PackBuilder {
  async build(options: BedrockBuildOptions): Promise<Buffer> {
    this.decideSelectedModules(options)
    await this.getPackEntries()
    const zipFile = new ZipFile()
    this.#addBedrockTextureFile()
    if (options.compatible) {
      this.#applyCompatModification()
    }
    for (const [key, entry] of this.entries) {
      if (_isLangFileEntry(entry)) {
        const finalContent = await this.#makeLangPatchedContent(entry)
        const storeContent = LangFileConverter.dumpBedrockLang(finalContent)
        zipFile.addBuffer(Buffer.from(storeContent), key, { mtime: new Date(0) })
        continue
      }
      if (_isJsonEntry(entry)) {
        const finalContent = await this.#makeJsonPatchedContent(entry)
        const storeContent = JSON.stringify(finalContent, null, 2)
        zipFile.addBuffer(Buffer.from(storeContent), key, { mtime: new Date(0) })
        continue
      }
      if (_isFileEntry(entry) && !_isLangFileEntry(entry)) {
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

  async #makeLangPatchedContent(entry: ArchiveJsonEntry | ArchiveLangFileEntry) {
    if (_isJsonContentEntry(entry)) {
      if (entry.patch) {
        return JsonPatch.applyJsonContentPatch(structuredClone(entry.content), entry.patch)
      } else {
        return entry.content
      }
    } else {
      const rawContent = LangFileConverter.parseBedrockLang(
        await readFile(entry.filePath, { encoding: 'utf-8' })
      )
      if (entry.patch) {
        return JsonPatch.applyJsonContentPatch(rawContent, entry.patch)
      } else {
        return rawContent
      }
    }
  }

  async #makeJsonPatchedContent(entry: ArchiveJsonEntry) {
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

  async #addBedrockTextureFile() {
    ;['item_texture.json', 'terrain_texture.json'].forEach(async (value) => {
      const content: BedrockTextureFile = await generateBedrockTextureFile(
        value,
        this.selectedModules
      )
      this.entries.set(`textures/${value}`, { content, patch: {} } as ArchiveJsonContentEntry)
    })
  }

  #applyCompatModification() {
    this.entries.delete('texts/languages.json')
    this.entries.delete('texts/language_names.json')
    const newEntries: ArchiveMap = new Map()
    for (const [k, v] of this.entries) {
      newEntries.set(k.replace('zh_ME', 'zh_CN'), v)
    }
    this.entries = newEntries
  }
}
