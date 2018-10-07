const reporter = require('../../../build/reporter');

const conf = {
  rpConfig: {
    token: '',
    endpoint: '',
    launch: 'boris_osipov_TEST_EXAMPLE',
    project: 'boris_osipov_personal',
    mode: 'DEBUG',
    debug: false,
  },
  enableSeleniumCommandReporting: false,
  seleniumCommandsLogLevel: 'trace',
  enableScreenshotsReporting: false,
  screenshotsLogLevel: 'info',
  enableRetriesWorkaround: true,
};

const config = {
  baseUrl: 'http://localhost:54392',
  coloredLogs: true,
  logLevel: 'silent',
  // services: ['phantomjs'],
  reporters: [reporter],
  // framework: 'mocha',
  host: '127.0.0.1',
  reporterOptions: {
    reportportal: conf,
  },
  sync: false,
  screenshotPath: './screenshots',
  capabilities: [{
    browserName: 'chrome',
  }],
  framework: 'cucumber',
  cucumberOpts: {
    timeout: 20000,
    require: ['tests/fixtures/features/steps/passing-steps.js', 'tests/fixtures/features/steps/hooks.js'],
    compiler: [
      'js:babel-register',
    ],
  },
  afterTest: async function afterTest(test) {
    if (test.passed === false) {
      const screenshot = await browser.saveScreenshot();
      reporter.sendFileToLastFailedTest('error', 'errorscreen.png', screenshot, 'image/png', test);
    }
  },

  onComplete: async function onComplete() {
    return new Promise(resolve => setTimeout(resolve, 5000));
  },

};

module.exports = { config, getConfig: () => config };
