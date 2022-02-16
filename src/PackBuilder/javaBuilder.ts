import fse, { readJSON } from 'fs-extra'
import path from 'path'
import { JEBuildOptions, ModuleOverview, NameContentList } from '../types'
import { ensureAscii, generateJSON, JSONToJELang } from '../LanguageGenerator'
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

  async build(): Promise<{ name: string; buf: Buffer }> {
    this.mergeCollectionIntoResource()
    const { fileList, contentList } = await this.#addLanguage([
      'pack.png',
      'LICENSE',
    ])
    return super.build(fileList, contentList)
  }

  async #getLanguageContent(): Promise<NameContentList> {
    const options = this.options
    const languageModules = this.moduleOverview.modules.filter((module) => {
      options.modules.resource.find(
        (value) => module.name === value && module.languageModification
      )
    })
    const result = await generateJSON({
      resourcePath: this.resourcePath,
      mainLanguageFile: 'assets/minecraft/lang/zh_meme.json',
      modulePath: this.moduleOverview.modulePath,
      modules: languageModules,
      modFiles: Object.fromEntries(
        await Promise.all(
          Array.from(new Set(options.mod)).map(async (value) => [
            value,
            await readJSON(value),
          ]) ?? []
        )
      ),
    })
    return result
  }

  async #addLanguage(fileList: string[]): Promise<{
    fileList: string[]
    contentList: Record<string, string>
  }> {
    const contentList: Record<string, string> = {}
    const langContent = await this.#getLanguageContent()
    switch (this.options.type) {
      case 'normal':
        fileList.push('pack.mcmeta')
        for (const k in langContent) {
          contentList[k] = ensureAscii(JSON.stringify(langContent[k], null, 4))
        }
        break
      case 'compat':
        contentList['pack.mcmeta'] = JSON.stringify(
          await this.#processMcMetaFile(),
          null,
          4
        )
        for (const k in langContent) {
          contentList[k.replace(/zh_meme\.json$/g, 'zh_cn.json')] = ensureAscii(
            JSON.stringify(langContent[k], null, 4)
          )
        }
        break
      case 'legacy':
        contentList['pack.mcmeta'] = JSON.stringify(
          await this.#processMcMetaFile(),
          null,
          4
        )
        for (const k in langContent) {
          contentList[k.replace(/zh_meme\.json$/g, 'zh_cn.lang')] =
            JSONToJELang(langContent[k])
        }
        break
      default:
        break
    }
    return {
      fileList,
      contentList,
    }
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
