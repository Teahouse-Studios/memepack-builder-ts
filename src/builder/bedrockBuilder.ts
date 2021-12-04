import fse from 'fs-extra'
import path from 'path'
import {
  BedrockTextureFile,
  BEBuildOptions,
  ModuleOverview,
  NameContentList,
} from '../types'
import { JSONToBELang, generateJSON } from '../utils'
import { PackBuilder } from './base'

export class BedrockBuilder extends PackBuilder {
  /**
   *
   */
  constructor({
    resourcePath,
    moduleOverview,
    options,
  }: {
    resourcePath?: string
    moduleOverview?: ModuleOverview
    options?: BEBuildOptions
  } = {}) {
    super({ resourcePath, moduleOverview, options })
  }

  validateOptions(): boolean {
    const beRequiredOptions = ['type', 'compatible', 'modules', 'hash']
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
    const { fileList, contentList } = await this.#addLanguage([
      'pack_icon.png',
      'manifest.json',
    ])
    contentList['textures/item_texture.json'] = await this.#getTexture(
      'item_texture.json'
    )
    contentList['textures/terrain_texture.json'] = await this.#getTexture(
      'terrain_texture.json'
    )
    return super.build(files, content, [
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

  async #getLanguageContent(): Promise<NameContentList> {
    const result = await generateJSON({
      resourcePath: this.resourcePath,
      modulePath: this.moduleOverview.modulePath,
      modules: this.moduleNameToInfo('resource'),
    })
    return result
  }

  #normalizeOptions(): void {
    const options = this.options
    options.outputName = `${
      options.outputName || this.config.defaultFileName
    }.${options.type}`
  }

  async #addLanguage(fileList: string[]): Promise<{
    fileList: string[],
    contentList: Record<string, string>,
  }> {
    const contentList: Record<string, string> = {}
    const langContent = await this.#getLanguageContent()
    for (const k in langContent) {
      if (k === 'texts/zh_ME.lang' && this.options.compatible) {
        contentList['texts/zh_CN.lang'] = JSONToBELang(langContent[k])
        fileList.push(
          'texts/language_names.json',
          'texts/languages.json',
          'texts/zh_CN.lang'
        )
      } else {
        contentList[k] = JSONToBELang(langContent[k])
      }
    }
    return {
      fileList,
      contentList,
    }
  }
}
