import fse, { existsSync } from 'fs-extra'
import path from 'path'
import {
  LanguageModificationFile,
  ModuleInfo,
  ModuleManifest,
  ModuleOverview,
} from '../types'

export class ModuleParser {
  modulePath: string
  moduleInfo: () => Promise<ModuleOverview>

  constructor(modulePath: string) {
    this.modulePath = path.resolve(modulePath)
    this.moduleInfo = this.validateModules
  }

  async validateModules(): Promise<ModuleOverview> {
    const overview: ModuleOverview = {
      modulePath: this.modulePath,
      modules: [],
    }
    for (const { name } of (
      await fse.readdir(this.modulePath, { withFileTypes: true })
    ).filter((value) => value.isDirectory())) {
      const data: ModuleManifest = await fse.readJSON(
        path.resolve(this.modulePath, name, 'module_manifest.json'),
        { encoding: 'utf8' }
      )
      const info = await this.getModuleInfo(name, data)
      overview.modules.push(info)
    }
    return overview
  }

  async getModuleInfo(
    dirName: string,
    data: ModuleManifest
  ): Promise<ModuleInfo> {
    const languageModification = data.languageModification
    delete data.languageModification
    const info = {
      ...data,
      dirName,
    } as ModuleInfo
    if (languageModification) {
      info.languageModification = []
      for (const item of languageModification) {
        const add: Record<string, string> =
          (await this.getLanguageModification(item, 'add', dirName)) || {}
        const remove: string[] =
          (await this.getLanguageModification(item, 'remove', dirName)) || []
        info.languageModification.push({
          file: typeof item === 'string' ? item : item.file,
          add,
          remove,
        })
      }
    }
    return info
  }

  async getLanguageModification(
    item: LanguageModificationFile | string,
    key: 'add' | 'remove',
    directory: string
  ): Promise<any> {
    let content
    if (typeof item === 'string') {
      content = await this.#readDefaultContent(
        path.resolve(this.modulePath, directory, `${item}.${key}.json`)
      )
    } else {
      const e = item[key]
      // console.trace(item, key)
      switch (typeof e) {
        // if it's a string, assuming file path
        case 'string':
          if (e !== '') {
            try {
              content = await fse.readJSON(
                path.resolve(this.modulePath, directory, e),
                { encoding: 'utf8' }
              )
            } catch (e) {
              // console.error(e)
              content = {}
            }
          }
          break
        // if it's an object, use it directly
        case 'object':
          content = e
          break
        // not present, check default path `${item.file}.${key}.json`
        case 'undefined':
          {
            const filePath = path.resolve(this.modulePath, directory, `${item.file}.${key}.json`)
            if (existsSync(filePath)) {
              content = await this.#readDefaultContent(filePath)
            }
            break
          }
        default:
          break
      }
    }
    console.trace(Object.keys(content).length, item, key,directory)
    return content
  }

  async #readDefaultContent(filePath: string): Promise<any> {
    try {
      return await fse.readJSON(filePath, { encoding: 'utf8' })
    } catch (e) {
      // console.error(e)
      return {}
    }
  }
}
