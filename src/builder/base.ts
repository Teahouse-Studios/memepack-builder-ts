import { createHash } from 'crypto'
import { ResourceModule, ArchiveMap, BaseBuildOptions, Module } from '../types'
import { mergeCollectionIntoResource, priorityToArray } from '../utils'
import { getArchive } from '../module'

export class PackBuilder {
  parsedModules: Module[]
  #selectedModules: ResourceModule[] = []
  priorityFilePath: string
  entries: ArchiveMap = new Map()

  constructor(parsedModules: Module[], priorityFilePath: string) {
    this.parsedModules = parsedModules
    this.priorityFilePath = priorityFilePath
  }

  get selectedModules() {
    return this.#selectedModules
  }

  protected async sortModules(): Promise<void> {
    const priority = await priorityToArray(this.priorityFilePath)
    const sorted: ResourceModule[] = []

    priority.forEach((rank) => {
      const module = this.#selectedModules.find((m) => m.manifest.name === rank)
      if (module) {
        sorted.push(module)
      }
    })
    const left = this.#selectedModules.filter((m) => !priority.includes(m.manifest.name))

    this.#selectedModules = [...sorted, ...left]
  }

  async getPackEntries(): Promise<ArchiveMap> {
    const entries = await getArchive(this.#selectedModules)
    this.entries = entries
    return entries
  }

  static getPackHash(content: Buffer): string {
    const hash = createHash('sha256').update(content).digest('hex')
    return hash
  }

  decideSelectedModules(options: BaseBuildOptions): ResourceModule[] {
    const modules = mergeCollectionIntoResource(this.parsedModules, options.modules)
    this.#selectedModules = modules
    return modules
  }
}
