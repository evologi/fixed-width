# fixed-width

[![npm](https://img.shields.io/npm/v/@evologi/fixed-width)](https://www.npmjs.com/package/@evologi/fixed-width)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/@evologi/fixed-width)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![ci](https://github.com/evologi/fixed-width/actions/workflows/ci.yaml/badge.svg?branch=master)](https://github.com/evologi/fixed-width/actions/workflows/ci.yaml)

A fixed-width file format toolset with streaming support and flexible options.

- [Features](#features)
- [File format specs](#fixed-width-file-format)
- [Install](#install)
- [Usage](#usage)
  - [In memory parsing](#parsestringorbuffer-options)
  - [Parse with Node.js streams](#parserstreamoptions)
  - [Custom parsing](#new-parseroptions)
  - [In memory serializing](#stringifyiterable-options)
  - [Serialize with Node.js streams](#stringifierstreamoptions)
  - [Custom serializing](#new-stringifieroptions)
- [Options](#options)
- [Errors](#errors)

## Features

- **Flexible**: lots of options
- **Zero dependencies**: small footprint
- **Native streaming support**
- **Well tested**: code coverage above 90%
- **Support big datasets**: production ready
- **Native ESM support**: future proof
- **TypeScript support**

## Fixed width file format

The fixed-width file format is a simple method to store data on a file. A separator divides rows (typically a newline char), and all fields have a fixed width on the row.

This format is useful to seek data directly from the file without any parsing procedure, but It has no compression mechanism. This limit will result in an over-usage of memory (both RAM and disk) to store the same data with other file formats (like JSON or XML).

But, in the year [insert current year here] A.D., you can still find someone using such file format. Fear not, my friend! This Node.js library will provide a toolset to parse and generate fixed-width files.

### Example file

The next section will contain an example of fixed-width data with two fields: username and age. The first field has a width of 12 chars, and the second one has a width of 3 chars right-aligned.

```
username    age
alice       024
bob         030
```

## Install

```
npm i @evologi/fixed-width
```

## Usage

```javascript
import { parse, stringify, Parser, Stringifier } from '@evologi/fixed-width'
```

### `parse(stringOrBuffer, options)`

It parses a text or a buffer into an array of elements.

- `stringOrBuffer` `<String> | <Buffer>` The raw data to parse.
- `options` `<Object>` See [options section](#options).
- Returns: `<Array>`

```javascript
import { parse } from '@evologi/fixed-width'

const text = 'alice       024\nbob         030\n'

const users = parse(text, {
  eol: '\n',
  fields: [
    {
      property: 'username',
      width: 12
    },
    {
      cast: value => parseInt(value, 10),
      property: 'age',
      width: 3
    }
  ]
})

// [{ username: 'alice', age: 24 }, { username: 'bob', age: 30 }]
console.log(users)
```

### `stringify(iterable, options)`

It serializes an array of elements into a string.

- `iterable` `<Iterable>` An [iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators) that produces the elements to serialize. Arrays are iterable.
- `options` `<Object>` See [options section](#options).
- Returns: `<String>`

```javascript
import { stringify } from '@evologi/fixed-width'

const users = [
  { username: 'alice', age: 24 },
  { username: 'bob', age: 30 }
]

const text = stringify(users, {
  eof: true,
  eol: '\n',
  fields: [
    {
      align: 'left',
      property: 'username',
      width: 12
    },
    {
      align: 'right',
      pad: '0',
      property: 'age',
      width: 3
    }
  ]
})

// 'alice       024\nbob         030\n'
console.log(text)
```

### `Parser.stream(options)`

It returns a [`Transform stream`](https://nodejs.org/api/stream.html#class-streamtransform) that accepts strings (or buffers) as input and emits the parsed elements.

- `options` `<Object>` See [options section](#options).
- Returns: [`<Transform>`](https://nodejs.org/api/stream.html#class-streamtransform)

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
      cast: value => parseInt(value, 10),
      property: 'age',
      width: 3
    }
  ]
})

stream
  .on('error', err => console.error(err))
  .on('data', data => console.log(data))
  .on('end', () => console.log('end'))

stream.write('alice       024\nbob         030')
stream.end()
```

### `Stringifier.stream(options)`

It returns a [`Transform stream`](https://nodejs.org/api/stream.html#class-streamtransform) that accepts objects (o arrays) as input and emits the serialized data chunks (buffers).

- `options` `<Object>` See [options section](#options).
- Returns: [`<Transform>`](https://nodejs.org/api/stream.html#class-streamtransform)

```javascript
import { Stringifier } from '@evologi/fixed-width'

const stream = Stringifier.stream({
  eof: true,
  eol: '\n',
  fields: [
    {
      align: 'left',
      property: 'username',
      width: 12
    },
    {
      align: 'right',
      pad: '0',
      property: 'age',
      width: 3
    }
  ]
})

let text = ''

stream
  .on('error', err => console.error(err))
  .on('data', buffer => { text += buffer.toString() })
  .on('end', () => {
    // 'alice       024\nbob         030\n'
    console.log(text)
  })

stream.write({ username: 'alice', age: 24 })
stream.write({ username: 'bob', age: 30 })
stream.end()
```

### `new Parser(options)`

It creates a `Parser` instance. This object is useful when a custom optimized procedure is necessary. This object is used internally by the Node.js stream and the `parse()` function.

- `options` `<Object>` See [options section](#options).
- Returns: `<Parser>`

It consists of only two methods, and all those methods are strictly synchronous.

#### `Parser#write(stringOrBuffer)`

It accepts a string or a buffer as input and returns an iterable that outputs all parsed objects up to the last completed row (line).

- `stringOrBuffer` `<String> | <Buffer>`
- Returns: `<Iterable>`

#### `Parser#end()`

It resets the `Parser` status and returns an iterable that could output other objects contained on the last partial row (line). See [`relax`](#relax) option.

- Returns: `<Iterable>`

```javascript
import { Parser } from '@evologi/fixed-width'

const parser = new Parser({
  eol: '\n',
  fields: [
    {
      property: 'username',
      width: 12
    },
    {
      cast: value => parseInt(value, 10),
      property: 'age',
      width: 3
    }
  ]
})

const users = Array.from(
  parser.write('alice       024\nbob         030')
).concat(
  Array.from(
    parser.end()
  )
)

// [{ username: 'alice', age: 24 }, { username: 'bob', age: 30 }]
console.log(users)
```

### `new Stringifier(options)`

It creates a `Stringifier` instance. This object is useful when a custom optimized procedure is necessary. This object is used internally by the Node.js stream and the `stringify()` function.

- `options` `<Object>` See [options section](#options).
- Returns: `<Stringifier>`

It consists of only two methods, and all those methods are strictly synchronous.

#### `Stringifier#write(iterable)`

It accepts an iterable of objects and returns a serialized buffer up to the last serializable object.

- `iterable` `<Iterable>`
- Returns: `<Buffer>`

#### `Stringifier#end()`

It resets the `Stringifier` status and returns the closing buffer.

- Returns: `<Buffer>`

```javascript
import { Stringifier } from '@evologi/fixed-width'

const stringifier = new Stringifier({
  eof: true,
  eol: '\n',
  fields: [
    {
      align: 'left',
      property: 'username',
      width: 12
    },
    {
      align: 'right',
      pad: '0',
      property: 'age',
      width: 3
    }
  ]
})

const buffer = Buffer.concat([
  stringifier.write([
    { username: 'alice', age: 24 },
    { username: 'bob', age: 30 }
  ]),
  stringifier.end()
])

// 'alice       024\nbob         030\n'
console.log(buffer.toString(stringifier.options.encoding))
```

## Options

### `encoding`

Type: `<String>`

Default: `"uft8"`

The encoding used to handle strings and buffers. Only [Node.js encodings](https://nodejs.org/api/buffer.html#buffers-and-character-encodings) are supported.

### `eol`

Type: `<String>`

The **E**nd **O**f **L**ine character that divides record rows.
It will defautl to [`os.EOL`](https://nodejs.org/api/os.html#oseol) for serialization.
For parsing, the `Parser` will try to guess the correct line separator.

### `eof`

Type: `<Boolean>`

Default: `true`

Appends the **E**nd **O**f **F**ile char. If `true`, an [End Of Line](#eol) character is added at the end of the file.

### `pad`

Type: `string`

Default: `" "`

Values shorter than their field's width will be padded with this value while serializing. It's also the trimming value removed while parsing.

See [`trim`](#trim), [`field.pad`](#fieldpad), and [`field.align`](#fieldalign) options.

### `trim`

Type: `<Boolean> | <String>`

Default: `true`

It enables or disabled values' trimming while parsing. You can also specify partial trims with `"left"` and `"right"` values. A `false` value will disable trimming.

> The trimmed value corresponds to the field's [padding value](#pad).
```javascript
trim('004200', { pad: '0', trim: 'right' })
// the trimmed value will be '0042'
```

### `from`

Type: `<Number>`

Default: `1`

The first line to consider while parsing (inclusive). It is a **1-based** integer (one is the first line).

### `to`

Type: `<Number>`

Default: `Infinity`

The last line to consider while parsing (inclusive). It is a **1-based** integer (one is the first line).

### `relax`

Type: `<Boolean>`

Default: `false`

If `true`, partial lines are parsed without throwing an error.

### `fields`

Type: `<Array>`

This option is the only required one. It contains the specs for all the fields.

#### `field.align`

Type: `<String>`

Default: `"left"`

Field's value alignment. Can be `"left"` or `"right"`.

#### `field.cast`

Type: `<Function>`

A casting function that accepts the raw string value and returns the parsed one. It also provides a context object as second argument. Only used while parsing.

```javascript
const options = {
  fields: [
    {
      width: 5,
      cast: (value, ctx) => {
        // value is always a string
        // ctx = { column: 1, line: 1, width: 5 }
        return parseInt(value)
      }
    }
  ]
}
```

#### `field.column`

Type: `<Number>`

Field's columns. This is **1-based** value (one is the first column). It defaults to the sum of all the previously defined fields' widths.

#### `field.pad`

Type: `<Number>`

Field level padding value. It defaults to the [global](#pad) one.

#### `field.property`

Type: `<String> | <Symbol>`

This option controls the expected format of both input and output objects.

##### Parsing

By defining this option, the `Parser` will emit objects. If the option is omitted, the emitted values will be arrays.

##### Serializing

By defining this option, the `Stringifier` will expect objects. If the option is omitted, the expected values will be arrays.

#### `field.width`

Type: `<Number>`

Field's width. Required.

## Errors

All errors that can occur during the parsing or serializing phase contain an error code. Error objects also contain enough info (properties) to debug the problem.

### `UNEXPECTED_LINE_LENGTH`

This error is raised when a partial line is found. You can suppress this error with the [`relax`](#relax) option.

### `EXPECTED_STRING_VALUE`

This error is raised when a value cannot be serialized into a string.

### `FIELD_VALUE_OVERFLOW`

This error is raised when a string value has a width that exceeds its field's width.
