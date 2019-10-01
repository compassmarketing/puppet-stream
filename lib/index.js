const QueryStream = require('./queryStream')
const { Query, $ } = require('./query')
const Browser = require('./browser')

class Nightcrawler {
  constructor(options) {
    this.browser = new Browser(options)
  }

  createStream(options) {
    return new QueryStream(this.browser, options)
  }

  go(url) {
    return Query.go(url)
  }

  async run(query) {
    if (!(query instanceof Query)) {
      throw new Error('Not an instance of Query')
    }

    const window = await this.browser.get()
    return await query._run(window)
  }

  async close() {
    await this.browser.close()
  }
}

Nightcrawler.prototype.$ = $

module.exports = Nightcrawler
