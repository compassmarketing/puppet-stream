const path = require('path')
const http = require('http')
const fs = require('fs')
const url = require('url')

const fulfillSymbol = Symbol('fullfil callback')
const rejectSymbol = Symbol('reject callback')

class TestServer {
  constructor(dirPath, port) {
    this.dirPath = dirPath
    this.port = port

    this._server = http.createServer(this._onRequest.bind(this))
    this._server.listen(port)

    /** @type {!Map<string, !Promise>} */
    this._requestSubscribers = new Map()
  }

  get host() {
    return `http://localhost:${this.port}`
  }
  /**
   * @param {string} path
   * @return {!Promise<!IncomingMessage>}
   */
  waitForRequest(path) {
    let promise = this._requestSubscribers.get(path)
    if (promise) return promise
    let fulfill, reject
    promise = new Promise((f, r) => {
      fulfill = f
      reject = r
    })
    promise[fulfillSymbol] = fulfill
    promise[rejectSymbol] = reject
    this._requestSubscribers.set(path, promise)
    return promise
  }

  _onRequest(request, response) {
    const pathName = url.parse(request.url).path

    request.postBody = new Promise(resolve => {
      let body = ''
      request.on('data', chunk => (body += chunk))
      request.on('end', () => resolve(body))
    })

    // Notify request subscriber.
    if (this._requestSubscribers.has(pathName)) {
      this._requestSubscribers.get(pathName)[fulfillSymbol].call(null, request)
      this._requestSubscribers.delete(pathName)
    }

    this.serveFile(request, response, pathName)
  }

  async stop() {
    await new Promise(x => this._server.close(x))
  }

  serveFile(request, response, pathName) {
    const filePath = path.join(this.dirPath, pathName)
    fs.readFile(filePath, (err, data) => {
      if (err) {
        response.statusCode = 404
        response.end(`File not found: ${filePath}`)
        return
      }

      response.setHeader('Content-Type', 'text/html')
      response.end(data)
    })
  }
}

module.exports = TestServer
