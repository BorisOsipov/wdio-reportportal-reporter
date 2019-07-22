WDIO Report Portal Reporter
====================
[![Greenkeeper badge](https://badges.greenkeeper.io/BorisOsipov/wdio-reportportal-reporter.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/BorisOsipov/wdio-reportportal-reporter.svg?branch=master)](https://travis-ci.org/BorisOsipov/wdio-reportportal-reporter)

> A WebdriverIO v5 reporter plugin to report results to Report Portal(http://reportportal.io/).
> For v4 version see [this branch](https://github.com/BorisOsipov/wdio-reportportal-reporter/tree/wdio_v4#wdio-report-portal-reporter)

## Installation
The easiest way is to keep `wdio-reportportal-reporter` and `wdio-reportportal-service` as a devDependency in your `package.json`.
```json
{
  "devDependencies": {
    "wdio-reportportal-reporter": "5.0.1",
    "wdio-reportportal-service": "5.0.2"
  }
}
```
Instructions on how to install `WebdriverIO` can be found [here](https://webdriver.io/docs/gettingstarted.html).
## Configuration
Configure the output directory in your wdio.conf.js file:
```js
const reportportal = require('wdio-reportportal-reporter');
const RpService = require("wdio-reportportal-service");

const conf = {
  reportPortalClientConfig: {
    token: '00000000-0000-0000-0000-00000000000',
    endpoint: 'https://reportportal-url/api/v1',
    launch: 'launch_name',
    project: 'project_name',
    mode: 'DEFAULT',
    debug: false,
    description: "Launch description text",
    tags: ["tags", "for", "launch"],
  },
  reportSeleniumCommands: false,
  autoAttachScreenshots: false,
  seleniumCommandsLogLevel: 'debug',
  screenshotsLogLevel: 'info',
  parseTagsFromTestTitle: false,
};

exports.config = {
  // ...
  services: [[RpService, {}]],
  reporters: [[reportportal, conf]],
  // ...
};
```

# Additional API

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
const reporter = require('wdio-reportportal-reporter');

exports.config = {
...
  afterTest(test) {
    if (test.passed === false) {
      const filename = "screnshot.png";
      const outputFile = path.join(__dirname, filename);
      browser.saveScreenshot(outputFile);
      reporter.sendFileToTest(test, 'info', filename, fs.readFileSync(outputFile));
    }
  }
...
```

Cucumber example:
```js
const reporter = require('wdio-reportportal-reporter');

exports.config = {
...
   afterStep: function (uri, feature, scenario, step, result) {
     if (result.status === 'failed') {
        let failureObject = {};
        failureObject.type = 'afterStep';
        failureObject.title = step.keyword + step.text;
        const screenShot = global.browser.takeScreenshot();
        let attachment = Buffer.from(screenShot, 'base64');
        reportportal.sendFileToTest(failureObject, 'error', "screnshot.png", attachment);
    }
  }
...
}
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](https://github.com/BorisOsipov/wdio-reportportal-reporter/blob/master/LICENSE) file for details
