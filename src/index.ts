/**
 * @name memepack-builder
 * @description A resourcepack builder using ts
 *
 * @author MysticNebula70
 * @license Apache-2.0
 */

export {
  type ArchiveContentEntry,
  type ArchiveEntry,
  type ArchiveFileEntry,
  type ArchiveJsonContentEntry,
  type ArchiveJsonEntry,
  type ArchiveJsonFileEntry,
  type ArchiveLangFileEntry,
  type ArchiveMap,
  type ArchivePatchableEntry,
  generateArchiveEntries,
} from './archive/index.js'
export * from './builder/bedrock.js'
export * from './builder/java.js'
export { PackBuilder } from './builder/index.js'
export { PureJson } from './json/index.js'
export * from './json/patch.js'
export {
  type JsonFlatDeletionMap,
  type JsonFlatAdditionMap,
  type JsonModification,
  generateJsonModification,
} from './json/modification.js'
export * from './lang/converter.js'
export * from './lang/index.js'
export type { ResourceModule, CollectionModule, MemeModule } from './module/index.js'
export type {
  ResourceModuleManifest,
  CollectionModuleManifest,
  MemeModuleManifest,
  BaseModuleManifest,
} from './module/manifest/index.js'
export { ModuleParser, MODULE_MANIFEST_FILENAME } from './module/parser.js'
export * from './option/bedrock.js'
export * from './option/index.js'
export * from './option/java.js'
