const { puppeteer, DEFAULT_ARGS } = require('./puppeteer')

class Browser {
  constructor({ executablePath, args } = {}) {
    this.executablePath = executablePath
    this.args = args

    // Load puppeteer
    this._puppeteer = puppeteer()
    this._browser = null
  }

  defaultArgs() {
    const args = [...DEFAULT_ARGS]
    if (this.args) {
      args.push(...this.args)
    }
    return args
  }

  async get() {
    if (!this._browser) {
      this._browser = await this._puppeteer.launch({
        args: this.defaultArgs(),
        defaultViewport: {
          deviceScaleFactor: 1,
          hasTouch: false,
          height: 1080,
          isLandscape: true,
          isMobile: false,
          width: 1920
        },
        executablePath: this.executablePath || this._puppeteer.executablePath(),
        headless: true
      })
    }
    return this._browser
  }

  async close() {
    if (this._browser) {
      await this._browser.close()
    }
  }
}

module.exports = Browser
