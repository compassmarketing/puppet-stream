const Nightcrawler = require('@coreycollins/nightcrawler')

const main = async () => {
  let nc = new Nightcrawler()
  let q = nc
    .go('http://example.com')
    .waitFor(nc.$('body'))
    .groupBy(nc.$('body > div'))
    .select({ title: nc.$('p') })

  let result = await nc.run(q)
  console.log(result)
  process.exit(0)
}

main()
