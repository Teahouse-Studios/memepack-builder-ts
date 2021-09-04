/**
 * @name memepack-builder
 * @description A resourcepack builder using ts
 *
 * @author MysticNebula70
 * @license Apache-2.0
 */

import { BedrockBuilder, JavaBuilder } from './builder'
import { ModuleChecker } from './moduleChecker'
import { BuildOptions } from './types'

// name
export const name = 'memepack-builder'
export { BedrockBuilder, JavaBuilder } from './builder'
export { ModuleChecker } from './moduleChecker'
export * as utils from './utils'

export class MemepackBuilder {
  builder: BedrockBuilder | JavaBuilder
  moduleChecker: ModuleChecker
  log: string[]

  constructor(
    platform: 'je' | 'be',
    resourcePath: string,
    modulePath: string,
    buildOptions?: BuildOptions,
    modPath?: string
  ) {
    this.log = []
    this.moduleChecker = new ModuleChecker(modulePath)
    const overview = this.moduleChecker.validateModules()
    this.log.push(...this.moduleChecker.log)
    switch (platform) {
      case 'be':
        if (buildOptions && !['mcpack', 'zip'].includes(buildOptions.type)) {
          throw 'Platform does not match type.'
        }
        this.builder = new BedrockBuilder(
          resourcePath,
          overview,
          buildOptions as
            | (BuildOptions & {
                type: 'mcpack' | 'zip'
              })
            | undefined
        )
        break
      case 'je':
        if (
          buildOptions &&
          !['normal', 'compat', 'legacy'].includes(buildOptions.type)
        ) {
          throw 'Platform does not match type.'
        }
        modPath = modPath || ''
        this.builder = new JavaBuilder(
          resourcePath,
          overview,
          modPath,
          buildOptions as
            | (BuildOptions & {
                type: 'normal' | 'compat' | 'legacy'
              })
            | undefined
        )
        break
      default:
        throw 'Unknown platform.'
    }
  }

  async build(clearLog = true): Promise<{name: string} | undefined> {
    if (clearLog) {
      this.log = []
    }
    const r = this.builder.build()
    this.log.push(...this.builder.log)
    return r
  }
}
