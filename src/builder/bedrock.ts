import fs from 'fs-extra'
import _ from 'lodash'
import { ZipFile } from 'yazl'
import { JsonTransformation, LangFileConvertor } from '../json'
import { getBedrockTextureFile } from '../module'
import type { ArchiveDetail, ArchiveMap, BedrockBuildOptions, BedrockTextureFile } from '../types'
import { PackBuilder } from './base'

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
        const storeContent = LangFileConvertor.dumpBedrockLang(finalContent)
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
        .on('data', (data: Buffer | string) => bufs.push(Buffer.from(data)))
        .on('end', () => resolve(Buffer.concat(bufs)))
    })
  }

  async #makeLangFinalContent(detail: ArchiveDetail) {
    if (detail.content) {
      const content = JsonTransformation.applyJsonContentModification(
        _.cloneDeep(detail.content),
        detail.modification
      )
      return content
    } else if (detail.filePath) {
      const rawContent = LangFileConvertor.parseBedrockLang(
        await fs.readFile(detail.filePath, { encoding: 'utf-8' })
      )
      const modifiedContent = JsonTransformation.applyJsonContentModification(
        rawContent,
        detail.modification
      )
      return modifiedContent
    } else {
      return {}
    }
  }

  async #makeJsonFinalContent(detail: ArchiveDetail) {
    if (detail.content) {
      const content = JsonTransformation.applyJsonContentModification(
        _.cloneDeep(detail.content),
        detail.modification
      )
      return content
    } else if (detail.filePath) {
      const content = await JsonTransformation.applyJsonModification(
        detail.filePath,
        detail.modification
      )
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
