/**
 * @public
 */
export class LangFileConvertor {
  static parseJavaLang(rawContent: string) {
    const entries = rawContent
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.replace(/#.*$/g, '').trimStart())
      .filter((line) => line !== '' && line.includes('='))
      .map((line) => line.split('=', 2))
    return Object.fromEntries(entries)
  }

  static dumpJavaLang(obj: Record<string, string>): string {
    return Object.entries(obj)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')
  }

  static parseBedrockLang(rawContent: string) {
    const entries = rawContent
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.replace(/(?:##|\t#).*$/g, '').trimStart())
      .filter((line) => line !== '' && line.includes('='))
      .map((line) => line.split('=', 2))
    return Object.fromEntries(entries)
  }

  static dumpBedrockLang(obj: Record<string, string>): string {
    return Object.entries(obj)
      .map(([k, v]) => `${k}=${v}\t#`)
      .join('\n')
  }
}
