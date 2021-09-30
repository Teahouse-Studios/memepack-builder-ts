import fse from 'fs-extra'
import path from 'path'
import { ModuleOverview } from '../types'

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
    for (const file of await fse.readdir(this.modulePath)) {
      const parsedData = await fse.readJSON(
        path.resolve(this.modulePath, file, 'module_manifest.json'),
        { encoding: 'utf8' }
      )
      const moduleType: string = parsedData.type
      delete parsedData['type']
      parsedData['name'] = file // use folder name instead of name in manifest
      switch (moduleType) {
        case 'collection':
          overview.modules.collection.push(parsedData)
          break
        case 'resource':
          overview.modules.resource.push(parsedData)
          break
        default:
          break
      }
    }
    return overview
  }
}
