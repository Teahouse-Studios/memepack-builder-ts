/**
 * @public
 */
export interface BaseBuildOptions {
  modules: {
    resource: string[]
    collection: string[]
  }
  compatible: boolean
}

/**
 * @public
 */
export interface TransformOptions {
  compatible: boolean
  format: number
}
