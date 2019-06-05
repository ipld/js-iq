/* globals it */
const Block = require('@ipld/block')
const assert = require('assert')
const tsame = require('tsame')
const iq = require('../')

const same = (...args) => assert.ok(tsame(...args))
const test = it

test('keys', async () => {
  let block = Block.encoder({ hello: 1, world: 2 }, 'dag-json')
  let keys = await iq(block).keys()
  same(keys, ['hello', 'world'])
})
