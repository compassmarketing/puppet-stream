const Nightcrawler = require('@coreycollins/nightcrawler')
const Stream = require('stream')

const readable = new Stream.Readable({ objectMode: true })

let nc = new Nightcrawler()
let qStream = nc.createStream({ sendErrors: false })

// Pipe to standard out
readable.pipe(qStream).toArray((err, resp) => {
  if (err) {
    console.log(err)
    process.exit(1)
  }

  console.log(resp)
  process.exit(0)
})

let q = nc
  .go('http://example.com')
  .waitFor(nc.$('body'))
  .groupBy(nc.$('body > div'))
  .select({ title: nc.$('p') })

readable.push(q)
readable.push(null)
