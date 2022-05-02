import { ModExtractor } from './extractor'
import { ModMerger } from './merger'

export async function mergeModsIntoLanguageMap(
  languageMap: Map<string, Map<string, string>>,
  {
    modDirectory,
    modFiles,
  }: {
    modDirectory: string
    modFiles: string[]
  }
): Promise<Map<string, Map<string, string>>> {
  const extractor = new ModExtractor({ modDirectory, modFiles })
  const modification = await extractor.extractMods()

  const merger = new ModMerger({ languageMap, modModification: modification })
  return merger.mergeModification()
}
