import { readFile } from 'fs-extra'
import type { CollectionModule, MemeModule, ResourceModule } from '../module/index.js'

/**
 *
 * @param filePath - the priority file path
 * @returns
 * @internal
 */
export async function _priorityToArray(filePath: string): Promise<string[]> {
  const content = await readFile(filePath, 'utf-8')
  const entries = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/#.*$/g, '').trim())
    .filter((line) => line !== '')
  return entries
}

/**
 *
 * @param modules - modules to be searched
 * @param object - object to store which modules are to be included
 * @returns
 * @internal
 */
export function _mergeCollectionIntoResource(
  modules: MemeModule[],
  { resource, collection }: { resource: string[]; collection: string[] }
): ResourceModule[] {
  const resourceModules = modules.filter((value) => isResource(value))
  const collectionModules = modules.filter((value) => isCollection(value))

  const pickedResourceModules = new Set<ResourceModule>()
  for (const item of resourceModules) {
    if (resource.includes(item.manifest.name)) {
      pickedResourceModules.add(item)
    }
  }

  const pickedCollectionModules = new Set<CollectionModule>()
  for (const item of collectionModules) {
    if (collection.includes(item.manifest.name)) {
      pickedCollectionModules.add(item)
    }
  }
  for (const { manifest } of pickedCollectionModules) {
    for (const item of resourceModules) {
      if (manifest.contains?.includes(item.manifest.name)) {
        pickedResourceModules.add(item)
      }
    }
  }
  return Array.from(pickedResourceModules)
}

/**
 * @internal
 */
export function isResource(module: MemeModule): module is ResourceModule {
  return module.manifest.type === 'resource'
}

/**
 * @internal
 */
export function isCollection(module: MemeModule): module is CollectionModule {
  return module.manifest.type === 'collection'
}
