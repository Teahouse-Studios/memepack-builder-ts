import { readJSON } from 'fs-extra'

/**
 * @public
 */
export type AdditionPatch = Map<string, string>

/**
 * @public
 */
export type DeletionPatch = Set<string>

/**
 * @public
 */
export interface JsonFlatKeyPatch {
  addition?: AdditionPatch
  deletion?: DeletionPatch
}

/**
 * @public
 */
export interface JsonNestedKeyPatch {
  addition?: Map<string, any>
  deletion?: DeletionPatch
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
    modification: JsonContentPatch
  ): Record<string, any> {
    if (modification.flatKey) {
      content = JsonPatch.applyJsonFlatKeyPatch(content, modification.flatKey)
    }
    if (modification.nestedKey) {
      content = JsonPatch.applyJsonNestedKeyPatch(content, modification.nestedKey)
    }
    return content
  }

  static async applyJsonPatch(
    filePath: string,
    modification: JsonContentPatch
  ): Promise<Record<string, any>> {
    return JsonPatch.applyJsonContentPatch(await readJSON(filePath), modification)
  }

  static applyJsonFlatKeyPatch(
    content: Record<string, any>,
    modification: JsonFlatKeyPatch
  ): Record<string, any> {
    if (modification.addition) {
      for (const [k, v] of modification.addition) {
        content[k] = v
      }
    }
    if (modification.deletion) {
      for (const k of modification.deletion) {
        delete content[k]
      }
    }
    return content
  }

  static applyJsonNestedKeyPatch(
    content: Record<string, any>,
    modification: JsonNestedKeyPatch
  ): Record<string, any> {
    if (modification.addition) {
      for (const [k, v] of modification.addition) {
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
    if (modification.deletion) {
      for (const k of modification.deletion) {
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
