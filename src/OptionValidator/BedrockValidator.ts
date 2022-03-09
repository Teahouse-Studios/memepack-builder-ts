import { Logger } from '../Logger'
import { BEBuildOptions, BuilderConfig } from '../types'
import { BaseValidator } from './base'

export class BedrockValidator extends BaseValidator {
  options: BEBuildOptions
  config: BuilderConfig
  #logs: string[] = []

  constructor(options: BEBuildOptions, config: BuilderConfig) {
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

  normalizeOptions(): BEBuildOptions {
    this.options.outputName = `${
      this.options.outputName || this.config.outputFileName
    }.${this.options.type}`
    return this.options
  }
}
