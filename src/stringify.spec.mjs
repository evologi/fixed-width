import test from 'ava'

import { isAsyncIterable, isIterable, parseOptions } from './options.mjs'
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

test('stringify with custom stringifier', t => {
  const options = parseOptions([
    {
      align: 'left',
      property: 'b',
      width: 10,
      stringify: (date) => {
        // Sample formatting that writes the date in American format (MM/DD/YYYY)
        const year = (date.getYear() + 1900).toString()
        const month = date.getMonth().toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        const result = `${month}/${day}/${year}`
        return result
      }
    }
  ])

  const values = {
    b: new Date(2020, 3, 15)
  }

  const text = stringifyFields(values, options)
  t.is(text, '03/15/2020')
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

test('in-memory stringify', t => {
  const options = {
    eol: '\n',
    eof: false,
    fields: [
      {
        property: 'value',
        width: 2
      }
    ]
  }

  t.is(
    stringify([{ value: 42 }], options),
    '42'
  )
})

test('stringify iterable', t => {
  t.plan(7)

  const options = {
    eol: '\n',
    eof: false,
    fields: [
      {
        property: 'value',
        width: 2
      }
    ]
  }

  const input = {
    [Symbol.iterator] () {
      t.pass()
      let done = false
      return {
        next () {
          t.pass()
          if (done) {
            return { done: true }
          } else {
            done = true
            return { done: false, value: { value: 42 } }
          }
        }
      }
    }
  }

  const output = stringify(input, options)
  t.false(Array.isArray(output))
  t.true(isIterable(output))
  t.false(isAsyncIterable(output))

  t.is(
    Array.from(output).join(''),
    '42'
  )
})

test('stringify async iterable', async t => {
  t.plan(7)

  const options = {
    eol: '\n',
    eof: false,
    fields: [
      {
        property: 'value',
        width: 2
      }
    ]
  }

  const input = {
    [Symbol.asyncIterator] () {
      t.pass()
      let done = false
      return {
        next () {
          t.pass()
          if (done) {
            return Promise.resolve({ done: true })
          } else {
            done = true
            return Promise.resolve({ done: false, value: { value: 42 } })
          }
        }
      }
    }
  }

  const output = stringify(input, options)
  t.false(Array.isArray(output))
  t.false(isIterable(output))
  t.true(isAsyncIterable(output))

  let text = ''
  for await (const data of output) {
    text += data
  }
  t.is(text, '42')
})
