import test from 'ava'

import { parseOptions } from './options.mjs'
import {
  guessEndOfLine,
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

  t.deepEqual(
    parseField('abcdefg', options.fields[0], options, 1),
    'bcd'
  )
})

test('parse uft8', t => {
  const items = parse('àà\nèè\nìì\nòò\nùù', {
    fields: [
      { width: 2 }
    ]
  })
  t.deepEqual(items, [['àà'], ['èè'], ['ìì'], ['òò'], ['ùù']])
})

test('parse array', t => {
  const options = parseOptions({
    fields: [{ width: 3 }, { width: 3 }, { width: 3 }],
    trim: 'right'
  })

  t.deepEqual(
    parseFields(' a  b  c ', options),
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

  t.deepEqual(
    parseFields(' a  b  c ', options),
    {
      A: ' a ',
      B: ' b ',
      C: ' c '
    }
  )
})

test('unexpected line length', t => {
  const fields = [{ width: 42 }]
  t.throws(
    () => parse(
      'test',
      {
        allowLongerLines: true,
        allowShorterLines: false,
        fields
      }
    ),
    { code: 'UNEXPECTED_LINE_LENGTH' }
  )
  t.throws(
    () => parse(
      'A towel, it says, is about the most massively useful thing an interstellar hitchhiker can have.',
      {
        allowLongerLines: false,
        allowShorterLines: true,
        fields
      }
    ),
    { code: 'UNEXPECTED_LINE_LENGTH' }
  )
})

test('parse and cast', t => {
  t.plan(3)

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
    parseFields('--0420', options),
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
  t.is(guessEndOfLine('asdasd'), undefined)
  t.is(guessEndOfLine('asd\rasd'), '\r')
  t.is(guessEndOfLine('asd\r\nasd'), '\r\n')
  t.is(guessEndOfLine('asd\nasd'), '\n')
  t.is(guessEndOfLine('asd\n\rasd'), '\n')
  t.is(guessEndOfLine('asd\r'), undefined) // could be Windows
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
