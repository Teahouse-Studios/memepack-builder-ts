import _ from 'lodash'
import { CollectionModule, Module, ResourceModule } from '../types'

export function priorityToArray(content: string): string[] {
  const entries = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/#.*$/g, '').trim())
    .filter((line) => line !== '')
  return entries
}

export function mergeCollectionIntoResource(
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
