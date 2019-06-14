%.zip:
	mkdir -p nodejs/node_modules/@coreycollins/nightcrawler
	cd nodejs/ && npm install chrome-aws-lambda@~1.17.0 async@^3.0.1 puppeteer-core@~1.17.0 stream-to-array@~2.3.0 --no-bin-links --no-optional --no-package-lock --no-save --no-shrinkwrap && cd -
	npm pack
	tar --directory nodejs/node_modules/@coreycollins/nightcrawler --extract --file coreycollins-nightcrawler-*.tgz --strip-components=1
	rm coreycollins-nightcrawler-*.tgz
	mkdir -p $(dir $@)
	zip -9 --filesync --move --recurse-paths $@ nodejs/
