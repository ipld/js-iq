/* globals it */
const Block = require('@ipld/block')
const assert = require('assert')
const tsame = require('tsame')
const iq = require('../')
const common = require('./common')

const same = (...args) => assert.ok(tsame(...args))
const test = it

test('blocks for path', async () => {
  let { get, put } = common.storage()
  let leaf = Block.encoder({ hello: 'world' }, 'dag-json')
  let child = Block.encoder({ two: await leaf.cid() }, 'dag-cbor')
  let root = Block.encoder({ one: await child.cid() }, 'dag-json')
  for (let block of [leaf, child, root]) {
    await put(block)
  }
  let q = iq.defaults({ get })
  let query = q(root, 'one/two/hello')
  let blocks = await query.blocks()
  same(Object.keys(blocks[0].decode()), ['one'])
  same(Object.keys(blocks[1].decode()), ['two'])
  same(blocks[2].decode(), { hello: 'world' })
})
