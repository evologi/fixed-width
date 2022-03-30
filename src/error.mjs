export class FixedWidthError extends Error {
  constructor (code, message, context = {}) {
    super(message)
    if (Error.captureStackTrace !== undefined) {
      Error.captureStackTrace(this, FixedWidthError)
    }
    this.name = 'FixedWidthError'
    this.code = code
    for (const key of Object.keys(context)) {
      this[key] = context[key]
    }
  }

  get [Symbol.toStringTag] () {
    return 'Error'
  }

  toString () {
    return `${this.name} [${this.code}]: ${this.message}`
  }
}
