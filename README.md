# EXPERIMENTAL: do not use in production.

## IPLD Query

Simplified interface for IPLD graph reading and manipulation.

```javascript
let iq = require('@ipld/iq')

let block = Block.encoder({one: {two: {three: 'hello world'}}})

let string = await iq(block, 'one/two/three').toString()
// hello world
```

## Configuring Storage

Read-only example:

```javascript
/* configure a read interface connected to storage */
let store = {}
let get = cid => store[cid.toString()] || null
iq.config.get = get

let block = Block.encoder({one: {two: {three: 'hello world'}}})
let cid = await block.cid()

let string = await iq(`${cid.toString()}/one/two/three`).toString()
// hello world
```


