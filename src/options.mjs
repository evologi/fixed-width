import os from 'os'

export function parseOptions (options) {
  if (Array.isArray(options)) {
    options = { fields: options }
  } else {
    options = Object(options)
  }

  const encoding = options.encoding || 'utf8'
  if (typeof encoding !== 'string') {
    throw new TypeError('Encoding must be a string')
  }

  const pad = options.pad || ' '
  if (typeof pad !== 'string') {
    throw new TypeError('Padding value (pad) must be a string')
  }
  if (getByteLength(pad, encoding) !== 1) {
    throw new Error('Padding value (pad) must be a single char (one byte)')
  }

  const eol = options.eol || os.EOL
  if (typeof eol !== 'string') {
    throw new TypeError('End of line (eol) value must be a string')
  }

  const from = options.from || 1
  if (!isPositiveInteger(from)) {
    throw new TypeError('Starting line (from) must be a positive integer')
  }

  const to = options.to || Number.POSITIVE_INFINITY
  if (!isPositiveInteger(to) && to !== Number.POSITIVE_INFINITY) {
    throw new TypeError('Ending line (to) must be a positive integer')
  }
  if (to < from) {
    throw new Error('Ending line (to) must be greater or equal to the starting line (from)')
  }

  const fields = parseFields(options.fields)
  const width = getWidth(fields)

  const properties = fields.reduce(
    (acc, field) => acc + (typeof field.property === 'number' ? 0 : 1),
    0
  )
  if (properties > 0 && properties < fields.length) {
    throw new Error('Target property must be specifier by all fields')
  }

  return {
    encoding,
    eof: options.eof !== false,
    eol: Buffer.from(eol, encoding),
    fields,
    from,
    output: properties > 0 ? 'object' : 'array',
    pad,
    relax: options.relax === true,
    to,
    trim: options.trim === 'left' || options.trim === 'right'
      ? options.trim
      : options.trim !== false,
    width
  }
}

function parseFields (items) {
  if (!Array.isArray(items)) {
    throw new TypeError('Fields option must be an array')
  }
  const fields = []
  let column = 1
  for (let i = 0; i < items.length; i++) {
    const field = parseField(items[i], i, column)
    fields.push(field)
    column += field.width
  }
  return fields
}

function parseField (field, index, defaultColumn) {
  if (typeof field !== 'object' || field === null) {
    throw new TypeError('Field definition must be an object')
  }
  if (!isPositiveInteger(field.width)) {
    throw new TypeError('Field width must be a positive integer')
  }

  const column = field.column || defaultColumn
  if (!isPositiveInteger(column)) {
    throw new TypeError('Field column must be a positive integer')
  }

  return {
    align: field.align === 'right' ? 'right' : 'left',
    column,
    property: isPropertyKey(field.property) ? field.property : index,
    width: field.width
  }
}

function getWidth (fields) {
  let analyzing = true
  let column = 1
  let count = 0

  while (analyzing) {
    const field = getNextField(fields, column)
    if (field) {
      column = field.column + field.width
      count++
    } else {
      analyzing = false
    }
  }

  if (count <= 0) {
    throw new Error('At least one field is required')
  }
  if (count < fields.length) {
    throw new Error('Some fields are overlapping')
  }

  return column - 1
}

function getNextField (fields, column) {
  const usable = fields.filter(item => item.column >= column)
  if (usable.length) {
    return usable.reduce((a, b) => a.column > b.column ? b : a)
  }
}

function isPositiveInteger (value) {
  return Number.isInteger(value) && value > 0
}

function isPropertyKey (value) {
  return typeof value === 'string' || typeof value === 'symbol'
}

export function trim (value, mode) {
  switch (mode) {
    case false:
      return value
    case 'left':
      return value.trimStart()
    case 'right':
      return value.trimEnd()
    default:
      return value.trim()
  }
}

function getByteLength (value, encoding) {
  return Buffer.byteLength(value, encoding)
}
