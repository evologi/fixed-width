import { Transform } from 'stream'

import { FixedWidthError } from './error.mjs'
import { parseOptions } from './options.mjs'
import { trimString } from './util.mjs'

export class Stringifier {
  static stream (options) {
    const stringifier = new Stringifier(options)

    return new Transform({
      allowHalfOpen: false,
      readableObjectMode: false,
      writableObjectMode: true,
      transform (chunk, encoding, callback) {
        this.push(stringifier.write([chunk]))
        callback()
      },
      flush (callback) {
        this.push(stringifier.end())
        callback()
      }
    })
  }

  constructor (options) {
    this.line = 1
    this.options = parseOptions(options)
  }

  end () {
    this.line = 1
    if (this.options.eof) {
      return Buffer.from(this.options.eol)
    } else {
      return Buffer.alloc(0)
    }
  }

  write (iterable) {
    const chunks = []
    for (const item of iterable) {
      const line = this.line++
      if (line > 1) {
        chunks.push(this.options.eol)
      }
      chunks.push(stringifyFields(item, this.options, line))
    }
    return Buffer.concat(chunks)
  }
}

export function stringify (iterable, options) {
  const stringifier = new Stringifier(options)
  return Buffer.concat([
    stringifier.write(iterable),
    stringifier.end()
  ]).toString(options.encoding)
}

export function stringifyFields (values, options, line = 1) {
  values = Object(values)
  const buffer = Buffer.alloc(options.width, options.pad, options.encoding)
  for (const field of options.fields) {
    buffer.write(
      stringifyField(values, field, options, line),
      field.column - 1,
      field.width,
      options.encoding
    )
  }
  return buffer
}

export function stringifyField (values, field, options, line) {
  let value = stringifyValue(values[field.property])
  if (typeof value !== 'string') {
    throw new FixedWidthError(
      'EXPECTED_STRING_VALUE',
      `Cannot cast to string value on position ${line}:${field.column}`,
      { line, column: field.column, width: field.width, value }
    )
  }

  value = trimString(value, field.pad, options.trim)
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

export function stringifyValue (value) {
  return stringifyPrimitiveValue(
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
