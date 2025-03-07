import type { LanguageModificationDefinition } from '../lang/index.js'

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
export type MemeModule = ResourceModule | CollectionModule

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
export type MemeModuleManifest = ResourceModuleManifest | CollectionModuleManifest

/**
 *
 * @param manifest - the manifest to be checked
 * @returns
 * @internal
 */
export function isResource(manifest: MemeModuleManifest): manifest is ResourceModuleManifest {
  return manifest.type === 'resource'
}

/**
 *
 * @param manifest - the manifest to be checked
 * @returns
 * @internal
 */
export function isCollection(manifest: MemeModuleManifest): manifest is CollectionModuleManifest {
  return manifest.type === 'collection'
}
