import path from 'path'
import { ArchiveMap, ResourceModule } from '../types'
import { JsonModification } from '../json'

export async function getArchive(selectedModules: ResourceModule[]): Promise<ArchiveMap> {
  const result: ArchiveMap = new Map()
  const modification = await new JsonModification(selectedModules).getModification()
  selectedModules.forEach((module) => {
    module.files.forEach((file) => {
      result.set(file, {
        filePath: path.resolve(module.path, file),
        modification: {},
      })
    })
  })
  result.forEach((detail, entry) => {
    if (modification.addition.has(entry)) {
      if (!detail.modification.flatKey) {
        detail.modification.flatKey = {}
      }
      if (!detail.modification.flatKey.addition) {
        detail.modification.flatKey.addition = new Map(modification.addition.get(entry))
      } else {
        modification.addition
          .get(entry)
          ?.forEach((addValue, addKey) =>
            detail.modification.flatKey?.addition?.set(addKey, addValue)
          )
      }
    }
    if (modification.deletion.has(entry)) {
      if (!detail.modification.flatKey) {
        detail.modification.flatKey = {}
      }
      if (!detail.modification.flatKey.deletion) {
        detail.modification.flatKey.deletion = new Set(modification.deletion.get(entry))
      } else {
        modification.deletion
          .get(entry)
          ?.forEach((delKey) => detail.modification.flatKey?.deletion?.add(delKey))
      }
    }
  })
  return result
}
