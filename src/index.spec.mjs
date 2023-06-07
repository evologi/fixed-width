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
    Array.from(parser.write('helloworld\r')),
    []
  )

  t.is(parser.line, 1)
  t.deepEqual(
    Array.from(parser.write('\n')),
    [{ a: 'hello', b: 'world' }]
  )

  t.is(parser.line, 2)
  t.deepEqual(
    Array.from(parser.write('worldhello\r\n')),
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
    eof: true,
    eol: '\r\n',
    fields: [
      { align: 'left', property: 'a', width: 10 },
      { align: 'right', property: 'b', width: 10 },
      { align: 'left', property: 'c', width: 10 }
    ]
  })
  t.is(stringifier.line, 1)

  t.is(
    stringifier.write(
      { a: 'Harry', b: 'Ron', c: 'Hermione' },
    ),
    'Harry            RonHermione  \r\n'
  )
  t.is(stringifier.line, 2)

  t.is(
    stringifier.write(
      { a: 'Blossom', b: 'Bubbles', c: 'Buttercup' }
    ),
    'Blossom      BubblesButtercup \r\n'
  )
  t.is(stringifier.line, 3)

  t.is(
    stringifier.write(
      { a: 'Tom', b: null, c: 'Jerry' }
    ),
    'Tom                 Jerry     \r\n'
  )
  t.is(stringifier.line, 4)

  t.is(
    stringifier.end(),
    ''
  )
  t.is(stringifier.line, 1)
})

test('parse', t => {
  t.deepEqual(
    parse(
      'helloworld\r\nworldhello\r\nohno!',
      {
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
      { a: true, b: 42 },
      { a: 'test', b: { valueOf: () => 'yeppa' } }
    ]),
    Stringifier.stream({
      eol: '\n',
      eof: false,
      fields: [
        { align: 'left', property: 'a', width: 5 },
        { align: 'right', pad: '0', property: 'b', width: 5 }
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

  t.is(text, '1    00042\ntest yeppa')
})
