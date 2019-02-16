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
  parseTagsFromTestTitle: false,
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
    require: ['test/fixtures/features/steps/passing-steps.js', 'test/fixtures/features/steps/hooks.js']
  },
  afterTest: async function (test) {
    //logging Pass or Fail for test
    (test.passed) ? reporter.sendLogToTest(test, 'debug', `******* TEST '${test.title}' PASSED ******* `)
      : reporter.sendLogToTest(test, 'debug', `******* TEST '${test.title}' FAILED ******* `);
    if (test.passed === false) {
      const screenshot = await browser.saveScreenshot();
      reporter.sendFileToTest(test, 'info', 'failed.png', screenshot);
    }
  },

  onComplete: async function onComplete() {
    const isLaunchFinished = await reporter.waitLaunchFinished();
    if(!isLaunchFinished) {
      console.warn('Launch has not been finished');
    }
    console.log('Launch finished');
  },

};

module.exports = {
  config,
  getConfig: () => config
};
