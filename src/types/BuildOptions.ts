export interface BaseBuildOptions {
  outputDir: string
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

export type JEBuildOptions = BaseBuildOptions & {
  type: 'normal' | 'compat' | 'legacy'
}
export type BEBuildOptions = BaseBuildOptions & { type: 'mcpack' | 'zip' }
