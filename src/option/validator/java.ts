import _ from 'lodash'
import { Logger } from '../../log'
import { JavaBuildOptions } from '../../types'

export class JavaOptionValidator {
  options: JavaBuildOptions

  constructor(options: JavaBuildOptions) {
    this.options = options
  }

  validateOptions(): boolean {
    if (!this.checkRequiredOptions()) {
      return false
    }
    if (!this.options.format) {
      this.setDefaultFormatVersion()
    }
    return this.checkFormatVersion()
  }

  checkRequiredOptions(): boolean {
    const requiredOptions = ['type', 'modules', 'mod', 'sfw', 'format']
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

  setDefaultFormatVersion(): void {
    if (!this.options.format) {
      this.options.format = this.options.type === 'legacy' ? 3 : 8
      Logger.appendLog(
        `Warning: Did not specify "pack_format". Assuming value is "${this.options.format}".`
      )
    }
  }

  checkFormatVersion(): boolean {
    const legacyTest =
      this.options.type === 'legacy' && this.options.format === 3
    const normalTest =
      this.options.type === 'normal' &&
      this.options.format &&
      this.options.format > 3
    const compatTest =
      this.options.type === 'compat' &&
      this.options.format &&
      this.options.format > 3
    if (!legacyTest && !normalTest && !compatTest) {
      Logger.appendLog(
        `Error: Type "${this.options.type}" does not match pack_format ${this.options.format}.`
      )
      return false
    }
    return true
  }
}
