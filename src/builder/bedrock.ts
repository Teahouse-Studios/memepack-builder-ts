import _ from 'lodash'
import { ZipFile } from 'yazl'
import { JsonTransformation, LangFileConvertor } from '../json'
import { getBedrockTextureFile } from '../module'
import { ArchiveDetail, ArchiveMap, BedrockBuildOptions, BedrockTextureFile } from '../types'
import { PackBuilder } from './base'

export class BedrockPackBuilder extends PackBuilder {
  async build(options: BedrockBuildOptions): Promise<Buffer> {
    const zipFile = new ZipFile()
    this.#addBedrockTextureFile()
    if (options.compatible) {
      this.#applyCompatMoification()
    }
    this.entries.forEach(async (detail, key) => {
      const finalContent = await this.#makeFinalContent(detail)
      const storeContent = LangFileConvertor.dumpBedrockLang(finalContent)
      zipFile.addBuffer(Buffer.from(storeContent), key, { mtime: new Date(0) })
    })
    zipFile.end()
    return new Promise((resolve) => {
      const bufs: Buffer[] = []
      zipFile.outputStream
        .on('data', (data: Buffer | string) => bufs.push(Buffer.from(data)))
        .on('end', () => resolve(Buffer.concat(bufs)))
    })
  }

  async #makeFinalContent(detail: ArchiveDetail) {
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
    return content
  }

  async #addBedrockTextureFile() {
    ;['item_texture.json', 'terrain_texture.json'].forEach(async (value) => {
      const content: BedrockTextureFile = await getBedrockTextureFile(value, this.selectedModules)
      this.entries.set(`textures/${value}`, { content, modification: {} })
    })
  }

  #applyCompatMoification() {
    this.entries.delete('texts/languages.json')
    this.entries.delete('texts/language_names.json')
    const newEntries: ArchiveMap = new Map()
    for (const [k, v] of this.entries) {
      newEntries.set(k.replace('zh_ME', 'zh_CN'), v)
    }
    this.entries = newEntries
  }
}
