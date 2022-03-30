import test from 'ava'

import { parseOptions } from './options.mjs'

test('defaults', t => {
  const options = parseOptions({
    eol: '\n',
    fields: [{ width: 2 }, { width: 2 }]
  })

  t.true(Buffer.isBuffer(options.eol))
  t.deepEqual(options, {
    encoding: 'utf8',
    eof: true,
    eol: options.eol,
    fields: [
      {
        align: 'left',
        column: 1,
        property: 0,
        width: 2
      },
      {
        align: 'left',
        column: 3,
        property: 1,
        width: 2
      }
    ],
    from: 1,
    output: 'array',
    pad: ' ',
    relax: false,
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
