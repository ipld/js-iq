/* globals it */
const Block = require('@ipld/block')
const assert = require('assert')
const tsame = require('tsame')
const iq = require('../')

const same = (...args) => assert.ok(tsame(...args))
const test = it

test('exists', async () => {
  let block = Block.encoder({ one: { two: { three: 'hello world' } } }, 'dag-json')
  let _exists = await iq(block, 'one/two/three').exists()
  same(_exists, true)
  _exists = await iq(block, 'one/tw').exists()
  same(_exists, false)
})
