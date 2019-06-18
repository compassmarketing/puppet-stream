const test = require('ava')
const path = require('path')

const http = require('http')
const httpProxy = require('http-proxy')

const TestServer = require('../utils/testServer')
const Browser = require('../lib/browser')

test('should append extra args to the default args when init puppeteer', async t => {
  let brower = new Browser({ args: ['--proxy-server=0.0.0.0'] })
  t.is(brower.defaultArgs().pop(), '--proxy-server=0.0.0.0')
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

test('should use a proxy server if option supplied', async t => {
  const proxy = httpProxy.createProxyServer()
  http
    .createServer(function(req, res) {
      proxy.web(req, res, {
        target: 'http://localhost:9003'
      })
    })
    .listen(8009)

  const server = new TestServer(path.join(__dirname, 'htmls'), 9003)
  await new Promise(x => server._server.once('listening', x))

  const broswer = new Browser({ args: ['--proxy-server=localhost:8009'] })
  const window = await broswer.get()
  const page = await window.newPage()

  let resp = await page.goto('http://example.com/example.html')
  await broswer.close()

  t.true(resp.ok())
  t.is(resp.status(), 200)

  await server.stop()
})
