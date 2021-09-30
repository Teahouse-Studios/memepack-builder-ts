import fse from 'fs-extra'
import path from 'path'
import { BedrockTextureFile, BEBuildOptions, ModuleOverview } from '../types'
import { generateBedrock } from '../utils'
import { PackBuilder } from './base'

export class BedrockBuilder extends PackBuilder {
  /**
   *
   */
  constructor(
    resourcePath?: string,
    moduleOverview?: ModuleOverview,
    options?: BEBuildOptions
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
        this.appendLog(`Warning: Missing required argument "${option}".`)
        return false
      }
    }
    return true
  }

  async build(): Promise<{ name: string; buf: Buffer }> {
    if (!this.validateOptions()) {
      throw new Error('Failed to validate')
    }
    this.#normalizeOptions()
    this.mergeCollectionIntoResource()
    const extraFiles = ['pack_icon.png', 'manifest.json']
    const extraContent = {
      'textures/item_texture.json': await this.#getTexture('item_texture.json'),
      'textures/terrain_texture.json': await this.#getTexture(
        'terrain_texture.json'
      ),
    }
    this.#addLanguage(extraFiles, extraContent)
    return super.build(extraFiles, extraContent, [
      'item_texture.json',
      'terrain_texture.json',
    ])
  }

  async #getTexture(textureFileName: string): Promise<string> {
    const texture: BedrockTextureFile = { texture_data: {} }
    for (const module of this.options.modules.resource) {
      try {
        const data = (
          await fse.readJSON(
            path.resolve(
              this.moduleOverview.modulePath,
              module,
              'textures',
              textureFileName
            ),
            { encoding: 'utf8' }
          )
        ).texture_data
        for (const k in data) {
          texture.texture_data[k] = data[k]
        }
      } catch (e) {
        console.error(e)
      }
    }
    if (!Object.keys(texture.texture_data).length) {
      return ''
    } else {
      return JSON.stringify(texture, null, 4)
    }
  }

  async #getLanguageContent(
    langFilePath: string,
    withModules: boolean
  ): Promise<string> {
    const result = await generateBedrock(
      `${this.resourcePath}/${langFilePath}`,
      withModules,
      this.moduleOverview,
      this.options.modules.resource
    )
    this.appendLog(result.log)
    return result.content
  }

  #normalizeOptions(): void {
    const options = this.options
    options.outputName = `${
      options.outputName || this.config.defaultFileName
    }.${options.type}`
  }

  async #addLanguage(
    fileList: string[],
    contentList: Record<string, string>
  ): Promise<void> {
    const langContent = await this.#getLanguageContent('texts/zh_ME.lang', true)
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
