import fse from 'fs-extra'
import path from 'path'
import {
  LanguageModificationFile,
  ModuleInfo,
  ModuleManifest,
  ModuleOverview,
} from '../types'

export class ModuleParser {
  modulePath: string
  log: string[] = []
  moduleInfo: () => Promise<ModuleOverview>

  constructor(modulePath: string) {
    this.modulePath = path.resolve(modulePath)
    this.moduleInfo = this.validateModules
  }

  appendLog(entry: string | string[]): void {
    this.log.push(...entry)
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
    const info: ModuleInfo = {
      name: data.name,
      type: data.type,
      author: data.author,
      description: data.description,
      dirName,
      contains: data.contains,
      incompatibleWith: data.incompatibleWith,
    }
    if (data.languageModification) {
      info.languageModification = []
      for (const item of data.languageModification) {
        const add: Record<string, string> =
          (await this.readContent(item, 'add', dirName)) || {}
        const remove: string[] =
          (await this.readContent(item, 'remove', dirName)) || []
        info.languageModification.push({
          file: item.file,
          add,
          remove,
        })
      }
    }
    return info
  }

  async readContent(
    item: LanguageModificationFile,
    key: 'add' | 'remove',
    directory: string
  ): Promise<any> {
    let content
    const e = item[key]
    switch (typeof e) {
      // if it's a string, assuming file path
      case 'string':
        if (e !== '') {
          content = await fse.readJSON(
            path.resolve(this.modulePath, directory, e)
          )
        }
        break
      // if it's an object, use it directly
      case 'object':
        content = e
        break
      // not present, check default path `${item.file}.${key}.json`
      case 'undefined':
        if (
          await fse.pathExists(
            path.resolve(this.modulePath, directory, `${item.file}.${key}.json`)
          )
        ) {
          content = await fse.readJSON(
            path.resolve(this.modulePath, directory, `${item.file}.${key}.json`)
          )
        }
        break
      default:
        break
    }
    return content
  }
}
