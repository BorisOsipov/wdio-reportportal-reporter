WDIO Report Portal Reporter
====================

> A WebdriverIO reporter plugin to report results to Report Portal(http://reportportal.io/).


## Installation
The easiest way is to keep `wdio-reportportal-reporter` as a devDependency in your `package.json`.
```json
{
  "devDependencies": {
    "wdio-reportportal-reporter": "~0.0.6"
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
        token: '00000000-0000-0000-0000-00000000000',
        endpoint: 'https://reportportal-url/api/v1',
        launch: 'launch_name',
        project: 'project_name',
        mode: 'DEFAULT'
      }
    },
  // ...
}
```
