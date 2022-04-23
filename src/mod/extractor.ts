import fse from 'fs-extra'
import path from 'path'
import { javaLangToJSON } from '../utils'

export class ModExtractor {
  modDirectory: string
  modFiles: string[]

  constructor({
    modDirectory,
    modFiles,
  }: {
    modDirectory: string
    modFiles: string[]
  }) {
    this.modDirectory = modDirectory
    this.modFiles = modFiles
  }

  async extractMods(): Promise<Map<string, Map<string, string>>> {
    const mods: Map<string, Map<string, string>> = new Map()
    for (const modFile of this.modFiles) {
      const mod = await this.getOneMod(path.resolve(this.modDirectory, modFile))
      mods.set(modFile, mod)
    }
    return mods
  }

  async getOneMod(path: string): Promise<Map<string, string>> {
    if (path.endsWith('.json')) {
      return new Map(
        Object.entries((await fse.readJSON(path)) as Record<string, string>)
      )
    } else if (path.endsWith('.lang')) {
      return new Map(
        Object.entries(javaLangToJSON((await fse.readFile(path)).toString()))
      )
    } else {
      throw new Error(`Unknown file type: ${path}`)
    }
  }
}
