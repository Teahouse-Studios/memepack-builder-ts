import { LanguageMap } from '~/types'
import { ModExtractor } from './extractor'
import { ModMerger } from './merger'

export async function mergeModsIntoLanguageMap(
  languageMap: LanguageMap,
  {
    modDirectory,
    modFiles,
  }: {
    modDirectory: string
    modFiles: string[]
  }
): Promise<LanguageMap> {
  const extractor = new ModExtractor({ modDirectory, modFiles })
  const modification = await extractor.extractMods()

  const merger = new ModMerger({ languageMap, modModification: modification })
  return merger.mergeModification()
}
