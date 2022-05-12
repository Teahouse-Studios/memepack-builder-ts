import { LanguageMap, ModuleManifestWithDirectory } from '~/types'
import { LanguageExtractor } from './extractor'
import { BedrockLanguageMerger } from './merger'
import { JavaLanguageMerger } from './merger/java'

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
  const merger =
    platform === 'java'
      ? new JavaLanguageMerger({
          resourcePath: baseResourcePath,
          modification: { add, remove },
        })
      : new BedrockLanguageMerger({
          resourcePath: baseResourcePath,
          modification: { add, remove },
        })
  return await merger.mergeModification()
}
