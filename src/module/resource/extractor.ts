import klaw from 'klaw'
import path from 'path'
import { MODULE_MANIFEST_FILE_NAME } from '../../constants'
import { ArchiveMap, ModuleManifestWithDirectory } from '../../types'

export async function extractResources(
  modulePath: string,
  selectedModules: ModuleManifestWithDirectory[],
  excludedFiles: string[] = []
): Promise<ArchiveMap> {
  const result: ArchiveMap = new Map()
  for (const module of selectedModules) {
    const p = path.resolve(modulePath, module.directory)
    excludedFiles.push(path.resolve(p, MODULE_MANIFEST_FILE_NAME))
    for (const entry of module.languageModification ?? []) {
      if (entry.add) excludedFiles.push(path.resolve(p, entry.add))
      if (entry.remove) excludedFiles.push(path.resolve(p, entry.remove))
    }
    for await (const entry of klaw(p)) {
      if (excludedFiles.includes(entry.path)) continue
      if (entry.stats.isFile()) {
        const archivePath = path.relative(p, entry.path)
        result.set(archivePath, entry.path)
      }
    }
  }
  return result
}
