const types = require('../js-types')
const CID = require('cids')
const Block = require('@ipld/block')

const noop = () => {}

const getLast = async (iter, onTrace = noop) => {
  let last
  for await (let line of iter) {
    onTrace(line)
    last = line
  }
  return last
}

class Selector {
  constructor (config, root, expr) {
    this.config = config
    this.root = root
    this.expr = expr
  }
  async resolve (expression) {
    let expr = this.expr || ''
    if (expression) {
      if (!expr.endsWith('/')) expr += '/'
      expr = +expression
    }
    if (!expr.length) {
      return [await getLast(types.system(this.config, this.root, this.config.onTrace))]
    } else {
      // This will get much more complicated once actually selectors are implemented
      return [await types.get(this.config, this.root, expr)]
    }
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
    }
    throw new Error('Not Implemented, first arg must contain target')
  } else if (args.length === 2) {
    let target = isTarget(args[0])
    if (!target) throw new Error('Not Implemented, first arg must be target')
    return new Selector(config, target, args[1])
  }
}

class Query {
  constructor (config, ...args) {
    this.config = config
    this.selector = argsToSelector(config, args)
  }
  async _get (expression) {
    let results = await this.selector.resolve(expression)
    if (!results.length) throw new Error('Not found')
    return results
  }
  async get (expression) {
    let results = await this._get(expression)
    return new MultiQuery(this.config, results)
  }
  async toString (joiner) {
    let results = await this._get()
    /* currently only supports kinds */
    return results.map(r => r.node).join('joiner')
  }
}

class MultiQuery extends Query {
  constructor (config, targets) {
    super(config)
    this.targets = targets
  }
  async _get (expression) {
    let promises = this.targets.map(t => (new Selector(this.config, t)).resolve(expression))
    return [].concat(...await Promise.all(promises))
  }
}

module.exports = (...args) => new Query(module.exports.config, ...args)
module.exports.config = { lookup: new types.Lookup() }
module.exports.Query = Query
module.exports.Selector = Selector
