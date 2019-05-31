# EXPERIMENTAL: do not use in production.

## IPLD Query

Simplified interface for IPLD graph reading and manipulation.

```javascript
let iq = require('@ipld/iq')
let Block = require('@ipld/block')

let block = Block.encoder({one: {two: {three: 'hello world'}}})

let string = await iq(block, 'one/two/three').toString()
// hello world
```

### Configuring Storage

Read-only example:

```javascript
/* configure a read interface connected to storage */
let store = {}
let get = cid => store[cid.toString()] || null
iq.config.get = get

let block = Block.encoder({one: {two: {three: 'hello world'}}})
let cid = await block.cid()
store[cid.toString()] = block

let string = await iq(`${cid.toString()}/one/two/three`).toString()
// hello world
```

# API

## Read APIs

### query.toString([joiner='\n'])

Returns any string values from the expression. 

If multiple values are found the joiner string is be used to join them into a single string.

Example at top of README.

### query.read([start, end])

* `.read(0, 12)` reads the path value from 0 to the 15th byte.
* `.read(5)` reads from the 5th byte.

Full example:

```javascript
let block = Block.encoder({one: {two: {three: Buffer.from('hello world')}}})

let buffer = await iq(block, 'one/two/three').read()
// Buffer containing 'hello world'
Buffer.isBuffer(buffer)
// true
```

### query.readIterator(...[start, end])
