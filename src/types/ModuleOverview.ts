import { ModuleInfo } from './ModuleInfo'

export interface ModuleOverview {
  modulePath: string
  modules: {
    collection: ModuleInfo[]
    resource: ModuleInfo[]
  }
}
