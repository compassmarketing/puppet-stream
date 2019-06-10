const path = require('path')
const chromium = require('chrome-aws-lambda')
const Nightcrawler = require('@coreycollins/nightcrawler')

exports.handler = async (event, context) => {
  const executablePath = await chromium.executablePath()

  let nc = new Nightcrawler({ executablePath })
  let q = nc
    .get('http://example.com')
    .waitFor('body')
    .groupBy('body > div')
    .select({ title: 'p' })

  let result = await nc.run(q)

  return context.succeed(result)
}
