import test from 'ava'

import { trimEnd, trimStart, trimString } from './util.mjs'

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
