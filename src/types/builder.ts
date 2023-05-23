import { JsonContentModification } from './json'

/**
 * @public
 */
export interface ArchiveDetail {
  filePath?: string
  content?: Record<string, any>
  modification: JsonContentModification
}

/**
 * @public
 */
export type ArchiveMap = Map<string, ArchiveDetail>
