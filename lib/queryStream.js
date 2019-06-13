/**
 * Stream - creates a node stream for calling a
 * Puppeteer browser page for each object in the stream.
 *
 * @author Corey Collins
 */
const { Transform } = require('stream')
const Browser = require('./browser')
const Query = require('./query')
const { RequestError } = require('./errors')
/**
 * Create the streamable object. The stream expects each object to
 * be of the type Query.
 **/
class QueryStream extends Transform {
  constructor(browser, options = {}) {
    super({ objectMode: true, ...options })
    const { sendErrors } = options

    if (!(browser instanceof Browser)) {
      throw new Error('Not an instance of Browser')
    }

    this.browser = browser
    this.sendErrors = sendErrors
  }

  async _transform(query, _, callback) {
    let window = await this.browser.get()

    if (!(query instanceof Query)) {
      throw new Error('Only Query can be sent through the stream.')
    }

    const page = await window.newPage()
    page.setDefaultNavigationTimeout(10000)

    try {
      // Send page object to query class for extraction
      let results = await query._run(page)

      results.forEach(res => {
        this.push(res)
      })

      callback()
    } catch (error) {
      if (this.sendErrors) {
        if (error instanceof RequestError) {
          this.push({ error: error.message, code: error.code })
        } else {
          this.push({ error: error.message })
        }
      }
      callback(error)
    } finally {
      // Always try and close the page
      try {
        await page.close()
      } catch (err) {}
    }
  }

  async _final(callback) {
    await this.browser.close()
    return void callback()
  }
}

module.exports = QueryStream
