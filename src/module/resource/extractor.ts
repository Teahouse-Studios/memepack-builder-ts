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
  excludedFiles.push(MODULE_MANIFEST_FILE_NAME)
  for (const module of selectedModules) {
    const p = path.resolve(modulePath, module.directory)
    const excluded = excludedFiles.map((file) => path.resolve(p, file))
    for (const entry of module.languageModification ?? []) {
      if (entry.add) excluded.push(path.resolve(p, entry.add))
      if (entry.remove) excluded.push(path.resolve(p, entry.remove))
    }
    for await (const entry of klaw(p)) {
      if (excluded.includes(entry.path)) continue
      if (entry.stats.isFile()) {
        const archivePath = path.relative(p, entry.path)
        result.set(archivePath, entry.path)
      }
    }
  }
  return result
}
