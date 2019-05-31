/* globals it */
const Block = require('@ipld/block')
const assert = require('assert')
const tsame = require('tsame')
const iq = require('../')

const same = (...args) => assert.ok(tsame(...args))
const test = it

const storage = () => {
  let kv = {}
  let get = cid => {
    let _cid = cid.toBaseEncodedString()
    if (!kv[_cid]) throw new Error('Not found.')
    return kv[_cid]
  }
  let put = async block => {
    let cid = await block.cid()
    let _cid = cid.toBaseEncodedString()
    kv[_cid] = block
  }
  return { put, get }
}

const asyncList = async iter => {
  let parts = []
  for await (let part of iter) {
    parts.push(part)
  }
  return parts
}

const mkiq = opts => {
  opts = Object.assign({}, opts, iq.config)
  return (...args) => new iq.Query(opts, ...args)
}

test('get string kind, single block', async () => {
  let { get } = storage()
  let block = Block.encoder({ one: { two: { three: 'hello world' } } }, 'dag-json')
  let q = mkiq({ get })
  let str = await q(block, 'one/two/three').toString()
  same(str, 'hello world')
})
