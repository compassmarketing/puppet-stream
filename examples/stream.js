const Nightcrawler = require('../lib')

const JSONStream = require('JSONStream')

let nc = new Nightcrawler()
let qStream = nc.createStream()

// Pipe to standard out
qStream.pipe(JSONStream.stringify(false)).pipe(process.stdout)

let q = nc
  .get('http://example.com')
  .waitFor('body')
  .groupBy('body > div')
  .select({ title: 'p' })

qStream.write(q)

qStream.end()
