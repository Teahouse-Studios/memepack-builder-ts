import { JsonContentModification } from './json'

export interface ArchiveDetail {
  filePath?: string
  content?: Record<string, any>
  modification: JsonContentModification
}

export type ArchiveMap = Map<string, ArchiveDetail>
