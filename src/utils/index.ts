import _ from 'lodash'
import fs from 'fs-extra'
import type { CollectionModule, Module, ResourceModule } from '../types'

/**
 *
 * @param filePath - the priority file path
 * @returns
 * @internal
 */
export async function _priorityToArray(filePath: string): Promise<string[]> {
  const content = await fs.readFile(filePath, 'utf-8')
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
  modules: Module[],
  { resource, collection }: { resource: string[]; collection: string[] }
): ResourceModule[] {
  const resourceModules = modules.filter(
    (value): value is ResourceModule => value.manifest.type === 'resource'
  )
  const collectionModules = modules.filter(
    (value): value is CollectionModule => value.manifest.type === 'collection'
  )
  const result = new Set(
    _.intersectionWith(resourceModules, resource, (a, b) => a.manifest.name === b)
  )
  for (const {
    manifest: { contains },
  } of _.intersectionWith(collectionModules, collection, (a, b) => a.manifest.name === b)) {
    for (const item of _.intersectionWith(
      resourceModules,
      contains ?? [],
      (a, b) => a.manifest.name === b
    )) {
      result.add(item)
    }
  }
  return Array.from(result)
}
