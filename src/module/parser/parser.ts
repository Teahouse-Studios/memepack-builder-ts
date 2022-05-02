import fse from 'fs-extra'
import path from 'path'
import { ModuleManifest, ModuleOverview } from '../../types'
import { MODULE_MANIFEST_FILE_NAME } from '../..'
import { Logger } from '../../log'

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
    const moduleDirectories = (
      await fse.readdir(this.modulePath, { withFileTypes: true })
    ).filter((value) => value.isDirectory())
    for (const { name: dirName } of moduleDirectories) {
      try {
        const data: ModuleManifest = await fse.readJSON(
          path.resolve(this.modulePath, dirName, MODULE_MANIFEST_FILE_NAME),
          { encoding: 'utf8' }
        )
        overview.modules.push({ ...data, directory: dirName })
      } catch (e) {
        Logger.appendLog(`Warning: "${dirName}" is not a valid module.`)
      }
    }
    return overview
  }
}
