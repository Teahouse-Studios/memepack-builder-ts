import { resolve } from 'node:path'
import { generateJsonModification } from '../json/modification.js'
import type { ResourceModule } from '../module/index.js'
import type { JsonContentPatch, JsonAdditionPatch, JsonDeletionPatch } from '../json/patch.js'

/**
 * @public
 */
export interface ArchiveFileEntry {
  filePath: string
}

/**
 * @public
 */
export interface ArchiveJsonFileEntry extends ArchiveFileEntry {
  patch?: JsonContentPatch
}

/**
 * @public
 */
export interface ArchiveLangFileEntry extends ArchiveFileEntry {
  patch?: JsonContentPatch
}

/**
 * @public
 */
export interface ArchiveContentEntry {
  content: Record<string, any>
}

/**
 * @public
 */
export interface ArchiveJsonContentEntry extends ArchiveContentEntry {
  patch?: JsonContentPatch
}

/**
 * @public
 */
export type ArchiveEntry = ArchiveFileEntry | ArchiveContentEntry

/**
 * @public
 */
export type ArchiveJsonEntry = ArchiveJsonContentEntry | ArchiveJsonFileEntry

/**
 * @public
 */
export type ArchivePatchableEntry =
  | ArchiveJsonContentEntry
  | ArchiveLangFileEntry
  | ArchiveJsonFileEntry

/**
 * @public
 */
export type ArchiveMap = Map<string, ArchiveEntry>

/**
 *
 * @param selectedModules - modules to be processed.
 * @returns
 * @public
 */
export async function generateArchiveEntries(
  selectedModules: ResourceModule[]
): Promise<ArchiveMap> {
  const result: ArchiveMap = new Map()
  const modification = await generateJsonModification(selectedModules)
  selectedModules.forEach((module) => {
    module.files.forEach((file) => {
      result.set(file, {
        filePath: resolve(module.path, file),
      })
    })
  })
  for (const [key, entry] of result) {
    if (_isPatchableEntry(entry)) {
      if (modification.addition.has(key)) {
        if (!entry.patch) entry.patch = {}
        _mergeJsonAdditionPatch(entry.patch, modification.addition.get(key)!)
      }
      if (modification.deletion.has(key)) {
        if (!entry.patch) entry.patch = {}
        _mergeJsonDeletionPatch(entry.patch, modification.deletion.get(key)!)
      }
    } else {
      if (modification.addition.has(key) || modification.deletion.has(key))
        throw new Error('Cannot patch non-json file')
    }
  }

  return result
}

/**
 * @internal
 */
export function _isJsonContentEntry(entry: ArchiveEntry): entry is ArchiveJsonContentEntry {
  return Object.hasOwn(entry, 'content')
}

/**
 * @internal
 */
export function _isFileEntry(entry: ArchiveEntry): entry is ArchiveFileEntry {
  return Object.hasOwn(entry, 'filePath')
}

/**
 * @internal
 */
export function _isJsonFileEntry(entry: ArchiveEntry): entry is ArchiveJsonFileEntry {
  return (
    _isFileEntry(entry) && (entry.filePath.endsWith('.json') || entry.filePath.endsWith('.mcmeta'))
  )
}

/**
 * @internal
 */
export function _isLangFileEntry(entry: ArchiveEntry): entry is ArchiveLangFileEntry {
  return _isFileEntry(entry) && entry.filePath.endsWith('.lang')
}

/**
 * @internal
 */
export function _isPatchableEntry(entry: ArchiveEntry): entry is ArchivePatchableEntry {
  return _isJsonContentEntry(entry) || _isJsonFileEntry(entry) || _isLangFileEntry(entry)
}

/**
 * @internal
 */
export function _isJsonEntry(entry: ArchiveEntry): entry is ArchiveJsonEntry {
  return _isJsonContentEntry(entry) || _isJsonFileEntry(entry)
}

/**
 * @internal
 */
export function _mergeJsonAdditionPatch(target: JsonContentPatch, source: JsonAdditionPatch): void {
  if (!target.flatKey) {
    target.flatKey = {}
  }
  if (!target.flatKey.addition) {
    target.flatKey.addition = new Map(source)
  } else {
    for (const [key, value] of source) {
      target.flatKey.addition.set(key, value)
    }
  }
}

/**
 * @internal
 */
export function _mergeJsonDeletionPatch(target: JsonContentPatch, source: JsonDeletionPatch): void {
  if (!target.flatKey) {
    target.flatKey = {}
  }
  if (!target.flatKey.deletion) {
    target.flatKey.deletion = new Set(source)
  } else {
    for (const key of source) {
      target.flatKey.deletion.add(key)
    }
  }
}
