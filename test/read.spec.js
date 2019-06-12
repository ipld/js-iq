/* globals it */
const Block = require('@ipld/block')
const assert = require('assert')
const tsame = require('tsame')
const iq = require('../')

const same = (...args) => assert.ok(tsame(...args))
const test = it

test('read bytes, single block', async () => {
  let block = Block.encoder({ one: { two: { three: Buffer.from('hello world') } } }, 'dag-json')
  let buffer = await iq(block, 'one/two/three').read()
  same(buffer, Buffer.from('hello world'))
})

test('read number', async () => {
  let block = Block.encoder({ size: 12 }, 'dag-json')
  let num = await iq(block, 'size').number()
  same(num, 12)
})

test('read integer', async () => {
  let block = Block.encoder({ size: 12 }, 'dag-json')
  let num = await iq(block, 'size').int()
  same(num, 12)
})

test('read byte length', async () => {
  let block = Block.encoder({ hello: Buffer.from('world') }, 'dag-json')
  let num = await iq(block, 'hello').length()
  same(num, 5)
})
