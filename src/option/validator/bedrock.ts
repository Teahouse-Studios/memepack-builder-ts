import _ from 'lodash'
import { Logger } from '../../log'
import { BedrockBuildOptions } from '../../types'

export class BedrockOptionValidator {
  options: BedrockBuildOptions

  constructor(options: BedrockBuildOptions) {
    this.options = options
  }

  validateOptions(): boolean {
    if (this.options.platform !== 'bedrock') return false
    return this.checkRequiredOptions()
  }

  checkRequiredOptions(): boolean {
    const requiredOptions = ['type', 'compatible', 'modules']
    const incomingOptions = Object.keys(this.options)
    const missingOptions = _.difference(requiredOptions, incomingOptions)
    if (missingOptions.length > 0) {
      Logger.appendLog(
        `Error: Missing required options: ${missingOptions.join(', ')}.`
      )
      return false
    }
    return true
  }
}
