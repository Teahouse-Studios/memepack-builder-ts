export interface BaseBuildOptions {
  outputDir?: string
  outputName?: string
  modules: {
    resource: string[]
    collection: string[]
  }
  mod?: string[]
  format?: number
  sfw?: boolean
  compatible?: boolean
  hash?: boolean
}

export type JavaBuildOptions = BaseBuildOptions & {
  type: 'normal' | 'compat' | 'legacy'
}
export type BedrockBuildOptions = BaseBuildOptions & { type: 'mcpack' | 'zip' }
