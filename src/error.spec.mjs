import test from 'ava'

import { FixedWidthError } from './error.mjs'

test('error', t => {
  const error = new FixedWidthError(
    'TEST_ERROR',
    'Oh no',
    { line: 1, column: 1, width: 1 }
  )

  t.is(error.message, 'Oh no')
  t.is(error.line, 1)
  t.is(error.column, 1)
  t.is(error.width, 1)
  t.is(error + '', 'FixedWidthError [TEST_ERROR]: Oh no')
  t.is(Object.prototype.toString.call(error), '[object Error]')
})
