WDIO Report Portal Reporter
====================

> A WebdriverIO reporter plugin to report results to Report Portal(http://reportportal.io/).


## Installation
The easiest way is to keep `wdio-reportportal-reporter` as a devDependency in your `package.json`.
```json
{
  "devDependencies": {
    "wdio-reportportal-reporter": "~0.0.8"
  }
}
```
You can simple do it by:
```bash
npm install wdio-reportportal-reporter --save-dev
```
Instructions on how to install `WebdriverIO` can be found [here](http://webdriver.io/guide/getstarted/install.html).
## Configuration
Configure the output directory in your wdio.conf.js file:
```js
exports.config = {
  // ...
  reporters: ['reportportal'],
    reporterOptions: {
      reportportal: {
        rpConfig: {
          token: '00000000-0000-0000-0000-00000000000',
          endpoint: 'https://reportportal-url/api/v1',
          launch: 'launch_name',
          project: 'project_name',
          mode: 'DEFAULT'
        },
        enableSeleniumCommandReporting: false,
        enableScreenshotsReporting: false,
        seleniumCommandsLogLevel: 'debug',
        screenshotsLogLevel: 'info',
      }
    },
  // ...
}
```

## Additional API

Api methods can be accessed using:
```js
const reporter = require('wdio-reportportal-reporter')
```
### Methods description
* `sendLog(level, message) ` – send log to current suite\test item.
    * `level` (*String*) - log level. Values ['trace', 'debug', 'info', 'warn', 'error'].
    * `message` (*String*)– log message content.
* `sendFile(level, name, content, [type])` – send file to current suite\test item.
    * `level` (*String*) - log level. Values ['trace', 'debug', 'info', 'warn', 'error'].
    * `name` (*String*)– file name.
    * `content` (*String*) – attachment content
    * `type` (*String*, optional) – attachment MIME-type, `image/png` by default
* `sendLogToLastFailedTest(level, message)` - send log to last failed test item.
    * `level` (*String*) - log level. Values ['trace', 'debug', 'info', 'warn', 'error'].
    * `message` (*String*)– log message content.
* `sendFileToLastFailedTest(level, name, content, [type])` – send file to last failed test item.
    * `level` (*String*) - log level. Values ['trace', 'debug', 'info', 'warn', 'error'].
    * `name` (*String*)– file name.
    * `content` (*String*) – attachment content
    * `type` (*String*, optional) – attachment MIME-type, `image/png` by default

Pay attention: `sendLog`\\`sendFile` sends log to **current test item**. It means if you send log without active test(e.g from hooks or on suite level) you will not be able to access them in Report Portal UI.

Methods `sendLogToLastFailedTest`\\`sendFileToLastFailedTest` are useful when you need to send screenshots or logs to the failed test item from wdio afterTest hook.

Mocha example:
```js
const reporter = require('wdio-allure-reporter');

exports.config = {
...
  afterTest: async function afterTest(test) {
    if (test.passed === false) {
      const screenshot = await browser.saveScreenshot();
      reporter.sendFileToLastFailedTest('error', 'failed.png', screenshot);
    }
  },
  ...
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
