import klaw from 'klaw'
import path from 'path'
import { MODULE_MANIFEST_FILE_NAME } from '../..'
import { ArchiveMap, ModuleManifestWithDirectory } from '../../types'

export async function extractResources(
  modulePath: string,
  selectedModules: ModuleManifestWithDirectory[]
): Promise<ArchiveMap> {
  const result: ArchiveMap = new Map()
  for (const module of selectedModules) {
    const p = path.resolve(modulePath, module.directory)
    const excludedFiles = [MODULE_MANIFEST_FILE_NAME]
    for (const entry of module.languageModification ?? []) {
      if (entry.add) excludedFiles.push(entry.add)
      if (entry.remove) excludedFiles.push(entry.remove)
    }
    for await (const entry of klaw(p)) {
      if (excludedFiles.includes(entry.path)) continue
      if (entry.stats.isFile()) {
        const filePath = path.relative(p, entry.path)
        result.set(filePath, entry.path)
      }
    }
  }
  return result
}
