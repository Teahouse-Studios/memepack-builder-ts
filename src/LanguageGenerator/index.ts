import { LanguageGenerator } from './LanguageGenerator'
import { ModuleInfo, LanguageMap } from '../types'
export { LanguageGenerator } from './LanguageGenerator'
export {
  ensureAscii,
  JELangToJSON,
  BELangToJSON,
  JSONToJELang,
  JSONToBELang,
} from './convert'

export async function generateJSON({
  resourcePath,
  mainLanguageFile,
  modulePath,
  modules = [],
  modFiles = new Map(),
}: {
  resourcePath: string
  mainLanguageFile: string
  modulePath: string
  modules?: ModuleInfo[]
  modFiles?: LanguageMap
}): Promise<LanguageMap> {
  const generator = new LanguageGenerator({
    resourcePath,
    mainLanguageFile,
    modulePath,
    modules,
    modFiles,
  })
  await generator.mergeModules()
  await generator.mergeMods()
  return generator.content
}
