export class Logger {
  static #instance: Logger
  static #isInstantiated = false
  static #log: string[] = []

  private constructor() {
    if (Logger.#isInstantiated) {
      throw new Error(
        'Logger is a singleton class and cannot be instantiated more than once.'
      )
    }
  }

  static getInstance(): Logger {
    if (!Logger.#instance) {
      Logger.#instance = new Logger()
    }
    return Logger.#instance
  }

  static appendLog(entry: string | string[]): void {
    if (Array.isArray(entry)) {
      Logger.#log = Logger.#log.concat(entry)
    } else {
      Logger.#log.push(entry)
    }
  }

  static clearLog(): void {
    Logger.#log = []
  }

  static get log(): string[] {
    return Logger.#log
  }
}
