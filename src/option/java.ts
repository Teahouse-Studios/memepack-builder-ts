import type { BaseBuildOptions } from './index.js'

/**
 * @public
 */
export const JAVA_LEGACY_FORMAT_VERSION = 3

/**
 * @public
 */
export interface JavaBuildOptions extends BaseBuildOptions {
  platform: 'java'
  type: 'normal' | 'legacy'
  format: number
  mod: string[]
}

/**
 * @public
 */
export class JavaOptionValidator {
  #options: JavaBuildOptions

  constructor(options: JavaBuildOptions) {
    this.#options = options
  }

  validateOptions(): boolean {
    if (this.#options.platform !== 'java') return false
    if (!this.#checkRequiredOptions()) return false
    return this.#checkFormatVersion()
  }

  #checkRequiredOptions(): boolean {
    const requiredOptions = new Set(['type', 'modules', 'mod', 'format'])
    const currentOptions = new Set(Object.keys(this.#options))
    return requiredOptions.isSubsetOf(currentOptions)
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
