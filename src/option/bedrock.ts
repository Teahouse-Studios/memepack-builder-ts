import type { BaseBuildOptions } from './index.js'

/**
 * @public
 */
export interface BedrockBuildOptions extends BaseBuildOptions {
  platform: 'bedrock'
  type: 'normal'
}

/**
 * @public
 */
export class BedrockOptionValidator {
  #options: BedrockBuildOptions

  constructor(options: BedrockBuildOptions) {
    this.#options = options
  }

  validateOptions(): boolean {
    if (this.#options.platform !== 'bedrock') return false
    return this.#checkRequiredOptions()
  }

  #checkRequiredOptions(): boolean {
    const requiredOptions = new Set(['type', 'compatible', 'modules'])
    const currentOptions = new Set(Object.keys(this.#options))
    return requiredOptions.isSubsetOf(currentOptions)
  }
}
