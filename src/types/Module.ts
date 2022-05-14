import { LanguageModificationDefinition } from './LanguageModification'

export type ModuleType = 'resource' | 'collection'

interface ModuleBase {
  name: string
  description: string
  type: ModuleType
  author: string[]
  contains?: string[]
  incompatibleWith?: string[]
}

export interface ModuleManifest extends ModuleBase {
  languageModification?: LanguageModificationDefinition[]
}

export interface ModuleManifestWithDirectory extends ModuleManifest {
  directory: string
}

export interface ModuleOverview {
  modulePath: string
  modules: ModuleManifestWithDirectory[]
}
