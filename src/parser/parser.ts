import fs from 'fs-extra'
import klaw from 'klaw'
import { MODULE_MANIFEST_FILENAME } from '../constants'
import path from 'path'
import type { CollectionModule, Module, ResourceModule, ResourceModuleManifest } from '../types'

/**
 * @public
 */
export class ModuleParser {
  #searchPaths: string[] = []

  addSearchPaths(...paths: string[]) {
    this.#searchPaths.push(...paths)
  }

  async searchModules(): Promise<Module[]> {
    const modules: Module[] = []
    for await (const searchPath of this.#searchPaths) {
      const candidates = await fs
        .readdir(searchPath, {
          withFileTypes: true,
        })
        .then((items) => items.filter((item) => item.isDirectory()))
      for await (const dir of candidates) {
        const manifest: ResourceModuleManifest = await fs.readJSON(
          path.resolve(searchPath, dir.name, MODULE_MANIFEST_FILENAME)
        )
        if (isResource(manifest)) {
          const m: ResourceModule = {
            path: path.resolve(searchPath, dir.name),
            manifest,
            files: await extractFiles(path.resolve(searchPath, dir.name), manifest),
          }
          modules.push(m)
        } else {
          const m: CollectionModule = {
            path: path.resolve(searchPath, dir.name),
            manifest,
          }
          modules.push(m)
        }
      }
    }
    return modules
  }
}

/**
 *
 * @param manifest
 * @returns
 * @internal
 */
function isResource(manifest: ResourceModuleManifest): manifest is ResourceModuleManifest {
  return manifest.type === 'resource'
}

/**
 *
 * @param rootPath
 * @param manifest
 * @returns
 * @internal
 */
async function extractFiles(rootPath: string, manifest: ResourceModuleManifest): Promise<string[]> {
  const excludedFilePath = [path.resolve(rootPath, MODULE_MANIFEST_FILENAME)]
  const result: string[] = []
  for (const entry of manifest.languageModification ?? []) {
    if (entry.add) excludedFilePath.push(path.resolve(rootPath, entry.add))
    if (entry.remove) excludedFilePath.push(path.resolve(rootPath, entry.remove))
  }
  for await (const entry of klaw(rootPath)) {
    if (entry.stats.isFile() && !excludedFilePath.includes(entry.path)) {
      result.push(path.relative(rootPath, entry.path))
    }
  }
  return result
}
