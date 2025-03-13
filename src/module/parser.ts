import { readdir, readJSON } from 'fs-extra'
import { default as klaw } from 'klaw'
import { resolve, relative } from 'node:path'
import {
  _isResource,
  type CollectionModule,
  type ResourceModule,
  type MemeModule,
} from './index.js'
import type { ResourceModuleManifest } from './manifest/index.js'
import { ManifestNormalizer } from './manifest/normalizer.js'

/**
 * @public
 */
export const MODULE_MANIFEST_FILENAME = 'module_manifest.json'

/**
 * @public
 */
export class ModuleParser {
  #searchPaths: string[] = []
  #manifestNormalizer = new ManifestNormalizer()

  addSearchPaths(...paths: string[]) {
    this.#searchPaths.push(...paths)
  }

  async searchModules(): Promise<MemeModule[]> {
    const modules: MemeModule[] = []
    for await (const searchPath of this.#searchPaths) {
      const candidates = await readdir(searchPath, {
        withFileTypes: true,
      }).then((items) => items.filter((item) => item.isDirectory()))
      for await (const dir of candidates) {
        const rawManifest: ResourceModuleManifest = await readJSON(
          resolve(searchPath, dir.name, MODULE_MANIFEST_FILENAME)
        )
        const manifest: ResourceModuleManifest = this.#manifestNormalizer.normalize(rawManifest)
        if (_isResource(manifest)) {
          const m: ResourceModule = {
            path: resolve(searchPath, dir.name),
            manifest,
            files: await _listFiles(resolve(searchPath, dir.name), manifest),
          }
          modules.push(m)
        } else {
          const m: CollectionModule = {
            path: resolve(searchPath, dir.name),
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
 * @param rootPath
 * @param manifest
 * @returns
 * @internal
 */
export async function _listFiles(
  rootPath: string,
  manifest: ResourceModuleManifest
): Promise<string[]> {
  const excludedFilePath = [resolve(rootPath, MODULE_MANIFEST_FILENAME)]
  const result: string[] = []
  for (const entry of manifest.languageModification ?? []) {
    if (entry.add) excludedFilePath.push(resolve(rootPath, entry.add))
    if (entry.remove) excludedFilePath.push(resolve(rootPath, entry.remove))
  }
  for await (const entry of klaw(rootPath)) {
    if (entry.stats.isFile() && !excludedFilePath.includes(entry.path)) {
      result.push(relative(rootPath, entry.path))
    }
  }
  return result
}
