import fs from 'fs'
import { BedrockTextureFile, BuildOptions, ModuleOverview } from '../types'
import { generateBedrock } from '../utils'
import { PackBuilder } from './base'

export class BedrockBuilder extends PackBuilder {
  declare options: BuildOptions & {
    type: 'mcpack' | 'zip'
  }
  /**
   *
   */
  constructor(
    resourcePath: string,
    moduleOverview: ModuleOverview,
    options?: BuildOptions & {
      type: 'mcpack' | 'zip'
    }
  ) {
    super(resourcePath, moduleOverview, options)
  }

  validateOptions(): boolean {
    const beRequiredOptions = [
      'type',
      'compatible',
      'modules',
      'outputDir',
      'hash',
    ]
    const options = this.options
    for (const option of beRequiredOptions) {
      if (!(option in options)) {
        this._appendLog(`Warning: Missing required argument "${option}".`)
        return false
      }
    }
    return true
  }

  async build(): Promise<{ name: string, buf: Buffer }> {
    if (!this.validateOptions()) {
      throw new Error('Failed to validate')
    }
    this._normalizeOptions()
    this.mergeCollectionIntoResource()
    const extraFiles = ['pack_icon.png', 'manifest.json']
    const extraContent = {
      'textures/item_texture.json': this.getTexture('item_texture.json'),
      'textures/terrain_texture.json': this.getTexture('terrain_texture.json'),
    }
    this._addLanguage(extraFiles, extraContent)
    return this._build(extraFiles, extraContent, [
      'item_texture.json',
      'terrain_texture.json',
    ])
  }

  getTexture(textureFileName: string): string {
    const texture: BedrockTextureFile = { texture_data: {} }
    for (const module of this.options.modules.resource) {
      const path = `${this.moduleOverview.modulePath}/${module}/textures/${textureFileName}`
      if (fs.existsSync(path)) {
        const data = JSON.parse(
          fs.readFileSync(path, { encoding: 'utf8' })
        ).texture_data
        for (const k in data) {
          texture.texture_data[k] = data[k]
        }
      }
    }
    if (texture.texture_data === {}) {
      return ''
    } else {
      return JSON.stringify(texture, null, 4)
    }
  }

  getLanguageContent(langFilePath: string, withModules: boolean): string {
    const result = generateBedrock(
      `${this.resourcePath}/${langFilePath}`,
      withModules,
      this.moduleOverview,
      this.options.modules.resource
    )
    this._appendLog(result.log)
    return result.content
  }

  _normalizeOptions(): void {
    const options = this.options
    options.outputName = `${
      options.outputName || this.config.defaultFileName
    }.${options.type}`
  }

  _addLanguage(fileList: string[], contentList: Record<string, string>): void {
    const langContent = this.getLanguageContent('texts/zh_ME.lang', true)
    if (this.options.compatible) {
      contentList['texts/zh_CN.lang'] = langContent
    } else {
      fileList.push(
        'texts/language_names.json',
        'texts/languages.json',
        'texts/zh_CN.lang'
      )
      contentList['texts/zh_ME.lang'] = langContent
    }
  }
}
