const Nightcrawler = require('@coreycollins/nightcrawler')
const Stream = require('stream')

const readable = new Stream.Readable({ objectMode: true })

let nc = new Nightcrawler()
let qStream = nc.createStream({ sendErrors: false })

// Pipe to standard out
readable.pipe(qStream).toArray((err, arr) => {
  if (err) {
    console.log(err)
    process.exit(1)
  }

  console.log(arr)
  process.exit(0)
})

let q = nc
  .get('http://example.com')
  .waitFor('body')
  .groupBy('body > div')
  .select({ title: 'p' })

readable.push(q)
readable.push(null)
