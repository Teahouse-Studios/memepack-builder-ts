import _ from 'lodash'
import type { BedrockBuildOptions } from '../types'
import { BaseOptionValidator } from './base'

/**
 * @public
 */
export class BedrockOptionValidator extends BaseOptionValidator {
  #options: BedrockBuildOptions

  constructor(options: BedrockBuildOptions) {
    super()
    this.#options = options
  }

  validateOptions(): boolean {
    if (this.#options.platform !== 'bedrock') return false
    return this.#checkRequiredOptions()
  }

  #checkRequiredOptions(): boolean {
    const requiredOptions = ['type', 'compatible', 'modules']
    const missingOptions = _.difference(requiredOptions, Object.keys(this.#options))
    return missingOptions.length === 0
  }
}
