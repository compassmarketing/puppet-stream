const test = require('ava')
const path = require('path')

const QueryStream = require('../lib/queryStream')
const Query = require('../lib/query')
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
  }, 'Only Query can be sent through the stream.')
})

test('should transform a query into results', async t => {
  let stream = new QueryStream(t.context.browser)
  let url = `file://${path.join(__dirname, 'htmls/example.html')}`
  let q = Query.get(url).select({ title: 'body > div > p' })

  await stream._transform(q, null, err => {
    t.falsy(err)
    let buffer = stream._readableState.buffer
    t.is(buffer.length, 1)

    t.deepEqual(buffer.head, { data: { title: 'Test' }, next: null })
  })
})

test('should close correctly', async t => {
  let stream = new QueryStream(t.context.browser)
  let url = `file://${path.join(__dirname, 'htmls/example.html')}`
  let q = Query.get(url).select({ title: 'body > div > p' })

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

test('should pass nothing on network errors with no send option', async t => {
  let stream = new QueryStream(t.context.browser)
  let q = Query.get('bad')

  await new Promise((resolve, reject) => {
    stream.on('error', err => {
      t.not(!err)
      t.is(stream._readableState.buffer.length, 0)
      t.true(stream.writable)
      t.true(stream.readable)
      resolve()
    })

    stream.write(q)
  })
})

test.only('should pass errors with send option', async t => {
  let stream = new QueryStream(t.context.browser, { sendErrors: true })
  let q = Query.get('https://httpstat.us/404')

  let defer = new Promise((resolve, reject) => {
    // should not raise an error
    stream.on('error', err => {
      t.fail()
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

  // await stream._transform(q, null, err => {
  //   t.not(!err)
  //   let buffer = stream._readableState.buffer
  //   t.is(buffer.length, 1)
  //
  //   t.deepEqual(buffer.head, { data: { error: 'Not Found', code: 404 }, next: null })
  // })
})
