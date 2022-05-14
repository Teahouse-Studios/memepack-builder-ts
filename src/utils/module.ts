import _ from 'lodash'
import { ModuleManifestWithDirectory, ModuleOverview } from '../types'

export function mergeCollectionIntoResource(
  moduleOverview: ModuleOverview,
  { resource, collection }: { resource: string[]; collection: string[] }
): ModuleManifestWithDirectory[] {
  const resourceModules = moduleOverview.modules.filter(
    (value) => value.type === 'resource'
  )
  const collectionModules = moduleOverview.modules.filter(
    (value) => value.type === 'collection'
  )
  const result = new Set(
    _.intersectionWith(resourceModules, resource, (a, b) => a.name === b)
  )
  for (const { contains } of _.intersectionWith(
    collectionModules,
    collection,
    (a, b) => a.name === b
  )) {
    for (const item of _.intersectionWith(
      resourceModules,
      contains ?? [],
      (a, b) => a.name === b
    )) {
      result.add(item)
    }
  }
  return Array.from(result)
}
