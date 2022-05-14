import { LanguageMap, ModuleManifestWithDirectory } from '../../types'
import { LanguageExtractor } from './extractor'
import { BedrockLanguageMerger, JavaLanguageMerger } from './merger'

export async function getJavaLanguageMapFromOptions(
  baseResourcePath: string,
  modulePath: string,
  selectedModules: ModuleManifestWithDirectory[]
): Promise<LanguageMap> {
  const extractor = new LanguageExtractor({
    modulePath,
    selectedModules,
  })
  const { add, remove } = await extractor.extractModification()
  const merger = new JavaLanguageMerger({
    resourcePath: baseResourcePath,
    modification: { add, remove },
  })
  return await merger.mergeModification()
}

export async function getBedrockLanguageMapFromOptions(
  baseResourcePath: string,
  modulePath: string,
  selectedModules: ModuleManifestWithDirectory[]
): Promise<LanguageMap> {
  const extractor = new LanguageExtractor({
    modulePath,
    selectedModules,
  })
  const { add, remove } = await extractor.extractModification()
  const merger = new BedrockLanguageMerger({
    resourcePath: baseResourcePath,
    modification: { add, remove },
  })
  return await merger.mergeModification()
}
