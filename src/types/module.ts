/**
 * @public
 */
export interface ResourceModule {
  path: string
  manifest: ResourceModuleManifest
  files: string[]
}

/**
 * @public
 */
export interface CollectionModule {
  path: string
  manifest: CollectionModuleManifest
}

/**
 * @public
 */
export type Module = ResourceModule | CollectionModule

/**
 * @public
 */
export interface BaseModuleManifest {
  name: string
  description: string
  author: string[]
  incompatibleWith?: string[]
}

/**
 * @public
 */
export interface ResourceModuleManifest extends BaseModuleManifest {
  type: 'resource'
  languageModification?: LanguageModificationDefinition[]
}

/**
 * @public
 */
export interface CollectionModuleManifest extends BaseModuleManifest {
  type: 'collection'
  contains?: string[]
}

/**
 * @public
 */
export type ModuleManifest = ResourceModuleManifest | CollectionModuleManifest

/**
 * @public
 */
export interface LanguageModificationDefinition {
  file: string
  add?: string
  remove?: string
}
