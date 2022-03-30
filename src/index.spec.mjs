import test from 'ava'
import { Readable, Writable, pipeline } from 'stream'
import { promisify } from 'util'

import { Parser, Stringifier, parse, stringify } from './index.mjs'

const pump = promisify(pipeline)

test('Parser', t => {
  const parser = new Parser({
    eol: '\r\n',
    fields: [
      { property: 'a', width: 5 },
      { property: 'b', width: 5 }
    ]
  })

  t.is(parser.line, 1)
  t.deepEqual(
    Array.from(parser.write(Buffer.from('helloworld\r'))),
    []
  )

  t.is(parser.line, 1)
  t.deepEqual(
    Array.from(parser.write(Buffer.from('\n'))),
    [{ a: 'hello', b: 'world' }]
  )

  t.is(parser.line, 2)
  t.deepEqual(
    Array.from(parser.write(Buffer.from('worldhello\r\n'))),
    [{ a: 'world', b: 'hello' }]
  )

  t.is(parser.line, 3)
  t.deepEqual(
    Array.from(parser.end()),
    []
  )

  t.is(parser.line, 1)
})

test('Stringifier', t => {
  const stringifier = new Stringifier({
    eol: '\r\n',
    fields: [
      { align: 'left', property: 'a', width: 10 },
      { align: 'right', property: 'b', width: 10 },
      { align: 'left', property: 'c', width: 10 }
    ]
  })

  t.is(stringifier.line, 1)
  t.is(
    stringifier
      .write([
        { a: 'Harry', b: 'Ron', c: 'Hermione' },
        { a: 'Blossom', b: 'Bubbles', c: 'Buttercup' }
      ])
      .toString(),
    'Harry            RonHermione  \r\nBlossom      BubblesButtercup '
  )

  t.is(stringifier.line, 3)
  t.is(
    stringifier
      .write([])
      .toString(),
    ''
  )

  t.is(stringifier.line, 3)
  t.is(
    stringifier
      .write([{ a: 'Tom', b: null, c: 'Jerry' }])
      .toString(),
    '\r\nTom                 Jerry     '
  )

  t.is(stringifier.line, 4)
  t.is(
    stringifier.end().toString(),
    '\r\n'
  )

  t.is(stringifier.line, 1)
})

test('parse', t => {
  t.deepEqual(
    parse(
      'helloworld\nworldhello\nohno!',
      {
        eol: '\n',
        relax: true,
        fields: [
          {
            property: 'a',
            width: 5
          },
          {
            property: 'b',
            width: 5
          }
        ]
      }
    ),
    [
      {
        a: 'hello',
        b: 'world'
      },
      {
        a: 'world',
        b: 'hello'
      },
      {
        a: 'ohno!',
        b: ''
      }
    ]
  )
})

test('stringify', t => {
  t.is(
    stringify(
      [
        [42, true],
        [69, false]
      ],
      {
        eof: false,
        eol: '\n',
        fields: [
          { align: 'right', width: 2 },
          { align: 'right', width: 2 }
        ]
      }
    ).toString(),
    '42 1\n69 0'
  )
})

test('parse stream', async t => {
  const items = []

  await pump(
    Readable.from([
      Buffer.from(' qwe  rty '),
      Buffer.from('\n'),
      Buffer.from(' asd  fgh ')
    ]),
    Parser.stream({
      eol: '\n',
      fields: [
        { property: 'a', width: 5 },
        { property: 'b', width: 5 }
      ]
    }),
    new Writable({
      objectMode: true,
      write (chunk, encoding, callback) {
        items.push(chunk)
        callback()
      }
    })
  )

  t.deepEqual(items, [
    { a: 'qwe', b: 'rty' },
    { a: 'asd', b: 'fgh' }
  ])
})

test('stringify stream', async t => {
  let text = ''

  await pump(
    Readable.from([
      { a: 42, b: true },
      { a: 'test', b: { valueOf: () => 'yeppa' } }
    ]),
    Stringifier.stream({
      eol: '\n',
      eof: false,
      fields: [
        { align: 'left', property: 'a', width: 5 },
        { align: 'right', property: 'b', width: 5 }
      ]
    }),
    new Writable({
      objectMode: false,
      write (chunk, encoding, callback) {
        text += chunk.toString()
        callback()
      }
    })
  )

  t.is(text, '42       1\ntest yeppa')
})
