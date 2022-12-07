import { createHash } from 'crypto'
import { ResourceModule, ArchiveMap } from '../types'
import { priorityToArray } from '../utils'
import { getArchive } from '../module'

export class PackBuilder {
  selectedModules: ResourceModule[]
  priorityFilePath: string
  entries: ArchiveMap = new Map()

  constructor(selectedModules: ResourceModule[], priorityFilePath: string) {
    this.selectedModules = selectedModules
    this.priorityFilePath = priorityFilePath
  }

  protected async sortModules(): Promise<void> {
    const priority = await priorityToArray(this.priorityFilePath)
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

  static getPackHash(content: Buffer): string {
    const hash = createHash('sha256').update(content).digest('hex')
    return hash
  }
}
