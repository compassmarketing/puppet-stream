const path = require('path')
const chromium = require('chrome-aws-lambda')
const Nightcrawler = require('@coreycollins/nightcrawler')

exports.handler = async (event, context) => {
  const executablePath = await chromium.executablePath

  let nc = new Nightcrawler({ executablePath })
  let q = nc
    .go('http://example.com')
    .waitFor(nc.$('body'))
    .groupBy(nc.$('body > div'))
    .select({ title: nc.$('p') })

  let result = await nc.run(q)

  return context.succeed(result)
}
