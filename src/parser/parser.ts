import fs from 'fs-extra'
import klaw from 'klaw'
import { MODULE_MANIFEST_FILENAME } from '../constants'
import path from 'path'
import {
  CollectionModule,
  Module,
  ResourceFileInfo,
  ResourceModule,
  ResourceModuleManifest,
} from '../types'

export class ModuleParser {
  searchPath: string

  constructor(searchPath: string) {
    this.searchPath = searchPath
  }

  async searchModules(): Promise<Module[]> {
    const modules: Module[] = []
    const candidates = await fs
      .readdir(this.searchPath, {
        withFileTypes: true,
      })
      .then((items) => items.filter((item) => item.isDirectory()))
    candidates.forEach(async (dir) => {
      const manifest: ResourceModuleManifest = await fs.readJSON(
        path.resolve(this.searchPath, dir.name, MODULE_MANIFEST_FILENAME)
      )
      if (isResource(manifest)) {
        const m: ResourceModule = {
          path: path.resolve(this.searchPath, dir.name),
          manifest,
          files: await extractFiles(path.resolve(this.searchPath, dir.name), manifest),
        }
        modules.push(m)
      } else {
        const m: CollectionModule = {
          path: path.resolve(this.searchPath, dir.name),
          manifest,
        }
        modules.push(m)
      }
    })
    return modules
  }
}

function isResource(manifest: ResourceModuleManifest): manifest is ResourceModuleManifest {
  return manifest.type === 'resource'
}

async function extractFiles(
  rootPath: string,
  manifest: ResourceModuleManifest
): Promise<ResourceFileInfo[]> {
  const excludedFilePath = [path.resolve(rootPath, MODULE_MANIFEST_FILENAME)]
  const result: ResourceFileInfo[] = []
  for (const entry of manifest.languageModification ?? []) {
    if (entry.add) excludedFilePath.push(path.resolve(module.path, entry.add))
    if (entry.remove) excludedFilePath.push(path.resolve(module.path, entry.remove))
  }
  for await (const entry of klaw(rootPath)) {
    if (entry.stats.isFile() && !excludedFilePath.includes(entry.path)) {
      const isLanguage = /\/(?:lang|texts)\//g.test(entry.path)
      result.push({ path: path.relative(rootPath, entry.path), isLanguage })
    }
  }
  return result
}
