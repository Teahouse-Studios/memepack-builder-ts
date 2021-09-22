import fse from 'fs-extra'
import path from 'path'
import { JEBuildOptions, ModuleOverview } from '../types'
import { generateJavaLegacy, generateJSON } from '../utils'
import { PackBuilder } from './base'

export class JavaBuilder extends PackBuilder {
  modPath: string

  constructor(
    resourcePath?: string,
    moduleOverview?: ModuleOverview,
    modPath?: string,
    options?: JEBuildOptions
  ) {
    super(resourcePath, moduleOverview, options)
    this.modPath = path.resolve(modPath || './mods')
  }

  validateOptions(): boolean {
    const latestJEPackFormat = this.config.latestJEPackFormat
    const legacyJEPackFormat = this.config.legacyJEPackFormat
    const jeRequiredOptions = [
      'type',
      'modules',
      'mod',
      'sfw',
      'format',
      'outputDir',
    ]
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
    const extraFiles = ['pack.png', 'LICENSE']
    const extraContent: Record<string, string> = {}
    this.#addLanguage(extraFiles, extraContent)
    return super.build(extraFiles, extraContent)
  }

  async #getLanguageContent(
    langFilePath: string,
    withModules: boolean
  ): Promise<string> {
    const options = this.options
    const languageModules = options.modules.resource.filter((name) => {
      return this.moduleOverview.modules.resource.find((value) => {
        return (
          value.name === name && value.classifier.includes('modified_language')
        )
      })
    })
    if (['normal', 'compat'].includes(options.type)) {
      const result = await generateJSON(
        langFilePath,
        withModules,
        this.moduleOverview,
        languageModules,
        options.mod
      )
      this.appendLog(result.log)
      return result.content
    } else if (options.type === 'legacy') {
      const result = await generateJavaLegacy(
        langFilePath,
        withModules,
        this.moduleOverview,
        languageModules,
        options.mod
      )
      this.appendLog(result.log)
      return result.content
    } else {
      return ''
    }
  }

  #normalizeOptions(): void {
    const options = this.options
    if (options.mod) {
      options.mod = options.mod.map((value) => {
        return path.resolve(this.modPath, value)
      })
    }
  }

  async #addLanguage(
    fileList: string[],
    contentList: Record<string, string>
  ): Promise<void> {
    switch (this.options.type) {
      case 'normal':
        fileList.push('pack.mcmeta')
        contentList['assets/minecraft/lang/zh_meme.json'] =
          await this.#getLanguageContent(
            `${this.resourcePath}/assets/minecraft/lang/zh_meme.json`,
            true
          )
        contentList['assets/realms/lang/zh_meme.json'] =
          await this.#getLanguageContent(
            `${this.resourcePath}/assets/realms/lang/zh_meme.json`,
            false
          )
        break
      case 'compat':
        contentList['pack.mcmeta'] = JSON.stringify(
          this.#processMcMetaFile(),
          null,
          4
        )
        contentList['assets/minecraft/lang/zh_cn.json'] =
          await this.#getLanguageContent(
            `${this.resourcePath}/assets/minecraft/lang/zh_meme.json`,
            true
          )
        contentList['assets/realms/lang/zh_cn.json'] =
          await this.#getLanguageContent(
            `${this.resourcePath}/assets/realms/lang/zh_cn.json`,
            false
          )
        break
      case 'legacy':
        contentList['pack.mcmeta'] = JSON.stringify(
          this.#processMcMetaFile(),
          null,
          4
        )
        contentList['assets/minecraft/lang/zh_cn.lang'] =
          await this.#getLanguageContent(
            `${this.resourcePath}/assets/minecraft/lang/zh_meme.json`,
            true
          )
        contentList['assets/realms/lang/zh_cn.lang'] =
          await this.#getLanguageContent(
            `${this.resourcePath}/assets/realms/lang/zh_cn.lang`,
            false
          )
        break
      default:
        break
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
