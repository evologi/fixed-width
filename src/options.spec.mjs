import test from 'ava'

import { isAsyncIterable, isIterable, parseOptions } from './options.mjs'

test('defaults', t => {
  const options = parseOptions({
    eol: '\n',
    fields: [{ width: 2 }, { width: 2 }]
  })

  t.deepEqual(options, {
    allowLongerLines: true,
    allowShorterLines: false,
    encoding: 'utf8',
    eof: true,
    eol: '\n',
    fields: [
      {
        align: 'left',
        cast: null,
        column: 1,
        pad: ' ',
        property: 0,
        stringify: null,
        width: 2
      },
      {
        align: 'left',
        cast: null,
        column: 3,
        pad: ' ',
        property: 1,
        stringify: null,
        width: 2
      }
    ],
    from: 1,
    output: 'array',
    pad: ' ',
    skipEmptyLines: true,
    to: Number.POSITIVE_INFINITY,
    trim: true,
    width: 4
  })
})

test('validation', t => {
  t.throws(() => parseOptions(null))
  t.throws(() => parseOptions({}))
  t.throws(() => parseOptions({ encoding: {} }))
  t.throws(() => parseOptions({ pad: {} }))
  t.throws(() => parseOptions({ pad: '  ' }))
  t.throws(() => parseOptions({ eol: {} }))
  t.throws(() => parseOptions([]))
  t.throws(() => parseOptions({ from: -1 }))
  t.throws(() => parseOptions({ to: -1 }))
  t.throws(() => parseOptions({ from: 10, to: 2 }))
  t.throws(() => parseOptions([{ property: 'a', width: 1 }, { width: 1 }]))
  t.throws(() => parseOptions({ fields: null }))
  t.throws(() => parseOptions({ fields: [null] }))
  t.throws(() => parseOptions([{ width: 0 }]))
  t.throws(() => parseOptions([{ width: 1, column: -1 }]))
  t.throws(() => parseOptions([
    { column: 1, width: 1 },
    { column: 1, width: 1 }
  ]))
})

test('isIterable', t => {
  t.false(isIterable(null))
  t.false(isIterable('test'))
  t.false(isIterable({}))
  t.true(isIterable([]))
})

test('isAsyncIterable', t => {
  t.false(isAsyncIterable(null))
  t.false(isAsyncIterable('test'))
  t.false(isAsyncIterable({}))
  t.false(isAsyncIterable([]))
})
