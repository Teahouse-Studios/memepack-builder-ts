/**
 * @name memepack-builder
 * @description A resourcepack builder using ts
 *
 * @author MysticNebula70
 * @license Apache-2.0
 */

import fse from 'fs-extra'
import path from 'path'
import { BedrockBuilder, JavaBuilder } from './PackBuilder'
import { ModuleParser } from './ModuleParser'
import { JEBuildOptions, BEBuildOptions } from './types'
import { BedrockValidator, JavaValidator } from './OptionValidator'

// name
export const name = 'memepack-builder'
export { BedrockBuilder, JavaBuilder } from './PackBuilder'
export { ModuleParser } from './ModuleParser'

export class MemepackBuilder {
  #builder: BedrockBuilder | JavaBuilder
  #validator: BedrockValidator | JavaValidator
  #moduleParser: ModuleParser
  log: string[]

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
    this.log = []
    this.#moduleParser = new ModuleParser(modulePath || './modules')
    this.log.push(...this.#moduleParser.log)
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
      this.log.concat(this.#validator.log)
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

  async build(clearLog = true): Promise<{ name: string; buf: Buffer }> {
    if (clearLog) {
      this.log = []
    }
    this.#builder.moduleOverview = await this.#moduleParser.validateModules()
    const { name, buf } = await this.#builder.build()
    this.log.push(...this.#builder.log)
    if (this.options.outputDir) {
      await this.#writeToPath(name, buf)
    }
    return { name, buf }
  }

  async #writeToPath(name: string, buf: Buffer): Promise<void> {
    const p = path.resolve('.', this.options.outputDir || '')
    await fse.ensureDir(p)
    await fse.writeFile(path.resolve(p, name), buf)
  }
}
