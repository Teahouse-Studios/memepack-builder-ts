import fse from 'fs-extra'
import path from 'path'
import { ModuleInfo, ModuleOverview } from '../types'

export class ModuleChecker {
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
      modules: {
        collection: [],
        resource: [],
      },
    }
    for (const { name } of (
      await fse.readdir(this.modulePath, { withFileTypes: true })
    ).filter((value) => value.isDirectory())) {
      const data = (await fse.readJSON(
        path.resolve(this.modulePath, name, 'module_manifest.json'),
        { encoding: 'utf8' }
      )) as ModuleInfo
      data.dirName = name
      switch (data.type) {
        case 'collection':
          overview.modules.collection.push(data)
          break
        case 'resource':
          overview.modules.resource.push(data)
          break
        default:
          break
      }
    }
    return overview
  }
}
