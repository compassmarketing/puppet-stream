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

  get(url) {
    return Query.get(url)
  }

  async run(query) {
    if (!(query instanceof Query)) {
      throw new Error('Not an instance of Query')
    }

    const window = await this.browser.get()
    const page = await window.newPage()
    page.setDefaultNavigationTimeout(10000)

    try {
      // Send page object to query class for extraction
      return await query._run(page)
    } catch (error) {
      throw error
    } finally {
      // Always try and close the page
      try {
        await page.close()
      } catch (err) {}
    }
  }

  async close() {
    await this.browser.close()
  }
}

Nightcrawler.prototype.$ = $

module.exports = Nightcrawler
