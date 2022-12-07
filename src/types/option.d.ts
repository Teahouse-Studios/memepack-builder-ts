export interface BaseBuildOptions {
  modules: {
    resource: string[]
    collection: string[]
  }
  compatible: boolean
  hash: boolean
}

export interface JavaBuildOptions extends BaseBuildOptions {
  platform: 'java'
  type: 'normal' | 'legacy'
  format: number
  mod: string[]
}
export interface BedrockBuildOptions extends BaseBuildOptions {
  platform: 'bedrock'
  type: 'normal'
}

export interface TransformOptions {
  compatible: boolean
  format: number
}
