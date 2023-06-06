import os from 'os'
import { Transform } from 'stream'

import { FixedWidthError } from './error.mjs'
import { parseOptions } from './options.mjs'

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
          for (const text of stringifier.write([chunk])) {
            this.push(text)
          }
        } catch (err) {
          reason = err
        }
        callback(reason)
      },
      flush (callback) {
        let reason = null
        try {
          this.push(Array.from(stringifier.end()).join(''))
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
    return [] // empty iterable (this method just reset the internal status)
  }

  * write (iterable) {
    for (const item of iterable) {
      let text = ''
      if (!this.options.eof && this.line > 1) {
        text += this.options.eol
      }
      text += stringifyFields(item, this.options, this.line++)
      if (this.options.eof) {
        text += this.options.eol
      }
      yield text
    }
  }
}

export function stringify (iterable, options) {
  const stringifier = new Stringifier(options)
  return Array
    .from(stringifier.write(iterable))
    .concat(Array.from(stringifier.end()))
    .join('')
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
  let value = stringifyValue(obj[field.property], options.encoding)
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
