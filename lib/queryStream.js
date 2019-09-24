/**
 * Stream - creates a node stream for calling a
 * Puppeteer browser page for each object in the stream.
 *
 * @author Corey Collins
 */
const { Transform } = require('stream')
const Browser = require('./browser')
const { Query } = require('./query')
const { RequestError } = require('./errors')
const toArray = require('stream-to-array')

/**
 * Create the streamable object. The stream expects each object to
 * be of the type Query.
 **/
class QueryStream extends Transform {
  constructor(browser, { numOfRetries = 5, shouldRetry, retryFor = 5000, dop = 1, ...opts } = {}) {
    super({ objectMode: true, highWaterMark: Math.max(dop, 16), ...opts })

    if (!(browser instanceof Browser)) {
      throw new Error('Not an instance of Browser')
    }
    this.browser = browser
    this.numOfRetries = numOfRetries
    this.retryFor = retryFor
    this.shouldRetry = shouldRetry

    this._maxParallel = dop
    this._destroyed = false
    this._flushed = false
    this._buffer = []
    this._top = 0
    this._bottom = 0
    this._ondrain = null
  }

  async _call(query, callback) {
    let browser = await this.browser.get()

    let attempts = 0
    let retry = true

    let result
    while (retry && attempts < this.numOfRetries) {
      retry = false
      try {
        result = await query._run(browser)
      } catch (error) {
        if (error instanceof RequestError) {
          if (this.shouldRetry && this.shouldRetry(error)) {
            retry = true
            attempts++
            await new Promise(resolve => {
              setTimeout(resolve, this.retryFor)
            })
          } else {
            result = {
              error: error.message,
              code: error.code,
              _context: query.context
            }
          }
        } else {
          console.log(error)
          result = { error: error.message, _context: query.context }
        }
      }
    }

    callback(null, result)
  }

  destroy() {
    if (this._destroyed) return
    this._destroyed = true
    this.emit('close')
  }

  async _transform(chunk, _, callback) {
    if (!(chunk instanceof Query)) {
      throw new Error('Only Query objects can be sent through the stream.')
    }

    var self = this
    var pos = this._top++

    this._call(chunk, function(err, data) {
      if (self._destroyed) return
      if (err) {
        self.emit('error', err)
        self.push(null)
        self.destroy()
        return
      }

      self._buffer.push(data)
      self._drain()
    })

    if (this._top - this._bottom < this._maxParallel) return callback()
    this._ondrain = callback
  }

  _flush(callback) {
    this._flushed = true
    this._ondrain = callback
    this._drain()
  }

  _drain() {
    while (this._buffer.length > 0) {
      var data = this._buffer.pop()
      this._bottom++
      if (!data) continue
      this.push(data)
    }

    if (!this._drained() || !this._ondrain) return

    var ondrain = this._ondrain
    this._ondrain = null
    ondrain()
  }

  _drained() {
    var diff = this._top - this._bottom
    return this._flushed ? !diff : diff < this._maxParallel
  }

  async _final(callback) {
    return void callback()
  }
}

QueryStream.prototype.toArray = toArray

module.exports = QueryStream
