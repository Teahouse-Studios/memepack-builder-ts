import {
  JsonContentModification,
  JsonFlatKeyModification,
  JsonNestedKeyModification,
} from '../types'
import fs from 'fs-extra'

export class JsonTransformation {
  static applyJsonContentModification(
    content: Record<string, any>,
    modification: JsonContentModification
  ): Record<string, any> {
    if (modification.flatKey) {
      content = JsonTransformation.applyJsonFlatKeyModification(content, modification.flatKey)
    }
    if (modification.nestedKey) {
      content = JsonTransformation.applyJsonNestedKeyModification(content, modification.nestedKey)
    }
    return content
  }

  static async applyJsonModification(
    filePath: string,
    modification: JsonContentModification
  ): Promise<Record<string, any>> {
    return JsonTransformation.applyJsonContentModification(
      await fs.readJSON(filePath),
      modification
    )
  }

  static applyJsonFlatKeyModification(
    content: Record<string, any>,
    modification: JsonFlatKeyModification
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

  static applyJsonNestedKeyModification(
    content: Record<string, any>,
    modification: JsonNestedKeyModification
  ): Record<string, any> {
    if (modification.addition) {
      for (const [k, v] of modification.addition) {
        const segments = k.split('.')
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
        const segments = k.split('.')
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
