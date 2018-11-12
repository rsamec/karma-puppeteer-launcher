var path = require('path')
var puppeteer = require('puppeteer-core');
var fs = require('fs');
var DEFAULT_CMD = require('./chrome');

function isJSFlags(flag) {
  return flag.indexOf('--js-flags=') === 0
}

function sanitizeJSFlags(flag) {
  var test = /--js-flags=(['"])/.exec(flag)
  if (!test) {
    return flag
  }
  var escapeChar = test[1]
  var endExp = new RegExp(escapeChar + '$')
  var startExp = new RegExp('--js-flags=' + escapeChar)
  return flag.replace(startExp, '--js-flags=').replace(endExp, '')
}

var ChromeBrowser = function (baseBrowserDecorator, args) {
  baseBrowserDecorator(this)

  var flags = args.flags || []
  var userDataDir = args.chromeDataDir || this._tempDir

  this._getOptions = function (url) {
    // Chrome CLI options
    // http://peter.sh/experiments/chromium-command-line-switches/
    flags.forEach(function (flag, i) {
      if (isJSFlags(flag)) {
        flags[i] = sanitizeJSFlags(flag)
      }
    })

    return [
      '--user-data-dir=' + userDataDir,
      '--no-default-browser-check',
      '--no-first-run',
      '--disable-default-apps',
      '--disable-popup-blocking',
      '--disable-translate',
      '--disable-background-timer-throttling'
    ].concat(flags, [url])
  }
}

var ensureExists = function (path, mask) {
  return new Promise((resolve, reject) => {
    if (typeof mask == 'function') { // allow the `mask` parameter to be optional
      //cb = mask;
      mask = 0777;
    }
    fs.mkdir(path, mask, function (err) {
      if (err) {
        if (err.code == 'EEXIST') resolve("ignore the error if the folder already exists")
        else reject(err); // something else went wrong
      } resolve("file created successfully with handcrafted Promise!");
    });
  })
}
const DEFAULT_TARGET_DIR = 'target';
const DEFAULT_SCREENSHOT_DIR = 'screenshots';

var PuppeteerBrowser = function (baseBrowserDecorator, args) {
  ChromeBrowser.apply(this, arguments)
  console.log(args);

  var flags = args.flags || []



  this._start = async (url) => {

    console.log(url);
    await ensureExists(path.resolve("./", DEFAULT_TARGET_DIR))
    await ensureExists(path.resolve("./", DEFAULT_TARGET_DIR, DEFAULT_SCREENSHOT_DIR))


    const browser = await puppeteer.launch({
      args: flags,
      executablePath: DEFAULT_CMD[process.platform]
    });
    const page = await browser.newPage();

    // Capture logging
    page.on('console', (...args) => console.log.apply(console, ['[Browser]', ...args]));


    // Expose Screenshot function
    await page.exposeFunction('capturePage', name => {

      const filename = path.resolve("./", DEFAULT_TARGET_DIR, DEFAULT_SCREENSHOT_DIR, `${name}.png`);
      console.log('[Node]', 'Save 🎨  to', filename);
      return page.screenshot({ path: filename, fullPage: true });
    });

    await page.exposeFunction('puppeteerDone', async code => {
      await browser.close();
      process.exit(code);
    });

    await page.goto(url);

  }
}

PuppeteerBrowser.prototype = {
  name: 'Puppeteer',
  DEFAULT_CMD: {},
  ENV_CMD: 'PUPPETEER_BIN'
}

PuppeteerBrowser.$inject = ['baseBrowserDecorator', 'args']

// PUBLISH DI MODULE
module.exports = {
  'launcher:Puppeteer': ['type', PuppeteerBrowser]
}
