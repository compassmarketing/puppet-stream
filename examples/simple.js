const Nightcrawler = require('../lib')

const main = async () => {
  let nc = new Nightcrawler()
  let q = nc
    .get('http://example.com')
    .waitFor('body')
    .groupBy('body > div')
    .select({ title: 'p' })

  let result = await nc.run(q)
  console.log(result)
  process.exit(0)
}

main()
