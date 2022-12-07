export * from './lang'
export * from './modification'
export * from './transform'

export function jsonDumpEnsureAscii(obj: Record<string, string>) {
  const value = JSON.stringify(obj, undefined, 4)
  const arr: string[] = []
  for (let i = 0; i < value.length; i++) {
    arr.push(
      value[i] < '\u00FF' ? value[i] : `\\u${value[i].charCodeAt(0).toString(16).padStart(4, '0')}`
    )
  }
  return arr.join('')
}
