const generics = require('@ipld/generics')
const CID = require('cids')
const Block = require('@ipld/block')

const noop = () => {}

const toArray = async (iter, onTrace = noop) => {
  let arr = []
  for await (let line of iter) {
    onTrace(line)
    arr.push(line)
  }
  return arr
}

const readIterator = async function * (config, target, expr, start, end) {
  if (expr) {
    target = await generics.get(config, target, expr)
  }
  yield * generics.read(config, target, start, end)
}

class Selector {
  constructor (config, root, expr) {
    this.config = config
    this.root = root
    this.expr = expr || ''
  }
  _expression (expression) {
    let expr = this.expr || ''
    if (expression) {
      if (!expr.endsWith('/')) expr += '/'
      expr += expression
    }
    return expr
  }
  async resolve (expression) {
    if (this._resolved) return this._resolved
    let expr = this._expression(expression)

    let info
    if (expr.length) info = { method: 'get', args: { path: expr } }
    this._trace = await toArray(generics.system(this.config, this.root, info), this.config.onTrace)
    /* a bit of a hack, for now, since we only supports paths and not selectors */
    this._resolved = [this._trace.slice(-1)[0].result]
    return this._resolved
  }
  async blocks () {
    await this.resolve()
    return this._trace.filter(l => l.trace === 'decode').map(l => l.block)
  }
  readIterator (joiner, start, end) {
    // joiner not implemented until we have selector expressions that match more than one thing
    return readIterator(this.config, this.root, this.expr, start, end)
  }
  async exists () {
    try {
      await this.resolve()
    } catch (e) {
      if (e.message.toLowerCase().startsWith('not found')) return false
      else throw e
    }
    return !!this._resolved.length
  }
  selector (expr) {
    if (!expr.startsWith('/')) expr = '/' + expr
    return new Selector(this.config, this.root, this.expr + expr)
  }
}

const isTarget = target => {
  if (typeof target === 'string') return new CID(target)
  if (CID.isCID(target) ||
       Block.isBlock(target)
  ) {
    return target
  }
  return false
}

const argsToSelector = (config, args) => {
  if (args.length === 1) {
    if (typeof args[0] === 'string') {
      let expr = args[0]
      let i = expr.indexOf('/')
      let str = expr.slice(0, i)
      expr = expr.slice(i + 1)
      let cid = new CID(str)
      return new Selector(config, cid, expr)
    } else {
      // TODO: we should probably do some type checking here
      return new Selector(config, args[0])
    }
  } else if (args.length === 2) {
    let target = isTarget(args[0])
    if (!target) throw new Error('Not Implemented, first arg must be target')
    return new Selector(config, target, args[1])
  }
}

const parseReaderArgs = args => {
  let opts = {}
  while (args.length) {
    let arg = args.shift()
    if (typeof arg === 'string') opts.joiner = Buffer.from(arg)
    else if (Buffer.isBuffer(arg)) opts.joiner = arg
    else {
      if (opts.start && opts.start !== 0) opts.end = arg
      else opts.start = arg
    }
  }
  return opts
}

const keyIterator = async function * (q) {
  let results = await q._get()
  for (let result of results) {
    yield * generics.keys(q.config, result)
  }
}

class Query {
  constructor (config, selector) {
    this.config = config
    this.selector = selector
  }
  async _get (expression) {
    let results = await this.selector.resolve(expression)
    if (!results.length) throw new Error('Not found')
    return results
  }
  q (expression) {
    let selector = this.selector.selector(expression)
    return new Query(this.config, selector)
  }
  exists () {
    return this.selector.exists()
  }
  async toString (joiner = '\n') {
    let results = await this._get()
    /* currently only supports kinds */
    let trystring = r => {
      if (!r.toString) throw new Error('Node cannot be converted to string')
      return r.toString()
    }
    results = await Promise.all(results.map(r => trystring(r)))
    return results.join(joiner)
  }
  async number () {
    let results = await this._get()
    if (results.length > 1) throw new Error('Cannot convert multiple results into a number')
    if (!results[0].toNumber) throw new Error('Value cannot be converted to number')
    return results[0].toNumber()
  }
  async length () {
    let results = await this._get()
    let size = 0
    for (let result of results) {
      size += await generics.length(this.config, result)
    }
    return size
  }
  async int () {
    let results = await this._get()
    if (results.length > 1) throw new Error('Cannot convert multiple results into an integer')
    if (!results[0].toInt) throw new Error('Value cannot be converted to integer')
    return results[0].toInt()
  }
  async read (...args) {
    let iter = this.readIterator(...args)
    let buffers = []
    for await (let buffer of iter) {
      buffers.push(buffer)
    }
    return Buffer.concat(buffers)
  }
  readIterator (...args) {
    let { joiner, start, end } = parseReaderArgs(args)
    return this.selector.readIterator(joiner, start, end)
  }
  keyIterator () {
    return keyIterator(this)
  }
  async keys () {
    let keys = []
    for await (let key of this.keyIterator()) {
      keys.push(key)
    }
    return keys
  }
  blocks () {
    return this.selector.blocks()
  }
}

module.exports = (...args) => new Query(module.exports.config, argsToSelector(module.exports.config, args))
module.exports.config = { lookup: new generics.Lookup() }
module.exports.defaults = opts => (...args) => {
  let config = Object.assign({}, module.exports.config, opts)
  let selector = argsToSelector(config, args)
  return new Query(config, selector)
}
module.exports.Query = Query
module.exports.Selector = Selector
