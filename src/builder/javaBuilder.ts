import fse from 'fs-extra'
import path from 'path'
import { JEBuildOptions, ModuleOverview, NameContentList } from '../types'
import { ensureAscii, generateJSON, JSONToJELang } from '../utils'
import { PackBuilder } from './base'

export class JavaBuilder extends PackBuilder {
  modPath: string

  constructor(
    resourcePath?: string,
    moduleOverview?: ModuleOverview,
    modPath?: string,
    options?: JEBuildOptions
  ) {
    super({ resourcePath, moduleOverview, options })
    this.modPath = path.resolve(modPath || './mods')
  }

  validateOptions(): boolean {
    const latestJEPackFormat = this.config.latestJEPackFormat
    const legacyJEPackFormat = this.config.legacyJEPackFormat
    const jeRequiredOptions = ['type', 'modules', 'mod', 'sfw', 'format']
    const options = this.options
    for (const option of jeRequiredOptions) {
      if (!(option in options)) {
        this.appendLog(`Warning: Missing required argument "${option}".`)
        return false
      }
    }
    // validate 'format' option
    if (!options.format) {
      options.format =
        options.type === 'legacy' ? legacyJEPackFormat : latestJEPackFormat
      this.appendLog(
        `Warning: Did not specify "pack_format". Assuming value is "${options.format}".`
      )
    } else {
      if (
        (options.type === 'legacy' && options.format !== legacyJEPackFormat) ||
        (['normal', 'compat'].includes(options.type) &&
          options.format <= legacyJEPackFormat)
      ) {
        this.appendLog(
          `Error: Type "${options.type}" does not match pack_format ${options.format}.`
        )
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
    })
    return result
  }

  #normalizeOptions(): void {
    const options = this.options
    if (options.mod) {
      options.mod = options.mod.map((value) => {
        return path.resolve(this.modPath, value)
      })
    }
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
