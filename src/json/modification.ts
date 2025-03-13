import { readJSON } from 'fs-extra'
import type { ResourceModule } from '../module/index.js'
import { resolve, normalize } from 'node:path'
import type { JsonAdditionPatch, JsonDeletionPatch } from './patch.js'

/**
 * @public
 */
export type JsonFlatAdditionMap = Map<string, JsonAdditionPatch>

/**
 * @public
 */
export type JsonFlatDeletionMap = Map<string, JsonDeletionPatch>

/**
 * @public
 */
export interface JsonModification {
  addition: JsonFlatAdditionMap
  deletion: JsonFlatDeletionMap
}

/**
 * @public
 */
export async function generateJsonModification(
  selectedModules: ResourceModule[]
): Promise<JsonModification> {
  const modification: JsonModification = {
    addition: new Map(),
    deletion: new Map(),
  }
  for (const module of selectedModules) {
    await updateModification(module, modification)
  }
  return modification
}

/**
 * @public
 * @param module
 */
export async function updateModification(
  module: ResourceModule,
  modification: JsonModification
): Promise<void> {
  for (const definition of module.manifest.languageModification ?? []) {
    const normalizedTargetFile = normalize(definition.file)
    if (definition.add) {
      const addContent: Record<string, string> = await readJSON(
        resolve(module.path, definition.add)
      )
      await _updateAdditionEntry(modification.addition, normalizedTargetFile, addContent)
    }
    if (definition.remove) {
      const removeContent: string[] = await readJSON(resolve(module.path, definition.remove))
      await _updateDeletionEntry(modification.deletion, normalizedTargetFile, removeContent)
    }
  }
}

/**
 * @internal
 */
export async function _updateAdditionEntry(
  entry: JsonFlatAdditionMap,
  targetFile: string,
  content: Record<string, string>
): Promise<void> {
  const updateFile = entry.get(targetFile)
  if (!updateFile) {
    entry.set(targetFile, new Map(Object.entries(content)))
  } else {
    for (const [k, v] of Object.entries(content)) {
      updateFile.set(k, v)
    }
  }
}

/**
 * @internal
 */
export async function _updateDeletionEntry(
  entry: JsonFlatDeletionMap,
  targetFile: string,
  content: string[]
): Promise<void> {
  const updateFile = entry.get(targetFile)
  if (!updateFile) {
    entry.set(targetFile, new Set(content))
  } else {
    for (const k of content) {
      updateFile.add(k)
    }
  }
}
