import { Transform } from 'node:stream'
import { StringDecoder } from 'node:string_decoder'

import { FixedWidthError } from './error.mjs'
import { isAsyncIterable, isIterable, parseOptions } from './options.mjs'

export class Parser {
  static stream (options) {
    const parser = new Parser(options)

    return new Transform({
      allowHalfOpen: false,
      decodeStrings: true,
      defaultEncoding: parser.options.encoding,
      readableObjectMode: true,
      writableObjectMode: false,
      transform (chunk, encoding, callback) {
        try {
          for (const data of parser.write(chunk)) {
            this.push(data)
          }
          callback()
        } catch (err) {
          callback(err)
        }
      },
      flush (callback) {
        try {
          for (const data of parser.end()) {
            this.push(data)
          }
          callback()
        } catch (err) {
          callback(err)
        }
      }
    })
  }

  constructor (options) {
    this.options = parseOptions(options)

    this.decoder = new StringDecoder(this.options.encoding)
    this.line = 1
    this.text = ''
  }

  * end () {
    if (this.text.length) {
      yield parseFields(
        this.text,
        this.options,
        this.line++
      )
    }

    // Reset internal status
    this.text = ''
    this.line = 1
  }

  * write (input) {
    this.text += typeof input === 'string'
      ? input
      : this.decoder.write(input)

    if (!this.options.eol) {
      const eol = guessEndOfLine(this.text)
      if (eol) {
        this.options.eol = eol
      }
    }

    if (this.options.eol) {
      const chunks = this.text.split(this.options.eol)

      // Ignore last line (could be partial)
      this.text = chunks.pop()

      for (const chunk of chunks) {
        if (chunk.length > 0 || !this.options.skipEmptyLines) {
          yield parseFields(
            chunk,
            this.options,
            this.line++
          )
        }
      }
    }
  }
}

export function parse (input, options) {
  const parser = new Parser(options)

  if (typeof input === 'string' || Buffer.isBuffer(input)) {
    return Array.from(parser.write(input)).concat(Array.from(parser.end()))
  } else if (isIterable(input)) {
    return parseIterable(input, parser)
  } else if (isAsyncIterable(input)) {
    return parseAsyncIterable(input, parser)
  } else {
    throw new TypeError('Expected string, buffer, or iterable')
  }
}

function * parseIterable (iterable, parser) {
  for (const data of iterable) {
    yield * parser.write(data)
  }
  yield * parser.end()
}

async function * parseAsyncIterable (iterable, parser) {
  for await (const data of iterable) {
    yield * parser.write(data)
  }
  yield * parser.end()
}

export function parseFields (text, options, line = 1) {
  if (text.length > options.width && !options.allowLongerLines) {
    throw new FixedWidthError(
      'UNEXPECTED_LINE_LENGTH',
      `Line ${line} is longer than expected (see allowLongerLines options)`,
      { line, value: text }
    )
  }
  if (text.length < options.width && !options.allowShorterLines) {
    throw new FixedWidthError(
      'UNEXPECTED_LINE_LENGTH',
      `Line ${line} is shorted than expected (see allowShorterLines options)`,
      { line, value: text }
    )
  }

  if (options.output === 'object') {
    return options.fields.reduce(
      (acc, field) => set(
        acc,
        field.property,
        parseField(text, field, options, line)
      ),
      {}
    )
  } else {
    return options.fields.map(
      field => parseField(text, field, options, line)
    )
  }
}

export function parseField (text, field, options, line) {
  const index = field.column - 1

  const value = trimString(
    text.substring(index, index + field.width),
    field.pad,
    options.trim
  )
  if (!field.cast) {
    return value
  }

  return field.cast(value, {
    column: field.column,
    line,
    width: field.width
  })
}

function set (obj, key, value) {
  obj[key] = value
  return obj
}

export function guessEndOfLine (text) {
  if (/\r\n/.test(text)) {
    // Windows
    return '\r\n'
  }

  const result = text.match(/[\r\n]{1,2}/)
  if (result) {
    if (text[result.index] === '\n') {
      // Linux
      return '\n'
    } else if (text.length > result.index + 1) {
      // Apple
      return '\r'
    }
  }
}

export function trimStart (value, pad) {
  let index = 0
  while (value[index] === pad) {
    index++
  }
  return value.substring(index)
}

export function trimEnd (value, pad) {
  let index = value.length - 1
  while (value[index] === pad) {
    index--
  }
  return value.substring(0, index + 1)
}

export function trim (value, pad) {
  return trimEnd(trimStart(value, pad), pad)
}

export function trimString (value, pad, mode) {
  switch (mode) {
    case false:
      return value
    case 'left':
      return trimStart(value, pad)
    case 'right':
      return trimEnd(value, pad)
    default:
      return trim(value, pad)
  }
}
