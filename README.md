WDIO Report Portal Reporter
====================

[![Greenkeeper badge](https://badges.greenkeeper.io/BorisOsipov/wdio-reportportal-reporter.svg)](https://greenkeeper.io/)

![npm](https://img.shields.io/npm/v/wdio-reportportal-reporter)
![npm](https://img.shields.io/npm/dm/wdio-reportportal-reporter)
> A WebdriverIO reporter plugin to report results to Report Portal(<http://reportportal.io/>).

## Installation

The easiest way is to keep `wdio-reportportal-reporter` and `wdio-reportportal-service` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "wdio-reportportal-reporter": "^7.0.0",
    "wdio-reportportal-service": "^7.0.0"
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
  reportPortalClientConfig: { // report portal settings
    token: '00000000-0000-0000-0000-00000000000',
    endpoint: 'https://reportportal-url/api/v1',
    launch: 'launch_name',
    project: 'project_name',
    mode: 'DEFAULT',
    debug: false,
    description: "Launch description text",
    attributes: [{key:"tag", value: "foo"}],
    headers: {"foo": "bar"}, // optional headers for internal http client
    restClientConfig: { // axios like http client config - https://github.com/axios/axios#request-config
      proxy: {
        protocol: 'https',
        host: '127.0.0.1',
        port: 9000,
        auth: {
          username: 'mikeymike',
          password: 'rapunz3l'
        }
      },
      timeout: 60000
    }
  },
  reportSeleniumCommands: false, // add selenium commands to log
  seleniumCommandsLogLevel: 'debug', // log level for selenium commands
  autoAttachScreenshots: false, // automatically add screenshots
  screenshotsLogLevel: 'info', // log level for screenshots
  parseTagsFromTestTitle: false, // parse strings like `@foo` from titles and add to Report Portal
  cucumberNestedSteps: false, // report cucumber steps as Report Portal steps
  autoAttachCucumberFeatureToScenario: false, // requires cucumberNestedSteps to be true for use
  sanitizeErrorMessages: true, // strip color ascii characters from error stacktrace
  sauceLabOptions : {
    enabled: true, // automatically add SauseLab ID to rp tags.
    sldc: "US" // automatically add SauseLab region to rp tags.
  }
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

* `reporter.addAttribute({key, value})` – add an attribute to current test.
  * `key` (*string*, optional) -  attribute key. It must be non-empty string.
  * `value` (*string*, required)–  attribute value. It must be non-empty string.
* `reporter.addAttributeToCurrentSuite({key, value})` - add an attribute to current suite.
  * `key` (*string*, optional) -  attribute key. It must be non-empty string.
  * `value` (*string*, required)–  attribute value. It must be non-empty string.
* `reporter.addDescriptionToCurrentSuite(description)` - add some string to current suite.
  * `description` (*string*) - description content. Text can be formatted with markdown.
* `reporter.addDescriptionToAllSuites(description)` - add some string to all upcoming suites. (Use it in before all hook, so every suite gets the same description)
  * `description` (*string*) - description content. Text can be formatted with markdown.
* `reporter.sendLog(level, message)` – send log to current suite\test item.
  * `level` (*string*) - log level. Values ['trace', 'debug', 'info', 'warn', 'error'].
  * `message` (*string*)– log message content.
* `reporter.sendFile(level, name, content, [type])` – send file to current suite\test item.
  * `level` (*string*) - log level. Values ['trace', 'debug', 'info', 'warn', 'error'].
  * `name` (*string*)– file name.
  * `content` (*string*) – attachment content
  * `type` (*string*, optional) – attachment MIME-type, `image/png` by default
  * `message` (*string*)– log message content.
* `reporter.sendLogToTest(test, level, message)` - send log to specific test.
  * `test` (*object*) - test object from `afterTest\afterStep` wdio hook
  * `level` (*string*) - log level. Values ['trace', 'debug', 'info', 'warn', 'error'].
  * `message` (*string*)– log message content.
* `reporter.sendFileToTest(test, level, name, content, [type])` – send file to to specific test.
  * `test` (*object*) - test object from `afterTest\afterStep` wdio hook
  * `level` (*string*) - log level. Values ['trace', 'debug', 'info', 'warn', 'error'].
  * `name` (*string*)– file name.
  * `content` (*string*) – attachment content
  * `type` (*string*, optional) – attachment MIME-type, `image/png` by default
  * `message` (*string*)– log message content.

Pay attention: `sendLog`\\`sendFile` sends log to **current running test item**. It means if you send log without active test(e.g from hooks or on suite level) it will not be reported Report Portal UI.

Methods `sendLogToTest`\\`sendFileToTest` are useful when you need to send screenshots or logs to the failed test item from wdio afterTest hook.

Mocha example:

```js
const reportportal = require('wdio-reportportal-reporter');
const path = require('path');
const fs = require('fs');

exports.config = {
...
  afterTest(test) {
    if (test.passed === false) {
      const filename = "screnshot.png";
      const outputFile = path.join(__dirname, filename);
      browser.saveScreenshot(outputFile);
      reportportal.sendFileToTest(test, 'info', filename, fs.readFileSync(outputFile));
    }
  }
...
```

Jasmine example:

```js
const reportportal = require('wdio-reportportal-reporter');
const path = require('path');
const fs = require('fs');

exports.config = {
...
  afterTest(test) {
    if (test.passed === false) {
      const filename = "screnshot.png";
      const outputFile = path.join(__dirname, filename);
      browser.saveScreenshot(outputFile);
      //!!
      Object.assign(test, {title: test.description}}
      reportportal.sendFileToTest(test, 'info', filename, fs.readFileSync(outputFile));
    }
  }
...
```

WDIO Cucumber "5.14.3+" Example:

```js
const reportportal = require('wdio-reportportal-reporter');

exports.config = {
...
   afterStep: function (uri, feature, { error, result, duration, passed }, stepData, context) {
     if (!passed) {
        let failureObject = {};
        failureObject.type = 'afterStep';
        failureObject.error = error;
        failureObject.title = `${stepData.step.keyword}${stepData.step.text}`;
        const screenShot = global.browser.takeScreenshot();
        let attachment = Buffer.from(screenShot, 'base64');
        reportportal.sendFileToTest(failureObject, 'error', "screnshot.png", attachment);
    }
  }
...
}
```

## Getting link to Report Portal UI launch page

```js
const RpService = require("wdio-reportportal-service");
...
    onComplete: async function (_, config) {
        const link = await RpService.getLaunchUrl(config);
        console.log(`Report portal link ${link}`)
    }
...
```

or more complicated way

```js
const RpService = require("wdio-reportportal-service");
...
    onComplete: async function (_, config) {
        const protocol = 'http:';
        const hostname = 'example.com';
        const port = ':8080'; // or empty string for default 80/443 ports
        const link = await RpService.getLaunchUrlByParams(protocol, hostname, port, config);
        console.log(`Report portal link ${link}`)
    }
...
```

## Reporting test to existing launch

If you want report test to existing active launch you may pass it to reporter by environment variable `REPORT_PORTAL_LAUNCH_ID`
You are responsible for finishing launch as well as starting such launch.

```sh
export REPORT_PORTAL_LAUNCH_ID=SomeLaunchId
npm run wdio
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](https://github.com/BorisOsipov/wdio-reportportal-reporter/blob/master/LICENSE) file for details
