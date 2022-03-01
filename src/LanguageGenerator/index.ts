import { LanguageGenerator } from './LanguageGenerator'
import { ModuleInfo, NameContentList } from '../types'
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
  modFiles = {},
}: {
  resourcePath: string
  mainLanguageFile: string
  modulePath: string
  modules?: ModuleInfo[]
  modFiles?: NameContentList
}): Promise<NameContentList> {
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
