const { EventEmitter } = require('events');
const ReportPortalClient = require('reportportal-client');

const { testItemStatuses, events, entityType } = require('./constants');
const { promiseErrorHandler, logger } = require('./utils');

const { PASSED, FAILED, SKIPPED } = testItemStatuses;

class ReportPortalReporter extends EventEmitter {
  constructor(baseReporter, config, options = {}) {
    super();
    this.parentIds = {};
    this.testStartRequestsPromises = {};
    this.lastFailedTestRequestPromises = {};
    this.config = config;
    this.client = new ReportPortalClient(options);
    const { tempId, promise } = this.client.startLaunch({});
    promiseErrorHandler(promise);
    this.tempLaunchId = tempId;

    // Test framework events
    this.on('suite:start', ::this.suiteStart);
    this.on('suite:end', ::this.suiteEnd);
    this.on('test:start', ::this.testStart);
    this.on('test:pass', ::this.testPass);
    this.on('test:fail', ::this.testFail);
    this.on('test:pending', ::this.testPending);

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

  getParentId(cid) {
    const parentIds = this.getParentIds(cid);
    if (!parentIds.length) {
      return null;
    }
    return parentIds[parentIds.length - 1];
  }

  addParentId(cid, id) {
    const parentIds = this.getParentIds(cid);
    parentIds.push(id);
  }

  clearParent(cid) {
    const parentIds = this.getParentIds(cid);
    parentIds.pop();
  }

  suiteStart(suite) {
    const suiteStartObj = { type: entityType.SUITE, name: suite.title };

    if (suite.tags && suite.tags.length > 0) {
      suiteStartObj.tags = suite.tags.map(tag => tag.name);
    }

    if (suite.description) {
      suiteStartObj.description = suite.description;
    }

    const { tempId, promise } = this.client.startTestItem(
      suiteStartObj,
      this.tempLaunchId,
      this.getParentId(suite.cid),
    );
    promiseErrorHandler(promise);
    this.addParentId(suite.cid, tempId);
  }

  suiteEnd(suite) {
    const { promise } = this.client.finishTestItem(this.getParentId(suite.cid), {});
    promiseErrorHandler(promise);
    this.clearParent(suite.cid);
  }

  testStart(test) {
    if (!test.title) {
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
      this.getParentId(test.cid),
    );
    promiseErrorHandler(promise);
    this.testStartRequestsPromises[test.cid] = promise;
    this.addParentId(test.cid, tempId);
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
    const parentId = this.getParentId(test.cid);
    const finishTestObj = { status, issue };

    if (status === FAILED) {
      const level = 'ERROR';
      let message = `Message: ${test.err.message}\n`;
      message += `Stacktrace: ${test.err.stack}\n`;
      finishTestObj.description = `${test.file}\n\`\`\`error\n${message}\n\`\`\``;
      this.client.sendLog(parentId, {
        message,
        level,
      });
    }

    const { promise } = this.client.finishTestItem(parentId, finishTestObj);
    promiseErrorHandler(promise);

    if (status === FAILED) {
      this.lastFailedTestRequestPromises[test.cid] = this.testStartRequestsPromises[test.cid];
    }

    this.clearParent(test.cid);
    delete this.testStartRequestsPromises[test.cid];
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
    const parentId = this.getParentId(cid);
    if (!parentId) {
      return;
    }
    const { promise } = this.client.sendLog(parentId, {
      message: String(message),
      level,
    });
    promiseErrorHandler(promise);
  }

  // eslint-disable-next-line object-curly-newline
  sendFile({ cid, level, name, content, type = 'image/png' }) {
    const parentId = this.getParentId(cid);
    if (!parentId) {
      return;
    }
    const { promise } = this.client.sendLog(parentId, { level }, { name, content, type });
    promiseErrorHandler(promise);
  }

  getParentIds(cid) {
    if (this.parentIds[cid]) {
      return this.parentIds[cid];
    }

    this.parentIds[cid] = [];
    return this.parentIds[cid];
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
}

module.exports = ReportPortalReporter;
