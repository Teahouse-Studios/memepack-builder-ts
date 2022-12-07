export interface JsonFlatKeyModification {
  addition?: Map<string, string>
  deletion?: Set<string>
}

export interface JsonNestedKeyModification {
  addition?: Map<string, any>
  deletion?: Set<string>
}

export interface JsonContentModification {
  flatKey?: JsonFlatKeyModification
  nestedKey?: JsonNestedKeyModification
}

export type JsonFlatAdditionEntry = Map<string, Map<string, string>>
export type JsonFlatDeletionEntry = Map<string, Set<string>>
