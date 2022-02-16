import path from 'path'
import { BuilderConfig, JEBuildOptions } from '../types'
import { BaseValidator } from './base'

export class JavaValidator extends BaseValidator {
  options: JEBuildOptions
  config: BuilderConfig
  #logs: string[] = []

  constructor(options: JEBuildOptions, config: BuilderConfig) {
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
    const jeRequiredOptions = ['type', 'modules', 'mod', 'sfw', 'format']
    for (const option of jeRequiredOptions) {
      if (!(option in this.options)) {
        this.#appendLog(`Warning: Missing required argument "${option}".`)
        return false
      }
    }
    // validate 'format' option
    if (!this.options.format) {
      this.options.format =
        this.options.type === 'legacy'
          ? this.config.legacyJEPackFormat
          : this.config.latestJEPackFormat
      this.#appendLog(
        `Warning: Did not specify "pack_format". Assuming value is "${this.options.format}".`
      )
    } else {
      if (
        (this.options.type === 'legacy' &&
          this.options.format !== this.config.legacyJEPackFormat) ||
        (['normal', 'compat'].includes(this.options.type) &&
          this.options.format <= this.config.legacyJEPackFormat)
      ) {
        this.#appendLog(
          `Error: Type "${this.options.type}" does not match pack_format ${this.options.format}.`
        )
        return false
      }
    }
    return true
  }

  normalizeOptions(): JEBuildOptions {
    const options = this.options
    if (options.mod) {
      options.mod = options.mod.map((value) => {
        return path.resolve(this.config.modPath ?? '', value)
      })
    }
    return options
  }
}
