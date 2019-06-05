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


