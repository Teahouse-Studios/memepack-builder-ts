/**
 * @public
 */
export interface JsonFlatKeyModification {
  addition?: Map<string, string>
  deletion?: Set<string>
}

/**
 * @public
 */
export interface JsonNestedKeyModification {
  addition?: Map<string, any>
  deletion?: Set<string>
}

/**
 * @public
 */
export interface JsonContentModification {
  flatKey?: JsonFlatKeyModification
  nestedKey?: JsonNestedKeyModification
}

/**
 * @public
 */
export type JsonFlatAdditionEntry = Map<string, Map<string, string>>

/**
 * @public
 */
export type JsonFlatDeletionEntry = Map<string, Set<string>>
