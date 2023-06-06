import test from 'ava'

import { parseOptions } from './options.mjs'
import { stringify, stringifyFields, stringifyValue } from './stringify.mjs'

test('stringify value', t => {
  t.is(stringifyValue(false), '0')
  t.is(stringifyValue(true), '1')
  t.is(stringifyValue(NaN), 'NaN')
  t.is(stringifyValue(42n), '42')
  t.is(stringifyValue(42), '42')
  t.is(stringifyValue(new Date(42)), '42')
  t.is(stringifyValue('test'), 'test')
})

test('stringify fields', t => {
  const options = parseOptions([
    {
      align: 'right',
      column: 1,
      property: 'a',
      width: 5
    },
    {
      align: 'left',
      column: 7,
      property: 'b',
      width: 5
    }
  ])

  const values = {
    a: 1.3,
    b: new Date(42)
  }

  const text = stringifyFields(values, options)
  t.is(text, '  1.3 42   ')
})

test('expected string value', t => {
  t.throws(
    () => stringify(
      [{ value: {} }],
      [{ property: 'value', width: 2 }]
    ),
    { code: 'EXPECTED_STRING_VALUE' }
  )
})

test('field value overflow', t => {
  t.throws(
    () => stringify(
      [{ value: 'oh no' }],
      [{ property: 'value', width: 2 }]
    ),
    { code: 'FIELD_VALUE_OVERFLOW' }
  )
})

test('field level padding', t => {
  const options = parseOptions([
    {
      align: 'left',
      pad: '-',
      width: 6
    },
    {
      align: 'right',
      pad: '0',
      width: 4
    }
  ])

  const buffer = stringifyFields(
    ['test', 42],
    options
  )

  t.is(buffer.toString(), 'test--0042')
})

test('stringify utf8', t => {
  const text = stringify(
    [
      ['àà'],
      ['èè'],
      ['ìì'],
      ['òò'],
      ['ùù']
    ],
    {
      eol: '\n',
      eof: false,
      fields: [
        { width: 2 }
      ]
    }
  )

  t.is(text, 'àà\nèè\nìì\nòò\nùù')
})
