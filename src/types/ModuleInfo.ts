export interface ModuleInfo {
  name: string
  description: string
  author: string[]
  contains?: string[]
  incompatibleWith?: string[]
  classifier: string[]
}
