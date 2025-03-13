import { readJSON } from 'fs-extra'
/**
 * @public
 */
export interface JsonPatchDefinition {
  file: string
  add?: string
  remove?: string
}

/**
 * @public
 */
export type JsonAdditionPatch = Map<string, string>

/**
 * @public
 */
export type JsonDeletionPatch = Set<string>

/**
 * @public
 */
export interface JsonFlatKeyPatch {
  addition?: JsonAdditionPatch
  deletion?: JsonDeletionPatch
}

/**
 * @public
 */
export interface JsonNestedKeyPatch {
  addition?: Map<string, any>
  deletion?: JsonDeletionPatch
}

/**
 * @public
 */
export interface JsonContentPatch {
  flatKey?: JsonFlatKeyPatch
  nestedKey?: JsonNestedKeyPatch
}

/**
 * @public
 */
export class JsonPatch {
  static applyJsonContentPatch(
    content: Record<string, any>,
    patch: JsonContentPatch
  ): Record<string, any> {
    if (patch.flatKey) {
      content = JsonPatch.applyJsonFlatKeyPatch(content, patch.flatKey)
    }
    if (patch.nestedKey) {
      content = JsonPatch.applyJsonNestedKeyPatch(content, patch.nestedKey)
    }
    return content
  }

  static async applyJsonFilePatch(
    filePath: string,
    patch: JsonContentPatch
  ): Promise<Record<string, any>> {
    return JsonPatch.applyJsonContentPatch(await readJSON(filePath), patch)
  }

  static applyJsonFlatKeyPatch(
    content: Record<string, any>,
    patch: JsonFlatKeyPatch
  ): Record<string, any> {
    if (patch.addition) {
      for (const [k, v] of patch.addition) {
        content[k] = v
      }
    }
    if (patch.deletion) {
      for (const k of patch.deletion) {
        delete content[k]
      }
    }
    return content
  }

  static applyJsonNestedKeyPatch(
    content: Record<string, any>,
    patch: JsonNestedKeyPatch
  ): Record<string, any> {
    if (patch.addition) {
      for (const [k, v] of patch.addition) {
        const segments = k.split('.').filter((v) => v !== '__proto__')
        const lastKey = segments.pop() ?? ''
        let ref = content
        for (const key of segments) {
          ref[key] ??= {}
          ref = ref[key]
        }
        ref[lastKey] = v
      }
    }
    if (patch.deletion) {
      for (const k of patch.deletion) {
        const segments = k.split('.').filter((v) => v !== '__proto__')
        const lastKey = segments.pop() ?? ''
        let ref = content
        let hasKey = true
        for (const key of segments) {
          if (ref[key]) {
            ref = ref[key]
          } else {
            hasKey = false
            break
          }
        }
        if (hasKey) {
          delete ref[lastKey]
        }
      }
    }
    return content
  }
}
