# fixed-width

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![ci](https://github.com/evologi/fixed-width/actions/workflows/ci.yaml/badge.svg?branch=master)](https://github.com/evologi/fixed-width/actions/workflows/ci.yaml)

A fixed-width file format toolset with streaming support and flexible options.

## Features

- **Flexible**: lot of options
- **Zero dependencies**: small footprint
- **Native streaming support**
- **Well tested**: code coverage above 90%
- **Support big datasets**: production ready
- **Native ESM support**: future proof
- **TypeScript support**

## Install

```
npm i @evologi/fixed-width
```

## Examples

### Parse

```javascript
import { parse } from '@evologi/fixed-width'

const text = 'alice       024\nbob         030\n'

// Buffers are working too!
const users = parse(text, {
  eol: '\n',
  fields: [
    {
      property: 'username',
      width: 12
    },
    {
      property: 'age',
      width: 3
    }
  ]
})

console.log(users) // [{ username: 'alice', age: '024' }, { username: 'bob', age: '030' }]
```

### Stringify

```javascript
import { stringify } from '@evologi/fixed-width'

const users = [
  { username: 'alice', age: 24 },
  { username: 'bob', age: 30 }
]

const text = stringify(users, {
  eol: '\n',
  fields: [
    {
      align: 'left',
      property: 'username',
      width: 12
    },
    {
      align: 'right',
      property: 'age',
      width: 3
    }
  ]
})

console.log(text) // 'alice        24\nbob          30'
```

### Parse with Node.js streams

```javascript
import { Parser } from '@evologi/fixed-width'

const stream = Parser.stream({
  eol: '\n',
  fields: [
    {
      property: 'username',
      width: 12
    },
    {
      property: 'age',
      width: 3
    }
  ]
})

stream
  .on('error', err => console.error(err))
  .on('data', data => console.log(data))
  .on('end', () => console.log('end'))

// Write any buffer or string
stream.write('alice       ')
stream.write('024')
stream.write('\n')
stream.write('bob         ')
stream.write('030')
stream.end()
```

### Stringify with Node.js streams

```javascript
import { Stringifier } from '@evologi/fixed-width'

const stream = Stringifier.stream({
  eol: '\n',
  fields: [
    {
      align: 'left',
      property: 'username',
      width: 12
    },
    {
      align: 'right',
      property: 'age',
      width: 3
    }
  ]
})

let text = ''

stream
  .on('error', err => console.error(err))
  .on('data', buffer => {
    text += buffer.toString()
  })
  .on('end', () => {
    console.log(text)
  })

stream.write({ username: 'alice', age: 24 })
stream.write({ username: 'bob', age: 30 })
stream.end()
```
