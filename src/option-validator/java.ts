import _ from 'lodash'
import { JAVA_LEGACY_FORMAT_VERSION } from '../constants'
import { JavaBuildOptions } from '../types'
import { BaseOptionValidator } from './base'

export class JavaOptionValidator extends BaseOptionValidator {
  #options: JavaBuildOptions

  constructor(options: JavaBuildOptions) {
    super()
    this.#options = options
  }

  validateOptions(): boolean {
    if (this.#options.platform !== 'java') return false
    if (!this.#checkRequiredOptions()) return false
    return this.#checkFormatVersion()
  }

  #checkRequiredOptions(): boolean {
    const requiredOptions = ['type', 'modules', 'mod', 'format']
    const missingOptions = _.difference(requiredOptions, Object.keys(this.#options))
    return missingOptions.length === 0
  }

  #checkFormatVersion(): boolean {
    const legacyWellFormed =
      this.#options.type === 'legacy' && this.#options.format === JAVA_LEGACY_FORMAT_VERSION
    const normalWellFormed =
      this.#options.type === 'normal' &&
      this.#options.compatible === false &&
      this.#options.format > JAVA_LEGACY_FORMAT_VERSION
    const compatibleWellFormed =
      this.#options.type === 'normal' &&
      this.#options.compatible === true &&
      this.#options.format > JAVA_LEGACY_FORMAT_VERSION
    return normalWellFormed || compatibleWellFormed || legacyWellFormed
  }
}
