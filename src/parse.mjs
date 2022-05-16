import { Transform } from 'stream'

import { FixedWidthError } from './error.mjs'
import { parseOptions } from './options.mjs'

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
    this.buffer = Buffer.alloc(0)
    this.line = 1
    this.options = parseOptions(options)
  }

  * end () {
    if (this.buffer.byteLength > 0) {
      yield parseFields(
        this.buffer,
        this.options,
        this.line++
      )
    }

    this.buffer = Buffer.alloc(0)
    this.line = 1
  }

  * write (input) {
    let buffer = Buffer.concat([
      this.buffer,
      Buffer.isBuffer(input)
        ? input
        : Buffer.from(input, this.options.encoding)
    ])

    if (!this.options.eol.byteLength) {
      const eol = guessEndOfLine(buffer)
      if (eol) {
        this.options.eol = eol
      }
    }

    if (this.options.eol.byteLength > 0) {
      let index = 0

      while (index < buffer.byteLength) {
        if (isMatching(buffer, this.options.eol, index)) {
          const line = this.line++

          if (line >= this.options.from && line <= this.options.to) {
            yield parseFields(
              buffer.subarray(0, index),
              this.options,
              line
            )
          }

          buffer = buffer.subarray(index + this.options.eol.byteLength)
          index = 0
        } else {
          index++
        }
      }
    }

    this.buffer = buffer
  }
}

export function parse (input, options) {
  const parser = new Parser(options)
  return Array.from(parser.write(input)).concat(Array.from(parser.end()))
}

export function parseFields (buffer, options, line = 1) {
  if (buffer.byteLength !== options.width && !options.relax) {
    throw new FixedWidthError(
      'UNEXPECTED_LINE_LENGTH',
      `Line ${line} has an unexpected lenght`,
      { line, value: buffer.toString(options.encoding) }
    )
  }

  if (options.output === 'object') {
    return options.fields.reduce(
      (acc, field) => set(
        acc,
        field.property,
        parseField(buffer, field, options, line)
      ),
      {}
    )
  } else {
    return options.fields.map(
      field => parseField(buffer, field, options, line)
    )
  }
}

export function parseField (buffer, field, options, line) {
  const index = field.column - 1

  const value = trimString(
    buffer
      .subarray(index, index + field.width)
      .toString(options.encoding),
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

const lf = 0x0a; // \n byte, Line Feed
const cr = 0x0d; // \r byte, Carriage Return

export function guessEndOfLine (buffer) {
  for (let i = 0; i < buffer.byteLength; i++) {
    const char = buffer[i]

    if (char === lf) {
      return Buffer.from('\n')
    } else if (char === cr) {
      if (buffer[i + 1] === lf) {
        return Buffer.from('\r\n')
      } else {
        return Buffer.from('\r')
      }
    }
  }
}

export function isMatching (buffer, eol, offset = 0) {
  let index = 0
  while (index < eol.byteLength && buffer[index + offset] === eol[index]) {
    index++
  }
  return index >= eol.byteLength
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
