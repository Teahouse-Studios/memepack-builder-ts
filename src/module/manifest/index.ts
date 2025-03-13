import type { JsonPatchDefinition } from '../../json/patch.js'

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
  languageModification?: JsonPatchDefinition[]
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
