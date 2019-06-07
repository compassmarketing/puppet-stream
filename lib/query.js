const waterfall = require('async/waterfall')

class PathCollection extends Array {
  constructor(...items) {
    super(...items)
  }
}

class Query {
  constructor(options = {}) {
    const { url, method = 'GET', postData } = options

    if (!url) {
      throw new Error('invalid query')
    }

    if (method && ['GET', 'POST'].indexOf(method) < 0) {
      throw new Error(`invalid method ${method}`)
    }

    this.url = url
    this.method = method
    this.postData = postData

    this.actions = []
  }

  static get(url) {
    let q = new Query({ url })
    return q.go(url)
  }

  static post(url, { postData } = {}) {
    let q = new Query({ url, method: 'POST', postData })
    return q.go(url)
  }

  async _run(page) {
    // Insert the page into the waterfall
    const inject = async () => {
      return { page }
    }
    this.actions.splice(0, 0, inject)

    if (this.method == 'POST') {
      await page.setRequestInterception(true)
      page.on('request', async req => {
        let data = {
          method: this.method,
          postData: this.postData
        }
        // Request modified... finish sending!
        req.continue(data)
      })
    }

    let { results } = await waterfall(this.actions)

    if (!results) {
      throw new Error('query did not return any results. Did you forget a select?')
    }

    if (!(results instanceof Array)) {
      results = [results]
    }

    return results
  }

  go(url) {
    this.actions.push(async ({ page, results } = {}) => {
      let resp = await page.go(url)

      if (!resp) {
        throw new Error('blank page')
      } else if (!resp.ok()) {
        throw new Error(`response return status code: ${resp.status()}`)
      }

      return { page, results }
    })
    return this
  }

  eval(func) {
    this.actions.push(func)
    return this
  }

  select(selectors) {
    this.actions.push(async ({ page, results } = {}) => {
      if (!results) {
        results = new PathCollection('*')
      } else if (!(results instanceof PathCollection)) {
        throw new Error('Select can only take a path collection')
      }

      results = await page.evaluate(
        (sels, paths) => {
          let elements = paths.map(r => σ.$(r))
          return elements.map(e => {
            let obj = Object.assign({}, sels)

            Object.keys(obj).map(key => {
              let { path, attr } = obj[key]

              if (!path) {
                path = obj[key]
              }

              let child = e.querySelector(`* > ${path}`)
              obj[key] = !attr ? σ.$string(child) : child.getAttribute(attr)
            })

            return obj
          })
        },
        selectors,
        results
      )

      return { page, results }
    })
    return this
  }

  groupBy(selector) {
    this.actions.push(async ({ page, results } = {}) => {
      let groups = await page.evaluate(sel => {
        let elements = σ.$$(sel)
        return elements.map((e, i) => `${sel}:nth-child(${i + 1})`)
      }, selector)
      let paths = new PathCollection(...groups)
      return { page, results: paths }
    })
    return this
  }

  waitFor(selector, timeout = 1000) {
    this.actions.push(async ({ page, results } = {}) => {
      await page.waitForSelector(selector, { timeout })
      return { page, results }
    })
    return this
  }
}

module.exports = Query
