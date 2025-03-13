import type {
  ResourceModuleManifest,
  CollectionModuleManifest,
  MemeModuleManifest,
} from './manifest/index.js'

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
 *
 * @param manifest - the manifest to be checked
 * @returns
 * @internal
 */
export function _isResource(manifest: MemeModuleManifest): manifest is ResourceModuleManifest {
  return manifest.type === 'resource'
}

/**
 *
 * @param manifest - the manifest to be checked
 * @returns
 * @internal
 */
export function _isCollection(manifest: MemeModuleManifest): manifest is CollectionModuleManifest {
  return manifest.type === 'collection'
}
