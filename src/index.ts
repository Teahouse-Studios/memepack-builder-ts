/**
 * @name memepack-builder
 * @description A resourcepack builder using ts
 *
 * @author MysticNebula70
 * @license Apache-2.0
 */

import { BedrockBuilder, JavaBuilder } from './builder'
import { ModuleChecker } from './moduleChecker'
import { JEBuildOptions, BEBuildOptions } from './types'

// name
export const name = 'memepack-builder'
export { BedrockBuilder, JavaBuilder } from './builder'
export { ModuleChecker } from './moduleChecker'
export * as utils from './utils'

export class MemepackBuilder {
  #builder: BedrockBuilder | JavaBuilder
  #moduleChecker: ModuleChecker
  log: string[]

  constructor(
    platform: 'je' | 'be',
    resourcePath?: string,
    modulePath?: string,
    buildOptions?: JEBuildOptions | BEBuildOptions,
    modPath?: string
  ) {
    this.log = []
    this.#moduleChecker = new ModuleChecker(modulePath || './modules')
    this.log.push(...this.#moduleChecker.log)
    switch (platform) {
      case 'be':
        if (buildOptions && !['mcpack', 'zip'].includes(buildOptions.type)) {
          throw 'Platform does not match type.'
        }
        this.#builder = new BedrockBuilder(
          resourcePath,
          undefined,
          buildOptions as BEBuildOptions | undefined
        )
        break
      case 'je':
        if (
          buildOptions &&
          !['normal', 'compat', 'legacy'].includes(buildOptions.type)
        ) {
          throw 'Platform does not match type.'
        }
        this.#builder = new JavaBuilder(
          resourcePath,
          undefined,
          modPath,
          buildOptions as JEBuildOptions | undefined
        )
        break
      default:
        throw 'Unknown platform.'
    }
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
    this.#builder.moduleOverview = await this.#moduleChecker.validateModules()
    const r = this.#builder.build()
    this.log.push(...this.#builder.log)
    return r
  }
}
