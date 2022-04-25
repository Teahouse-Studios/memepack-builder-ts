import _ from 'lodash'
import { Logger } from '../../log'
import { BedrockBuildOptions } from '../../types'

export class BedrockValidator {
  options: BedrockBuildOptions

  constructor(options: BedrockBuildOptions) {
    this.options = options
  }

  validateOptions(): boolean {
    return this.checkRequiredOptions()
  }

  checkRequiredOptions(): boolean {
    const requiredOptions = ['type', 'compatible', 'modules', 'hash']
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
