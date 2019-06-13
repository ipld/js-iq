/* globals it */
const Block = require('@ipld/block')
const assert = require('assert')
const tsame = require('tsame')
const iq = require('../')

const same = (...args) => assert.ok(tsame(...args))
const test = it

test('get string kind, single block', async () => {
  let block = Block.encoder({ one: { two: { three: 'hello world' } } }, 'dag-json')
  let str = await iq(block, 'one/two/three').toString()
  same(str, 'hello world')
})

test('sub queries', async () => {
  let block = Block.encoder({ one: { two: { three: 'hello world' } } }, 'dag-json')
  let str = await iq(block).q('one').q('two').q('three').toString()
  same(str, 'hello world')
})
