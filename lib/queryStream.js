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
  constructor(browser, options = {}) {
    super({ objectMode: true, ...options })
    const { numOfRetries, shouldRetry } = options

    if (!(browser instanceof Browser)) {
      throw new Error('Not an instance of Browser')
    }

    this.browser = browser
    this.numOfRetries = numOfRetries || 5
    this.shouldRetry = shouldRetry
  }

  async _transform(query, _, callback) {
    let window = await this.browser.get()

    if (!(query instanceof Query)) {
      throw new Error('Only Query can be sent through the stream.')
    }

    const page = await window.newPage()

    let attempts = 0
    let retry = true

    while (retry && attempts < this.numOfRetries) {
      retry = false

      try {
        let resp = await query._run(page)
        this.push(resp)
      } catch (error) {
        if (error instanceof RequestError) {
          if (this.shouldRetry && this.shouldRetry(error)) {
            retry = true
            attempts++
          } else {
            this.push({
              error: error.message,
              code: error.code,
              _context: query.context
            })
          }
        } else {
          this.push({ error: error.message, _context: query.context })
        }
      }
    }

    callback()

    // Always try and close the page
    try {
      await page.close()
    } catch (err) {}
  }

  async _final(callback) {
    return void callback()
  }
}

QueryStream.prototype.toArray = toArray

module.exports = QueryStream
