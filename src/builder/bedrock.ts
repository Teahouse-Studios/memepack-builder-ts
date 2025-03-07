import { exists, readJSON, readFile } from 'fs-extra'
import { resolve } from 'node:path'
import type { ResourceModule } from '../module/index.js'
import { PackBuilder } from './index.js'
import type { BedrockBuildOptions } from '../option/bedrock.js'
import { LangFileConverter } from '../lang/converter.js'
import { ZipFile } from 'yazl'
import type { ArchiveDetail, ArchiveMap } from '../archive/index.js'
import { JsonPatch } from '../json/patch.js'

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
export async function getBedrockTextureFile(
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
    this.entries.forEach(async (detail, key) => {
      if (/\.lang$/.test(key)) {
        const finalContent = await this.#makeLangFinalContent(detail)
        const storeContent = LangFileConverter.dumpBedrockLang(finalContent)
        zipFile.addBuffer(Buffer.from(storeContent), key, { mtime: new Date(0) })
      } else if (/\.json$/.test(key)) {
        const finalContent = await this.#makeJsonFinalContent(detail)
        const storeContent = JSON.stringify(finalContent, null, 2)
        zipFile.addBuffer(Buffer.from(storeContent), key, { mtime: new Date(0) })
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
        .on('data', (data) => bufs.push(Buffer.from(data)))
        .on('end', () => resolve(Buffer.concat(bufs)))
    })
  }

  async #makeLangFinalContent(detail: ArchiveDetail) {
    if (detail.content) {
      const content = JsonPatch.applyJsonContentPatch(
        structuredClone(detail.content),
        detail.modification
      )
      return content
    } else if (detail.filePath) {
      const rawContent = LangFileConverter.parseBedrockLang(
        await readFile(detail.filePath, { encoding: 'utf-8' })
      )
      const modifiedContent = JsonPatch.applyJsonContentPatch(rawContent, detail.modification)
      return modifiedContent
    } else {
      return {}
    }
  }

  async #makeJsonFinalContent(detail: ArchiveDetail) {
    if (detail.content) {
      const content = JsonPatch.applyJsonContentPatch(
        structuredClone(detail.content),
        detail.modification
      )
      return content
    } else if (detail.filePath) {
      const content = await JsonPatch.applyJsonPatch(detail.filePath, detail.modification)
      return content
    } else {
      return {}
    }
  }

  async #addBedrockTextureFile() {
    ;['item_texture.json', 'terrain_texture.json'].forEach(async (value) => {
      const content: BedrockTextureFile = await getBedrockTextureFile(value, this.selectedModules)
      this.entries.set(`textures/${value}`, { content, modification: {} })
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
