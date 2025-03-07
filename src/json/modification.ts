import { readJSON } from 'fs-extra'
import type { ResourceModule } from '../module/index.js'
import { resolve, normalize } from 'node:path'
import type { AdditionPatch, DeletionPatch } from './patch.js'

/**
 * @public
 */
export type JsonFlatAdditionEntry = Map<string, AdditionPatch>

/**
 * @public
 */
export type JsonFlatDeletionEntry = Map<string, DeletionPatch>

/**
 * @public
 */
export class JsonModification {
  #addition: JsonFlatAdditionEntry
  #deletion: JsonFlatDeletionEntry
  #selectedModules: ResourceModule[]

  constructor(selectedModules: ResourceModule[]) {
    this.#addition = new Map()
    this.#deletion = new Map()
    this.#selectedModules = selectedModules
  }

  async getModification(): Promise<{
    addition: JsonFlatAdditionEntry
    deletion: JsonFlatDeletionEntry
  }> {
    for (const module of this.#selectedModules) {
      await this.#updateModification(module)
    }
    return { addition: this.#addition, deletion: this.#deletion }
  }

  async #updateModification(module: ResourceModule): Promise<void> {
    for (const definition of module.manifest.languageModification ?? []) {
      const normalizedTargetFile = normalize(definition.file)
      if (definition.add) {
        const addContent: Record<string, string> = await readJSON(
          resolve(module.path, definition.add)
        )
        const updateFile = this.#addition.get(normalizedTargetFile)
        if (!updateFile) {
          this.#addition.set(normalizedTargetFile, new Map(Object.entries(addContent)))
        } else {
          for (const [k, v] of Object.entries(addContent)) {
            updateFile.set(k, v)
          }
        }
      }
      if (definition.remove) {
        const removeContent: string[] = await readJSON(resolve(module.path, definition.remove))
        const updateFile = this.#deletion.get(normalizedTargetFile)
        if (!updateFile) {
          this.#deletion.set(normalizedTargetFile, new Set(removeContent))
        } else {
          for (const k of removeContent) {
            updateFile.add(k)
          }
        }
      }
    }
  }
}
