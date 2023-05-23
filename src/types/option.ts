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
export interface JavaBuildOptions extends BaseBuildOptions {
  platform: 'java'
  type: 'normal' | 'legacy'
  format: number
  mod: string[]
}

/**
 * @public
 */
export interface BedrockBuildOptions extends BaseBuildOptions {
  platform: 'bedrock'
  type: 'normal'
}

/**
 * @public
 */
export interface TransformOptions {
  compatible: boolean
  format: number
}
