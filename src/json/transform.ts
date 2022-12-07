import fs from 'fs-extra'
import { JsonFlatAdditionEntry, JsonFlatDeletionEntry, ResourceModule } from '../types'
import { resolve } from 'path'

export class JsonModification {
  #addition: JsonFlatAdditionEntry
  #deletion: JsonFlatDeletionEntry
  #selectedModules: ResourceModule[]

  constructor(selectedModules: ResourceModule[]) {
    this.#addition = new Map()
    this.#deletion = new Map()
    this.#selectedModules = selectedModules
  }

  async extract(): Promise<{
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
      if (definition.add) {
        const addContent: Record<string, string> = await fs.readJSON(
          resolve(module.path, definition.add)
        )
        const updateFile = this.#addition.get(definition.file)
        if (!updateFile) {
          this.#addition.set(definition.file, new Map(Object.entries(addContent)))
        } else {
          for (const [k, v] of Object.entries(addContent)) {
            updateFile.set(k, v)
          }
        }
      }
      if (definition.remove) {
        const removeContent: string[] = await fs.readJSON(resolve(module.path, definition.remove))
        const updateFile = this.#deletion.get(definition.file)
        if (!updateFile) {
          this.#deletion.set(definition.file, new Set(removeContent))
        } else {
          for (const k of removeContent) {
            updateFile.add(k)
          }
        }
      }
    }
  }
}
