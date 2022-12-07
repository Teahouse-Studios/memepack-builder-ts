import fs from 'fs-extra'
import { createHash } from 'crypto'
import {
  ResourceModule,
  ArchiveMap,
  JsonContentModification,
  JsonFlatKeyModification,
  JsonNestedKeyModification,
} from '../types'
import { priorityToArray } from '../utils'
import { MODULE_PRIORITY_FILENAME } from '../constants'
import { getArchive } from '../module'
import path from 'path'

export class PackBuilder {
  selectedModules: ResourceModule[]
  priorityFilePath: string
  entries: ArchiveMap = new Map()

  constructor(selectedModules: ResourceModule[], priorityFilePath: string) {
    this.selectedModules = selectedModules
    this.priorityFilePath = priorityFilePath
  }

  protected async sortModules(): Promise<void> {
    const priorityRaw = await fs.readFile(
      path.join(this.priorityFilePath, MODULE_PRIORITY_FILENAME),
      'utf-8'
    )
    const priority = priorityToArray(priorityRaw)
    const sorted: ResourceModule[] = []

    priority.forEach((rank) => {
      const module = this.selectedModules.find((m) => m.manifest.name === rank)
      if (module) {
        sorted.push(module)
      }
    })
    const left = this.selectedModules.filter((m) => !priority.includes(m.manifest.name))

    this.selectedModules = [...sorted, ...left]
  }

  async getPackEntries(): Promise<ArchiveMap> {
    const entries = await getArchive(this.selectedModules)
    this.entries = entries
    return entries
  }

  protected static getPackHash(content: Buffer): string {
    const hash = createHash('sha256').update(content).digest('hex')
    return hash
  }

  protected static applyJsonContentModification(
    content: Record<string, any>,
    modification: JsonContentModification
  ): Record<string, any> {
    if (modification.flatKey) {
      content = PackBuilder.applyJsonFlatKeyModification(content, modification.flatKey)
    }
    if (modification.nestedKey) {
      content = PackBuilder.applyJsonNestedKeyModification(content, modification.nestedKey)
    }
    return content
  }

  static async applyJsonModification(
    filePath: string,
    modification: JsonContentModification
  ): Promise<Record<string, any>> {
    return PackBuilder.applyJsonContentModification(await fs.readJSON(filePath), modification)
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
