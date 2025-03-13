import { createHash } from 'node:crypto'
import type { ResourceModule, MemeModule } from '../module/index.js'
import { type ArchiveMap, generateArchiveEntries } from '../archive/index.js'
import { _mergeCollectionIntoResource, _priorityToArray } from '../utils/index.js'
import type { BaseBuildOptions } from '../option/index.js'

/**
 * @public
 */
export class PackBuilder {
  parsedModules: MemeModule[]
  #selectedModules: ResourceModule[] = []
  priorityFilePath: string
  entries: ArchiveMap = new Map()

  constructor(parsedModules: MemeModule[], priorityFilePath: string) {
    this.parsedModules = parsedModules
    this.priorityFilePath = priorityFilePath
  }

  get selectedModules() {
    return this.#selectedModules
  }

  protected async sortModules(): Promise<void> {
    const priority = await _priorityToArray(this.priorityFilePath)
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
    const entries = await generateArchiveEntries(this.#selectedModules)
    this.entries = entries
    return entries
  }

  static getPackHash(content: Buffer): string {
    const hash = createHash('sha256').update(content).digest('hex')
    return hash
  }

  decideSelectedModules(options: BaseBuildOptions): ResourceModule[] {
    const modules = _mergeCollectionIntoResource(this.parsedModules, options.modules)
    this.#selectedModules = modules
    return modules
  }
}
