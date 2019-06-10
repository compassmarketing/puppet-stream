const test = require('ava')
const path = require('path')

const Browser = require('../lib/browser')

test('should append extra args to the default args when init puppeteer', async t => {
  let brower = new Browser({ args: ['--proxy=0.0.0.0'] })
  t.is(brower.defaultArgs().pop(), '--proxy=0.0.0.0')
})

test('should use custom executablePath', async t => {
  let browser = new Browser({ executablePath: '/tmp/path' })
  await t.throwsAsync(
    async () => {
      await browser.get()
    },
    { message: /^Failed to launch chrome! spawn \/tmp\/path.*/ }
  )
})
