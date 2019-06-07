/**
 * Load puppeteer from either bundled chromium or core module and overload
 * with helper functions
 *
 */
const DEFAULT_ARGS = [
  '--disable-background-timer-throttling',
  '--disable-breakpad',
  '--disable-client-side-phishing-detection',
  '--disable-cloud-import',
  '--disable-default-apps',
  '--disable-dev-shm-usage',
  '--disable-extensions',
  '--disable-gesture-typing',
  '--disable-hang-monitor',
  '--disable-infobars',
  '--disable-notifications',
  '--disable-offer-store-unmasked-wallet-cards',
  '--disable-offer-upload-credit-cards',
  '--disable-popup-blocking',
  '--disable-print-preview',
  '--disable-prompt-on-repost',
  '--disable-setuid-sandbox',
  '--disable-speech-api',
  '--disable-sync',
  '--disable-tab-for-desktop-share',
  '--disable-translate',
  '--disable-voice-input',
  '--disable-wake-on-wifi',
  '--enable-async-dns',
  '--enable-simple-cache-backend',
  '--enable-tcp-fast-open',
  '--enable-webgl',
  '--hide-scrollbars',
  '--ignore-gpu-blacklist',
  '--media-cache-size=33554432',
  '--metrics-recording-only',
  '--mute-audio',
  '--no-default-browser-check',
  '--no-first-run',
  '--no-pings',
  '--no-sandbox',
  '--no-zygote',
  '--password-store=basic',
  '--prerender-from-omnibox=disabled',
  '--use-gl=swiftshader',
  '--use-mock-keychain',
  '--memory-pressure-off',
  '--single-process'
]

const puppeteer = () => {
  for (let overload of ['FrameManager', 'Page']) {
    require(`./${overload}`)
  }

  try {
    return require('puppeteer')
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') {
      throw error
    }
    return require('puppeteer-core')
  }
}
module.exports = {
  puppeteer,
  DEFAULT_ARGS
}
