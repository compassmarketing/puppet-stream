# Puppet Stream

> Puppet Stream is a node library that makes it easy to stream scraping requests to Puppeteer using native NodeJS streams.

## Getting Started

### Install

```
  npm i @compass-marketing/puppet-stream
```

**Important**: Nightcrawler has a dependency to `puppeteer-core`. This allows for a custom executable to be used if desired. If
you would like to use the chrome executable bundled with puppeteer, please install it like so:

```
npm i puppeteer
```

### Usage

```
const Nightcrawler = require('@compass-marketing/puppet-stream')
const JSONStream = require('JSONStream')

let nc = new Nightcrawler()
let qStream = nc.createStream()

// Pipe to standard out
qStream.pipe(JSONStream.stringify(false)).pipe(process.stdout)

let q = nc
  .get('http://example.com')
  .waitFor('body')
  .groupBy('body > div')
  .select({ title: nc.$('p') })

qStream.write(q)

qStream.end()
```
