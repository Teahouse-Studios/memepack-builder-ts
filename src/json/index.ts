export * from './lang'
export * from './modification'
export * from './transform'

/**
 *
 * @param obj - the json to be stringified
 * @returns the string representation of the json, which is ascii-ensured
 * @internal
 */
export function _jsonDumpEnsureAscii(obj: Record<string, string>): string {
  const value = JSON.stringify(obj, undefined, 4)
  const arr: string[] = []
  for (let i = 0; i < value.length; i++) {
    arr.push(
      value[i] < '\u00FF' ? value[i] : `\\u${value[i].charCodeAt(0).toString(16).padStart(4, '0')}`
    )
  }
  return arr.join('')
}
