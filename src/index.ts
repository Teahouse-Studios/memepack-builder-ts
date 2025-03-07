/**
 * @name memepack-builder
 * @description A resourcepack builder using ts
 *
 * @author MysticNebula70
 * @license Apache-2.0
 */

export * from './archive/index.js'
export * from './builder/bedrock.js'
export * from './builder/java.js'
export { PackBuilder } from './builder/index.js'
export { PureJson } from './json/index.js'
export type {
  JsonContentPatch,
  JsonFlatKeyPatch,
  JsonNestedKeyPatch,
  AdditionPatch,
  DeletionPatch,
} from './json/patch.js'
export type { JsonFlatDeletionEntry, JsonFlatAdditionEntry } from './json/modification.js'
export * from './lang/converter.js'
export type { LanguageModificationDefinition } from './lang/index.js'
export type {
  ResourceModule,
  ResourceModuleManifest,
  CollectionModule,
  CollectionModuleManifest,
  MemeModule,
  MemeModuleManifest,
  BaseModuleManifest,
} from './module/index.js'
export { ModuleParser, MODULE_MANIFEST_FILENAME } from './module/parser.js'
export * from './option/bedrock.js'
export * from './option/index.js'
export * from './option/java.js'
