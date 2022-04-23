import fse, { readJSON } from 'fs-extra'
import path from 'path'
import { JEBuildOptions, LanguageMap, ModuleOverview } from '../types'
import {
  ensureAscii,
  generateJSON,
  JELangToJSON,
  JSONToJELang,
} from '../LanguageGenerator'
import { PackBuilder } from './base'

export class JavaBuilder extends PackBuilder {
  constructor({
    resourcePath,
    moduleOverview,
    options,
  }: {
    resourcePath?: string
    moduleOverview?: ModuleOverview
    options?: JEBuildOptions
  } = {}) {
    super({ resourcePath, moduleOverview, options })
  }

  async build(): Promise<{ filename: string; buf: Buffer }> {
    this.mergeCollectionIntoResource()
    return super.build({
      files: ['pack.png', 'LICENSE'],
      content: await this.#getContentList(),
      excludedFiles: [],
    })
  }

  async #getLanguageMap(): Promise<LanguageMap> {
    const options = this.options
    const languageModules = this.moduleOverview.modules.filter((module) => {
      return options.modules.resource.find(
        (value) => module.name === value && module.languageModification
      )
    })
    const languageMap: LanguageMap = new Map()
    for (const value of new Set(options.mod)) {
      languageMap.set(
        value,
        value.endsWith('.json')
          ? await readJSON(value)
          : JELangToJSON((await fse.readFile(value)).toString('utf8'))
      )
    }
    const result = await generateJSON({
      resourcePath: this.resourcePath,
      mainLanguageFile: 'assets/minecraft/lang/zh_meme.json',
      modulePath: this.moduleOverview.modulePath,
      modules: languageModules,
      modFiles: languageMap,
    })
    return result
  }

  async #getContentList(): Promise<Map<string, string>> {
    const contentList: Map<string, string> = new Map()
    const langContent = await this.#getLanguageMap()
    switch (this.options.type) {
      case 'normal':
        contentList.set(
          'pack.mcmeta',
          JSON.stringify(await this.#processMcMetaFile(), null, 4)
        )
        for (const [k, v] of langContent) {
          contentList.set(k, ensureAscii(JSON.stringify(v, null, 4)))
        }
        break
      case 'compat':
        contentList.set(
          'pack.mcmeta',
          JSON.stringify(await this.#processMcMetaFile(), null, 4)
        )
        for (const [k, v] of langContent) {
          contentList.set(
            k.replace(/zh_meme\.json$/g, 'zh_cn.json'),
            ensureAscii(JSON.stringify(v, null, 4))
          )
        }
        break
      case 'legacy':
        contentList.set(
          'pack.mcmeta',
          JSON.stringify(await this.#processMcMetaFile(), null, 4)
        )
        for (const [k, v] of langContent) {
          contentList.set(
            k.replace(/zh_meme\.json$/g, 'zh_cn.lang'),
            JSONToJELang(v)
          )
        }
        break
      default:
        break
    }
    return contentList
  }

  async #processMcMetaFile(): Promise<any> {
    const data: any = await fse.readJSON(
      path.resolve(this.resourcePath, 'pack.mcmeta'),
      { encoding: 'utf8' }
    )
    const type = this.options.type
    if (type === 'compat') {
      delete data.language
    }
    const packFormat =
      type === 'legacy' ? this.config.legacyJEPackFormat : this.options.format
    data.pack.pack_format = packFormat || this.config.latestJEPackFormat
    return data
  }
}
