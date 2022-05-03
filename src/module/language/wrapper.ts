import { LanguageMap, ModuleManifestWithDirectory } from '../../types'
import { LanguageExtractor } from './extractor'
import { LanguageMerger } from './merger'

export async function getLanguageMapFromOptions(
  platform: 'bedrock' | 'java',
  baseResourcePath: string,
  modulePath: string,
  selectedModules: ModuleManifestWithDirectory[]
): Promise<LanguageMap> {
  const extractor = new LanguageExtractor({
    modulePath,
    selectedModules,
  })
  const { add, remove } = await extractor.extractModification()
  const merger = new LanguageMerger({
    platform,
    resourcePath: baseResourcePath,
    modification: { add, remove },
  })
  return await merger.mergeModification()
}
