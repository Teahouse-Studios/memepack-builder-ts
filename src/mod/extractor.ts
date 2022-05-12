import fse from 'fs-extra'
import path from 'path'
import { LanguageMap, RawLanguage, SingleLanguage } from '~/types'
import { javaLangToJSON } from '~/utils'

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

  async extractMods(): Promise<LanguageMap> {
    const mods: LanguageMap = new Map()
    for (const modFile of this.modFiles) {
      const mod = await this.getOneMod(path.resolve(this.modDirectory, modFile))
      mods.set(modFile, mod)
    }
    return mods
  }

  async getOneMod(path: string): Promise<SingleLanguage> {
    if (path.endsWith('.json')) {
      return new Map(Object.entries((await fse.readJSON(path)) as RawLanguage))
    } else if (path.endsWith('.lang')) {
      return new Map(
        Object.entries(javaLangToJSON((await fse.readFile(path)).toString()))
      )
    } else {
      throw new Error(`Unknown file type: ${path}`)
    }
  }
}
