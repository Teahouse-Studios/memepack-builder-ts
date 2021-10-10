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
    dir: string
  ): Promise<any> {
    let content
    const e = item[key]
    switch (typeof e) {
      case 'string':
        content = await fse.readJSON(path.resolve(this.modulePath, dir, e))
        break
      case 'object':
        content = e
        break
      default:
        break
    }
    return content
  }
}
