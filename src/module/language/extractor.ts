import fse from 'fs-extra'
import path from 'path'
import {
  LanguageMap,
  LanguageModificationDefinition,
  LanguageSet,
  ModuleManifestWithDirectory,
  RawLanguage,
} from '../../types'

export class LanguageExtractor {
  addMap: LanguageMap = new Map()
  removeSet: LanguageSet = new Map()
  modulePath: string
  selectedModules: ModuleManifestWithDirectory[]

  constructor({
    modulePath,
    selectedModules,
  }: {
    modulePath: string
    selectedModules: ModuleManifestWithDirectory[]
  }) {
    this.modulePath = modulePath
    this.selectedModules = selectedModules
  }

  async extractModification(): Promise<{
    add: LanguageMap
    remove: LanguageSet
  }> {
    for (const module of this.selectedModules) {
      await this.getModuleModification(module)
    }
    return { add: this.addMap, remove: this.removeSet }
  }

  async getModuleModification(
    manifest: ModuleManifestWithDirectory
  ): Promise<void> {
    const modificationDefinitions = manifest.languageModification ?? []
    for (const definition of modificationDefinitions) {
      await this.getSimpleModification(manifest.directory, definition)
    }
  }

  async getSimpleModification(
    moduleDirectory: string,
    definition: LanguageModificationDefinition
  ): Promise<void> {
    const { file, add, remove } = definition
    if (add) {
      await this.handleAdd({
        file,
        path: path.resolve(this.modulePath, moduleDirectory, add),
      })
    }
    if (remove) {
      await this.handleRemove({
        file,
        path: path.resolve(this.modulePath, moduleDirectory, remove),
      })
    }
  }

  async handleAdd({
    file,
    path,
  }: {
    file: string
    path: string
  }): Promise<void> {
    const addContent = new Map(
      Object.entries((await fse.readJSON(path)) as RawLanguage)
    )
    const addEntry = this.addMap.get(file)
    if (!addEntry) {
      this.addMap.set(file, addContent)
    } else {
      for (const [key, value] of addContent) {
        addEntry.set(key, value)
      }
    }
  }

  async handleRemove({
    file,
    path,
  }: {
    file: string
    path: string
  }): Promise<void> {
    const removeContent = new Set((await fse.readJSON(path)) as string[])
    const removeEntry = this.removeSet.get(file)
    if (!removeEntry) {
      this.removeSet.set(file, removeContent)
    } else {
      for (const item of removeContent) {
        removeEntry.add(item)
      }
    }
  }
}
