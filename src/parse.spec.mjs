import test from 'ava'

import { parseOptions } from './options.mjs'
import { isMatching, parse, parseField, parseFields } from './parse.mjs'

test('parse field', t => {
  const options = parseOptions({
    fields: [{ column: 2, width: 3 }]
  })

  const buffer = Buffer.from('abcdefg')

  t.deepEqual(
    parseField(buffer, options.fields[0], options, 1),
    'bcd'
  )
})

test('parse array', t => {
  const options = parseOptions({
    fields: [{ width: 3 }, { width: 3 }, { width: 3 }],
    trim: 'right'
  })

  const buffer = Buffer.from(' a  b  c ')

  t.deepEqual(
    parseFields(buffer, options),
    [' a', ' b', ' c']
  )
})

test('parse object', t => {
  const options = parseOptions({
    fields: [
      {
        property: 'A',
        width: 3
      },
      {
        property: 'B',
        width: 3
      },
      {
        property: 'C',
        width: 3
      }
    ],
    trim: false
  })

  const buffer = Buffer.from(' a  b  c ')

  t.deepEqual(
    parseFields(buffer, options),
    {
      A: ' a ',
      B: ' b ',
      C: ' c '
    }
  )
})

test('eol match', t => {
  const eol = Buffer.from('\r\n')
  t.false(isMatching(Buffer.from('\n'), eol))
  t.false(isMatching(Buffer.from('\r'), eol))
  t.false(isMatching(Buffer.from('\n\r'), eol))
  t.true(isMatching(Buffer.from('\r\n'), eol))
  t.true(isMatching(Buffer.from('  \r\n  '), eol, 2))
  t.false(isMatching(Buffer.from(' '), eol, 2))
})

test('unexpected line length', t => {
  t.throws(
    () => parse(
      'test',
      [{ width: 42 }]
    ),
    { code: 'UNEXPECTED_LINE_LENGTH' }
  )
})
