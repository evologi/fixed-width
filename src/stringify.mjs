import os from 'node:os'
import { Transform } from 'node:stream'

import { FixedWidthError } from './error.mjs'
import { isAsyncIterable, isIterable, parseOptions } from './options.mjs'

export class Stringifier {
  static stream (options) {
    const stringifier = new Stringifier(options)

    return new Transform({
      allowHalfOpen: false,
      readableObjectMode: false,
      writableObjectMode: true,
      transform (chunk, encoding, callback) {
        let reason = null
        try {
          this.push(stringifier.write(chunk))
        } catch (err) {
          reason = err
        }
        callback(reason)
      },
      flush (callback) {
        let reason = null
        try {
          this.push(stringifier.end())
        } catch (err) {
          reason = err
        }
        callback(reason)
      }
    })
  }

  constructor (options) {
    this.options = parseOptions(options)
    if (!this.options.eol) {
      this.options = { ...this.options, eol: os.EOL }
    }
    this.line = 1
  }

  end () {
    this.line = 1
    return ''
  }

  write (obj) {
    let text = ''
    if (!this.options.eof && this.line > 1) {
      text += this.options.eol
    }
    text += stringifyFields(obj, this.options, this.line++)
    if (this.options.eof) {
      text += this.options.eol
    }
    return text
  }
}

export function stringify (input, options) {
  const stringifier = new Stringifier(options)

  if (Array.isArray(input)) {
    return Array.from(stringifyIterable(input, stringifier)).join('')
  } else if (isIterable(input)) {
    return stringifyIterable(input, stringifier)
  } else if (isAsyncIterable(input)) {
    return stringifyAsyncIterable(input, stringifier)
  } else {
    throw new TypeError('Expected array or iterable')
  }
}

function * stringifyIterable (iterable, stringifier) {
  for (const data of iterable) {
    yield stringifier.write(data)
  }
  const tail = stringifier.end()
  if (tail) {
    yield tail
  }
}

async function * stringifyAsyncIterable (iterable, stringifier) {
  for await (const data of iterable) {
    yield stringifier.write(data)
  }
  const tail = stringifier.end()
  if (tail) {
    yield tail
  }
}

export function stringifyFields (obj, options, line = 1) {
  obj = Object(obj)

  let text = ''.padEnd(options.width, options.pad)

  for (const field of options.fields) {
    text = replaceWith(
      text,
      stringifyField(obj, field, options, line),
      field.column - 1
    )
  }

  return text
}

export function replaceWith (text, value, index = 0) {
  const before = text.substring(0, index)
  const after = text.substring(index + value.length)
  return before + value + after
}

export function stringifyField (obj, field, options, line) {
  let value = obj[field.property]
  if (field.stringify) {
    value = field.stringify(value)
  }
  value = stringifyValue(value, options.encoding)

  if (typeof value !== 'string') {
    throw new FixedWidthError(
      'EXPECTED_STRING_VALUE',
      `Cannot cast to string value on position ${line}:${field.column}`,
      { line, column: field.column, width: field.width, value }
    )
  }

  if (value.length > field.width) {
    throw new FixedWidthError(
      'FIELD_VALUE_OVERFLOW',
      `Value on position ${line}:${field.column} overflow its width`,
      { line, column: field.column, width: field.width, value }
    )
  }

  if (field.align === 'right') {
    value = value.padStart(field.width, field.pad)
  } else {
    value = value.padEnd(field.width, field.pad)
  }

  return value
}

export function stringifyValue (value, encoding) {
  return Buffer.isBuffer(value)
    ? value.toString(encoding)
    : stringifyPrimitiveValue(
      typeof value === 'object' && value !== null
        ? value.valueOf()
        : value
    )
}

export function stringifyPrimitiveValue (value) {
  if (value === undefined || value === null) {
    return ''
  } else if (typeof value === 'boolean') {
    return value ? '1' : '0'
  } else if (typeof value === 'number' || typeof value === 'bigint') {
    return value.toString(10)
  } else {
    return value
  }
}
