import test from 'ava'

import { parseOptions } from './options.mjs'
import {
  guessEndOfLine,
  isMatching,
  parse,
  parseField,
  parseFields,
  trimEnd,
  trimStart,
  trimString
} from './parse.mjs'

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

test('parse and cast', t => {
  t.plan(3)

  const buffer = Buffer.from('--0420')

  const options = parseOptions({
    fields: [
      {
        width: 2
      },
      {
        pad: '0',
        cast: (value, context) => {
          t.is(value, '42')
          t.deepEqual(context, {
            column: 3,
            line: 1,
            width: 4
          })
          return parseInt(value)
        },
        width: 4
      }
    ]
  })

  t.deepEqual(
    parseFields(buffer, options),
    ['--', 42]
  )
})

test('trimStart', t => {
  t.is(trimStart('42', '0'), '42')
  t.is(trimStart('0042', '0'), '42')
  t.is(trimStart('4200', '0'), '4200')
  t.is(trimStart('004200', '0'), '4200')
})

test('trimEnd', t => {
  t.is(trimEnd('42', '0'), '42')
  t.is(trimEnd('0042', '0'), '0042')
  t.is(trimEnd('4200', '0'), '42')
  t.is(trimEnd('004200', '0'), '0042')
})

test('trimString', t => {
  t.is(trimString('004200', '0', true), '42')
  t.is(trimString('004200', '0', false), '004200')
  t.is(trimString('004200', '0', 'left'), '4200')
  t.is(trimString('004200', '0', 'right'), '0042')
})

test('guessEndOfLine', t => {
  t.is(guessEndOfLine(Buffer.from('asdasd')), undefined)
  t.is(guessEndOfLine(Buffer.from('asd\rasd')).toString(), '\r')
  t.is(guessEndOfLine(Buffer.from('asd\r\nasd')).toString(), '\r\n')
  t.is(guessEndOfLine(Buffer.from('asd\nasd')).toString(), '\n')
  t.is(guessEndOfLine(Buffer.from('asd\n\rasd')).toString(), '\n')
})

test('partial width parsing', t => {
  const text = 'qwerty\nasdfgh\n'

  const items = parse(text, {
    fields: [
      { column: 2, width: 1 },
      { column: 5, width: 1 }
    ]
  })

  t.deepEqual(items, [
    ['w', 't'],
    ['s', 'g']
  ])
})
