const waterfall = require('async/waterfall')
const { RequestError } = require('./errors')

const $ = (path, attr) => {
  return { path, attr }
}

class PathCollection extends Array {
  constructor(...items) {
    super(...items)
  }
}

class Query {
  constructor(options = {}) {
    const { timeout } = options

    this.timeout = timeout || 10000 // 10 seconds
    this.actions = []
  }

  static go(url) {
    let q = new Query()
    return q.go(url)
  }

  async _run(page) {
    // Insert the page into the waterfall
    const inject = async () => {
      return { page }
    }
    this.actions.splice(0, 0, inject)

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
    if (!url) {
      throw new Error('invalid query')
    }

    this.actions.push(async ({ page, results } = {}) => {
      page.setDefaultNavigationTimeout(this.timeout)
      let resp = await page.go(url)

      if (!resp) {
        throw new Error('blank page')
      } else if (!resp.ok()) {
        throw new RequestError(resp.statusText(), resp.status())
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
              let val = obj[key]

              if (val instanceof Object) {
                let { path, attr } = obj[key]
                let child = e.querySelector(`* > ${path}`)
                obj[key] = !attr ? σ.$string(child) : child.getAttribute(attr)
              } else {
                obj[key] = val
              }
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
    this._validateSelector(selector)

    this.actions.push(async ({ page, results } = {}) => {
      let groups = await page.evaluate(sel => {
        let elements = σ.$$(sel)
        return elements.map((e, i) => `${sel}:nth-child(${i + 1})`)
      }, selector.path)
      let paths = new PathCollection(...groups)
      return { page, results: paths }
    })
    return this
  }

  waitFor(selector, timeout = 1000) {
    this._validateSelector(selector)

    this.actions.push(async ({ page, results } = {}) => {
      await page.waitForSelector(selector.path, { timeout })
      return { page, results }
    })
    return this
  }

  _validateSelector(sel) {
    if (!(sel instanceof Object) && !sel.path) {
      throw new Error('Invalid selector')
    }
  }
}

module.exports = {
  Query,
  $
}
