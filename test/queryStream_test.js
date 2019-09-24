const test = require('ava')
const path = require('path')
const Stream = require('stream')

const QueryStream = require('../lib/queryStream')
const { Query, $ } = require('../lib/query')
const Browser = require('../lib/browser')

test.before(async t => {
  // This runs before all tests
  t.context.browser = new Browser()
})

test.after.always('guaranteed cleanup', async t => {
  // This will always run, regardless of earlier failures
  await t.context.browser.close()
})

test('should validate a browser instance argument', async t => {
  t.throws(() => {
    return new QueryStream({})
  }, 'Not an instance of Browser')
})

test('should only allow Query objects through the stream', async t => {
  let stream = new QueryStream(t.context.browser)
  await t.throwsAsync(async () => {
    await stream._transform({ foo: 'bar' }, null, () => {})
  }, 'Only Query objects can be sent through the stream.')
})

test('should transform a query into results', async t => {
  let stream = new QueryStream(t.context.browser)
  let url = `file://${path.join(__dirname, 'htmls/example.html')}`
  let q = Query.go(url).select({ title: $('body > div > p') })

  const readable = new Stream.Readable({ objectMode: true })

  readable.push(q)
  readable.push(null)

  const results = await readable.pipe(stream).toArray()

  t.deepEqual(results, [
    {
      _context: {
        url: url
      },
      results: [
        {
          title: 'Test'
        }
      ]
    }
  ])
})

test('should close correctly', async t => {
  let stream = new QueryStream(t.context.browser)
  let url = `file://${path.join(__dirname, 'htmls/example.html')}`
  let q = Query.go(url).select({ title: 'body > div > p' })

  let defer = new Promise((resolve, reject) => {
    stream.on('error', err => {
      console.log(err)
      reject(err)
    })

    stream.on('finish', a => {
      t.pass()
      resolve()
    })
  })

  stream.write(q)
  stream.end()

  await defer
})

test('should pass errors', async t => {
  const readable = new Stream.Readable({ objectMode: true })

  let stream = new QueryStream(t.context.browser)
  let q = Query.go('https://httpstat.us/404')

  readable.push(q)
  readable.push(null)

  let results = await readable.pipe(stream).toArray()
  t.deepEqual(results, [
    {
      error: 'Not Found',
      code: 404,
      _context: { url: 'https://httpstat.us/404' }
    }
  ])
})

test('should retry', async t => {
  const readable = new Stream.Readable({ objectMode: true })
  t.plan(6)

  const retry = err => {
    if (err.code === 503) {
      t.pass()
      return true
    } else {
      false
    }
  }

  let stream = new QueryStream(t.context.browser, { shouldRetry: retry, retryFor: 10 })
  let q = Query.go('https://httpstat.us/503')

  readable.push(q)
  readable.push(null)

  let results = await readable.pipe(stream).toArray()
  t.deepEqual(results, [])
})

test('should transform a query into results with dop 10', async t => {
  let stream = new QueryStream(t.context.browser, { dop: 2 })
  let url = `file://${path.join(__dirname, 'htmls/example.html')}`

  let q1 = Query.go(url).select({ title: $('body > div > p') })
  let q2 = Query.go(url).select({ title: $('body > div > p') })
  let q3 = Query.go(url).select({ title: $('body > div > p') })
  let q4 = Query.go(url).select({ title: $('body > div > p') })
  let q5 = Query.go(url).select({ title: $('body > div > p:nth-child(1)') })
  let q6 = Query.go(url).select({ title: $('body > div > p:nth-child(1)') })

  const readable = new Stream.Readable({ objectMode: true })

  readable.push(q1)
  readable.push(q2)
  readable.push(q3)
  readable.push(q4)
  readable.push(q5)
  readable.push(q6)
  readable.push(null)

  const results = await readable.pipe(stream).toArray()
  const titles = results
    .map(r => {
      return r.results[0].title
    })
    .sort(t => t)
  t.deepEqual(titles, ['Test', 'Test', 'Test', 'Test', 'Foo', 'Foo'])
})
