WDIO Report Portal Reporter
====================

[![Greenkeeper badge](https://badges.greenkeeper.io/BorisOsipov/wdio-reportportal-reporter.svg)](https://greenkeeper.io/)

> A WebdriverIO reporter plugin to report results to Report Portal(http://reportportal.io/).


## Installation
The easiest way is to keep `wdio-reportportal-reporter` as a devDependency in your `package.json`.
```json
{
  "devDependencies": {
    "wdio-reportportal-reporter": "~0.0.13"
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
const reportportal = require('wdio-reportportal-reporter');

exports.config = {
  // ...
  reporters: [reportportal],
    reporterOptions: {
      reportportal: {
        rpConfig: {
          token: '00000000-0000-0000-0000-00000000000',
          endpoint: 'https://reportportal-url/api/v1',
          launch: 'launch_name',
          project: 'project_name',
          mode: 'DEFAULT',
          debug: false
        },
        enableSeleniumCommandReporting: false,
        enableScreenshotsReporting: false,
        seleniumCommandsLogLevel: 'debug',
        screenshotsLogLevel: 'info',
        enableRetriesWorkaround: false,
        parseTagsFromTestTitle: false,
        debug: false
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
* `reporter.sendLog(level, message) ` – send log to current suite\test item.
    * `level` (*string*) - log level. Values ['trace', 'debug', 'info', 'warn', 'error'].
    * `message` (*String*)– log message content.
* `reporter.sendFile(level, name, content, [type])` – send file to current suite\test item.
    * `level` (*string*) - log level. Values ['trace', 'debug', 'info', 'warn', 'error'].
    * `name` (*string*)– file name.
    * `content` (*String*) – attachment content
    * `type` (*String*, optional) – attachment MIME-type, `image/png` by default
* `reporter.sendLogToTest(test, level, message)` - send log to specific test.
    * `test` (*object*) - test object from `afterTest\afterStep` wdio hook
    * `level` (*string*) - log level. Values ['trace', 'debug', 'info', 'warn', 'error'].
    * `message` (*String*)– log message content.
* `reporter.sendFileToTest(test, level, name, content, [type])` – send file to to specific test.
    * `test` (*object*) - test object from `afterTest\afterStep` wdio hook
    * `level` (*string*) - log level. Values ['trace', 'debug', 'info', 'warn', 'error'].
    * `name` (*string*)– file name.
    * `content` (*String*) – attachment content
    * `type` (*string*, optional) – attachment MIME-type, `image/png` by default

Pay attention: `sendLog`\\`sendFile` sends log to **current running test item**. It means if you send log without active test(e.g from hooks or on suite level) it will not be reported Report Portal UI.

Methods `sendLogToTest`\\`sendFileToTest` are useful when you need to send screenshots or logs to the failed test item from wdio afterTest hook.

Mocha example:
```js
const reporter = require('wdio-allure-reporter');

exports.config = {
...
  afterTest: async function afterTest(test) {
    if (test.passed === false) {
      const screenshot = await browser.saveScreenshot();
      reporter.sendFileToTest(test, 'error', 'failed.png', screenshot);
    }
  },
  ...
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
