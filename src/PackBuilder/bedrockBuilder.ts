import fse from 'fs-extra'
import path from 'path'
import {
  BedrockTextureFile,
  BEBuildOptions,
  ModuleOverview,
  LanguageMap,
} from '../types'
import { JSONToBELang, generateJSON } from '../LanguageGenerator'
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

  async build(): Promise<{ filename: string; buf: Buffer }> {
    this.mergeCollectionIntoResource()
    const { fileList, contentList } = await this.#addLanguage([
      'pack_icon.png',
      'manifest.json',
    ])
    contentList.set(
      'textures/item_texture.json',
      await this.#getTexture('item_texture.json')
    )
    contentList.set(
      'textures/terrain_texture.json',
      await this.#getTexture('terrain_texture.json')
    )
    return super.build({
      files: fileList,
      content: contentList,
      excludedFiles: ['item_texture.json', 'terrain_texture.json'],
    })
  }

  async #getTexture(textureFileName: string): Promise<string> {
    const texture: BedrockTextureFile = { texture_data: {} }
    for (const module of this.options.modules.resource) {
      try {
        Object.assign(
          texture.texture_data,
          (
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
        )
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

  async #getLanguageMap(): Promise<LanguageMap> {
    const result = await generateJSON({
      resourcePath: this.resourcePath,
      mainLanguageFile: 'texts/zh_ME.lang',
      modulePath: this.moduleOverview.modulePath,
      modules: this.moduleNameToInfo('resource'),
    })
    return result
  }

  async #addLanguage(fileList: string[]): Promise<{
    fileList: string[]
    contentList: Map<string, string>
  }> {
    const contentList: Map<string, string> = new Map()
    const langContent = await this.#getLanguageMap()
    for (const [k, v] of langContent) {
      if (k === 'texts/zh_ME.lang' && this.options.compatible) {
        contentList.set('texts/zh_CN.lang', JSONToBELang(v))
        fileList.push(
          'texts/language_names.json',
          'texts/languages.json',
          'texts/zh_CN.lang'
        )
      } else {
        contentList.set(k, JSONToBELang(v))
      }
    }
    return {
      fileList,
      contentList,
    }
  }
}
