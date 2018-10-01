/* eslint-disable object-curly-newline */
const { EventEmitter } = require('events');
const ReportPortalClient = require('reportportal-client');

const { testItemStatuses, events, entityType } = require('./constants');
const { promiseErrorHandler, logger, isEmpty, limit, sendToReporter } = require('./utils');

const { PASSED, FAILED, SKIPPED } = testItemStatuses;

class ReportPortalReporter extends EventEmitter {
  constructor(baseReporter, config, options = {}) {
    super();
    this.parents = {};
    this.testStartRequestsPromises = {};
    this.lastFailedTestRequestPromises = {};
    this.config = config;
    this.options = Object.assign({
      enableSeleniumCommandReporting: false,
      seleniumCommandsLogLevel: 'debug',
      enableScreenshotsReporting: false,
      screenshotsLogLevel: 'info',
      enableRetriesWorkaround: false,
    }, options);

    this.client = new ReportPortalClient(options.rpConfig);
    const { tempId, promise } = this.client.startLaunch({ mode: options.rpConfig.mode || 'DEFAULT' });
    promiseErrorHandler(promise);
    this.tempLaunchId = tempId;

    // Test framework events
    this.on('suite:start', ::this.suiteStart);
    this.on('suite:end', ::this.suiteEnd);
    this.on('test:start', ::this.testStart);
    this.on('test:pass', ::this.testPass);
    this.on('test:fail', ::this.testFail);
    this.on('test:pending', ::this.testPending);

    this.on('start', ::this.start);
    this.on('runner:command', ::this.runnerCommand);
    this.on('runner:result', ::this.runnerResult);

    // Rp events
    this.on(events.RP_LOG, ::this.sendLog);
    this.on(events.RP_FILE, ::this.sendFile);
    this.on(events.RP_FAILED_LOG, ::this.sendLogToLastFailedItem);
    this.on(events.RP_FAILED_FILE, ::this.sendFileToLastFailedItem);

    const { epilogue } = baseReporter;
    this.on('end', async () => {
      const { promise: finishLaunchPromise } = this.client.finishLaunch(this.tempLaunchId, {});
      promiseErrorHandler(finishLaunchPromise);
      await finishLaunchPromise;
      epilogue.call(baseReporter);
    });
  }

  getParent(cid) {
    const parents = this.getParentIds(cid);
    if (!parents.length) {
      return null;
    }
    return parents[parents.length - 1];
  }

  addParent(cid, parent) {
    const parents = this.getParentIds(cid);
    parents.push(parent);
  }

  clearParent(cid) {
    const parents = this.getParentIds(cid);
    parents.pop();
  }

  suiteStart(suite) {
    const suiteStartObj = { type: entityType.SUITE, name: suite.title };

    if (suite.tags && suite.tags.length > 0) {
      suiteStartObj.tags = suite.tags.map(tag => tag.name);
    }

    if (suite.description) {
      suiteStartObj.description = suite.description;
    }
    const parent = this.getParent(suite.cid) || {};

    const { tempId, promise } = this.client.startTestItem(
      suiteStartObj,
      this.tempLaunchId,
      parent.id,
    );
    promiseErrorHandler(promise);
    this.addParent(suite.cid, { type: entityType.SUITE, id: tempId, promise });
  }

  suiteEnd(suite) {
    const parent = this.getParent(suite.cid);
    const { promise } = this.client.finishTestItem(parent.id, {});
    promiseErrorHandler(promise);
    this.clearParent(suite.cid);
  }

  testStart(test) {
    if (!test.title) {
      return;
    }

    const parent = this.getParent(test.cid);
    if (parent.type === entityType.TEST && this.options.enableRetriesWorkaround) {
      return;
    }

    const testStartObj = { type: entityType.TEST, name: test.title };

    const browser = test.runner[test.cid].browserName;
    if (browser) {
      const param = { key: 'browser', value: browser };
      testStartObj.parameters = [param];
    }

    const { tempId, promise } = this.client.startTestItem(
      testStartObj,
      this.tempLaunchId,
      parent.id,
    );
    promiseErrorHandler(promise);

    this.testStartRequestsPromises[test.cid] = promise;
    this.addParent(test.cid, { type: entityType.TEST, id: tempId, promise });
  }

  testPass(test) {
    this.testFinished(test, PASSED);
  }

  testFail(test) {
    this.testFinished(test, FAILED);
  }

  testPending(test) {
    this.testFinished(test, SKIPPED, { issue_type: 'NOT_ISSUE' });
  }

  testFinished(test, status, issue) {
    const parent = this.getParent(test.cid);
    const finishTestObj = { status, issue };

    if (status === FAILED) {
      const level = 'ERROR';
      let message = `Message: ${test.err.message}\n`;
      message += `Stacktrace: ${test.err.stack}\n`;
      finishTestObj.description = `${test.file}\n\`\`\`error\n${message}\n\`\`\``;
      this.client.sendLog(parent.id, {
        message,
        level,
      });
    }

    const { promise } = this.client.finishTestItem(parent.id, finishTestObj);
    promiseErrorHandler(promise);

    if (status === FAILED) {
      this.lastFailedTestRequestPromises[test.cid] = this.testStartRequestsPromises[test.cid];
    }

    this.clearParent(test.cid);
    delete this.testStartRequestsPromises[test.cid];
  }

  runnerCommand(command) {
    if (!this.options.enableSeleniumCommandReporting || this.isMultiremote) {
      return;
    }

    const parent = this.getParent(command.cid);
    if (!parent) {
      return;
    }

    const method = `${command.method} ${command.uri.path}`;
    if (!isEmpty(command.data)) {
      const data = JSON.stringify(limit(command.data));
      this.sendLog({ cid: command.cid, level: this.options.seleniumCommandsLogLevel, message: `${method}\n${data}` });
    } else {
      this.sendLog({ cid: command.cid, level: this.options.seleniumCommandsLogLevel, message: `${method}` });
    }
  }

  start(event) {
    this.isMultiremote = event.isMultiremote;
  }

  runnerResult(command) {
    if (this.isMultiremote) {
      return;
    }

    const parent = this.getParent(command.cid);
    if (!parent) {
      return;
    }

    const isScreenshot = command.requestOptions.uri.path.match(/\/session\/[^/]*\/screenshot/) && command.body.value;

    if (isScreenshot) {
      if (this.options.enableScreenshotsReporting) {
        const obj = {
          cid: command.cid,
          level: this.options.screenshotsLogLevel,
          name: 'screenshot.png',
          content: command.body.value,
        };
        this.sendFile(obj);
      }
    }

    if (this.options.enableSeleniumCommandReporting) {
      if (command.body && !isEmpty(command.body.value)) {
        const method = `${command.requestOptions.uri.path}`;
        // eslint-disable-next-line no-param-reassign
        delete command.body.sessionId;
        const data = JSON.stringify(limit(command.body));
        this.sendLog({ cid: command.cid, level: this.options.seleniumCommandsLogLevel, message: `${method}\n${data}` });
      }
    }
  }

  async sendLogToLastFailedItem({ cid, level, message }) {
    if (!(await this.waitForFailedTest(cid, 2000, 10))) {
      logger.warn('Attempt to send file to failed item fails. There is no failed test yet.');
      return;
    }
    const rs = await this.lastFailedTestRequestPromises[cid];

    const saveLogRQ = {
      item_id: rs.id,
      level,
      message,
      time: this.client.helpers.now(),
    };

    const url = [this.client.baseURL, 'log'].join('/');
    const promise = this.client.helpers.getServerResult(url, saveLogRQ, { headers: this.client.headers }, 'POST');
    promiseErrorHandler(promise);
  }

  // eslint-disable-next-line object-curly-newline
  async sendFileToLastFailedItem({ cid, level, name, content, type = 'image/png' }) {
    if (!(await this.waitForFailedTest(cid, 2000, 10))) {
      logger.warn('Attempt to send log to failed item fails. There is no failed test yet.');
      return;
    }
    const rs = await this.lastFailedTestRequestPromises[cid];
    const saveLogRQ = {
      item_id: rs.id,
      level,
      message: '',
      time: this.client.helpers.now(),
    };

    const promise = this.client.getRequestLogWithFile(saveLogRQ, { name, content, type });
    promiseErrorHandler(promise);
  }

  sendLog({ cid, level, message }) {
    const parent = this.getParent(cid);
    if (!parent) {
      return;
    }
    const { promise } = this.client.sendLog(parent.id, {
      message: String(message),
      level,
    });
    promiseErrorHandler(promise);
  }

  // eslint-disable-next-line object-curly-newline
  sendFile({ cid, level, name, content, type = 'image/png' }) {
    const parent = this.getParent(cid);
    if (!parent) {
      return;
    }

    const { promise } = this.client.sendLog(parent.id, { level }, { name, content, type });
    promiseErrorHandler(promise);
  }

  getParentIds(cid) {
    if (this.parents[cid]) {
      return this.parents[cid];
    }

    this.parents[cid] = [];
    return this.parents[cid];
  }

  async waitForFailedTest(cid, time, count = 10) {
    const interval = time / count;
    while (count > 0) {
      if (this.lastFailedTestRequestPromises[cid]) {
        return true;
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => setTimeout(resolve, interval));
      // eslint-disable-next-line no-param-reassign
      count -= 1;
    }
    return false;
  }

  static sendLog(level, message) {
    sendToReporter(events.RP_LOG, { level, message });
  }

  static sendFile(level, name, content, type = 'image/png') {
    // eslint-disable-next-line object-curly-newline
    sendToReporter(events.RP_FILE, { level, name, content, type });
  }

  static sendLogToLastFailedTest(level, message) {
    sendToReporter(events.RP_FAILED_LOG, { level, message });
  }

  static sendFileToLastFailedTest(level, name, content, type = 'image/png') {
    // eslint-disable-next-line object-curly-newline
    sendToReporter(events.RP_FAILED_FILE, { level, name, content, type });
  }
}

ReportPortalReporter.reporterName = 'reportportal';

module.exports = ReportPortalReporter;
