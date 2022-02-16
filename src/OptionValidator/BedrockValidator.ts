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

  get log(): string[] {
    return this.#logs
  }

  #appendLog(entry: string | string[]): void {
    if (Array.isArray(entry)) {
      this.#logs = this.#logs.concat(entry)
    } else {
      this.#logs.push(entry)
    }
  }

  validateOptions(): boolean {
    const beRequiredOptions = ['type', 'compatible', 'modules', 'hash']
    for (const option of beRequiredOptions) {
      if (!(option in this.options)) {
        this.#appendLog(`Warning: Missing required argument "${option}".`)
      }
    }
    return true
  }

  normalizeOptions(): BEBuildOptions {
    this.options.outputName = `${
      this.options.outputName || this.config.defaultFileName
    }.${this.options.type}`
    return this.options
  }
}
