import { Logger } from '../../log'
import { BedrockBuildOptions, BuilderConfig } from '../../types'
import { BaseValidator } from './base'

export class BedrockValidator extends BaseValidator {
  options: BedrockBuildOptions
  config: BuilderConfig

  constructor(options: BedrockBuildOptions, config: BuilderConfig) {
    super()
    this.options = options
    this.config = config
  }

  validateOptions(): boolean {
    const beRequiredOptions = ['type', 'compatible', 'modules', 'hash']
    for (const option of beRequiredOptions) {
      if (!(option in this.options)) {
        Logger.appendLog(`Warning: Missing required argument "${option}".`)
      }
    }
    return true
  }

  normalizeOptions(): BedrockBuildOptions {
    this.options.outputName = `${
      this.options.outputName || this.config.outputFileName
    }.${this.options.type}`
    return this.options
  }
}
