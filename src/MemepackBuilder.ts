import fse from 'fs-extra'
import path from 'path'
import { BedrockBuilder, JavaBuilder } from './PackBuilder'
import { ModuleParser } from './ModuleParser'
import { JEBuildOptions, BEBuildOptions } from './types'
import { BedrockValidator, JavaValidator } from './OptionValidator'
import { Logger } from './Logger'

export class MemepackBuilder {
  #builder: BedrockBuilder | JavaBuilder
  #validator: BedrockValidator | JavaValidator
  #moduleParser: ModuleParser

  constructor({
    platform,
    resourcePath,
    modulePath,
    buildOptions,
  }: {
    platform: 'je' | 'be'
    resourcePath?: string
    modulePath?: string
    buildOptions?: JEBuildOptions | BEBuildOptions
    modPath?: string
  }) {
    this.#moduleParser = new ModuleParser(modulePath || './modules')
    switch (platform) {
      case 'be':
        if (buildOptions && !['mcpack', 'zip'].includes(buildOptions.type)) {
          throw new Error('Platform does not match type.')
        }
        this.#builder = new BedrockBuilder({
          resourcePath,
          moduleOverview: undefined,
          options: buildOptions as BEBuildOptions | undefined,
        })
        this.#validator = new BedrockValidator(
          buildOptions as BEBuildOptions,
          this.#builder.config
        )
        break
      case 'je':
        if (
          buildOptions &&
          !['normal', 'compat', 'legacy'].includes(buildOptions.type)
        ) {
          throw new Error('Platform does not match type.')
        }
        this.#builder = new JavaBuilder({
          resourcePath,
          moduleOverview: undefined,
          options: buildOptions as JEBuildOptions | undefined,
        })
        this.#validator = new JavaValidator(
          buildOptions as JEBuildOptions,
          this.#builder.config
        )
        break
      default:
        throw new Error('Unknown platform.')
    }
    if (!this.#validator.validateOptions()) {
      throw new Error('Invalid options.')
    }
    this.#builder.options = this.#validator.normalizeOptions()
  }

  get options(): JEBuildOptions | BEBuildOptions {
    return this.#builder.options
  }

  set options(value: JEBuildOptions | BEBuildOptions) {
    this.#builder.options = value
  }

  async build({ clearLog }: { clearLog?: boolean } = {}): Promise<{
    filename: string
    buf: Buffer
  }> {
    if (clearLog) {
      Logger.clearLog()
    }
    this.#builder.moduleOverview = await this.#moduleParser.validateModules()
    const { filename, buf } = await this.#builder.build()
    if (this.options.outputDir) {
      await this.#writeToPath(filename, buf)
    }
    return { filename, buf }
  }

  async #writeToPath(filename: string, buf: Buffer): Promise<void> {
    const p = path.resolve('.', this.options.outputDir || '')
    await fse.ensureDir(p)
    await fse.writeFile(path.resolve(p, filename), buf)
  }
}
