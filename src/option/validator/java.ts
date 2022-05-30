import _ from 'lodash'
import { CURRENT_FORMAT_VERSION, LEGACY_FORMAT_VERSION } from '../../constants'
import { Logger } from '../../log'
import { JavaBuildOptions } from '../../types'

export class JavaOptionValidator {
  options: JavaBuildOptions

  constructor(options: JavaBuildOptions) {
    this.options = options
  }

  validateOptions(): boolean {
    if (this.options.platform !== 'java') return false
    if (!this.checkRequiredOptions()) return false
    if (!this.options.format) this.setDefaultFormatVersion()
    return this.checkFormatVersion()
  }

  checkRequiredOptions(): boolean {
    const requiredOptions = ['type', 'modules', 'mod', 'format']
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
    this.options.format =
      this.options.type === 'legacy'
        ? LEGACY_FORMAT_VERSION
        : CURRENT_FORMAT_VERSION
    Logger.appendLog(
      `Warning: Did not specify "pack_format". Assuming value is "${this.options.format}".`
    )
  }

  checkFormatVersion(): boolean {
    const legacyTest =
      this.options.type === 'legacy' &&
      this.options.format === LEGACY_FORMAT_VERSION
    const normalTest =
      this.options.type === 'normal' &&
      this.options.compatible === false &&
      this.options.format > LEGACY_FORMAT_VERSION
    const compatTest =
      this.options.type === 'normal' &&
      this.options.compatible === true &&
      this.options.format > LEGACY_FORMAT_VERSION
    if (!legacyTest && !normalTest && !compatTest) {
      Logger.appendLog(
        `Error: Build type "${this.options.type}" does not match pack_format ${this.options.format}.`
      )
      return false
    }
    return true
  }
}
