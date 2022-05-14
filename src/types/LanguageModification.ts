export interface LanguageModificationDefinition {
  file: string
  add?: string
  remove?: string
}

export interface LanguageModification {
  file: string
  add?: Map<string, string>
  remove?: string[]
}
