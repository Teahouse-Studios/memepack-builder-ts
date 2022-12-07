export interface ResourceModule {
  path: string
  manifest: ResourceModuleManifest
  files: ResourceFileInfo[]
}

export type ResourceFileInfo = { path: string; isLanguage: boolean }

export interface CollectionModule {
  path: string
  manifest: CollectionModuleManifest
}

export type Module = ResourceModule | CollectionModule

export interface BaseModuleManifest {
  name: string
  description: string
  author: string[]
  incompatibleWith?: string[]
}

export interface ResourceModuleManifest extends BaseModuleManifest {
  type: 'resource'
  languageModification?: LanguageModificationDefinition[]
}

export interface CollectionModuleManifest extends BaseModuleManifest {
  type: 'collection'
  contains?: string[]
}

export type ModuleManifest = ResourceModuleManifest | CollectionModuleManifest

export interface LanguageModificationDefinition {
  file: string
  add?: string
  remove?: string
}
