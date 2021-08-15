import { SelectedModules } from './SelectedModules'

export interface BuildOptions {
  type: 'normal' | 'compat' | 'legacy' | 'mcpack' | 'zip'
  outputDir: string
  outputName?: string
  modules: SelectedModules
  mod?: string[]
  format?: number
  sfw?: boolean
  compatible?: boolean
  hash?: boolean
}
