export type ModuleType = 'resource' | 'collection'

interface ModuleBase {
  name: string
  description: string
  type: ModuleType
  author: string[]
  contains?: string[]
  incompatibleWith?: string[]
}

export interface LanguageModificationFile {
  file: string
  add?: string | Record<string, string>
  remove?: string | string[]
}

export interface ModuleManifest extends ModuleBase {
  languageModification?: LanguageModificationFile[]
}

export interface LanguageModification {
  file: string
  add: Record<string, string>
  remove: string[]
}

export interface ModuleInfo extends ModuleBase {
  dirName: string
  languageModification?: LanguageModification[]
}

export interface ModuleOverview {
  modulePath: string
  modules: ModuleInfo[]
}
