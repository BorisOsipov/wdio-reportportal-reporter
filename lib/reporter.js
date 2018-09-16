const { EventEmitter } = require('events');
const { testItemStatuses, events, entityType } = require('./constants');
const ReportPortalClient = require('reportportal-client');

const { PASSED, FAILED, SKIPPED } = testItemStatuses;

class ReportPortalReporter extends EventEmitter {
  constructor(baseReporter, config, options = {}) {
    super();
    this.parentIds = {};
    this.client = new ReportPortalClient(options);
    const { tempId } = this.client.startLaunch({});
    this.tempLaunchId = tempId;

    // Test framework events
    this.on('hook:start', ::this.hookStart);
    this.on('hook:end', ::this.hookEnd);
    this.on('suite:start', ::this.suiteStart);
    this.on('suite:end', ::this.suiteEnd);
    this.on('test:start', ::this.testStart);
    this.on('test:pass', ::this.testPass);
    this.on('test:fail', ::this.testFail);
    this.on('test:pending', ::this.testPending);

    // Runner events (webdriver)
    this.on('start', ::this.start);
    this.on('runner:command', ::this.runnerCommand);
    this.on('runner:result', ::this.runnerResult);

    // Rp events
    this.on(events.RPLOG, ::this.sendLog);
    this.on(events.RPFILE, ::this.sendFile);

    const { epilogue } = baseReporter;
    this.on('end', () => {
      this.client.finishLaunch(this.tempLaunchId, {});
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

    const { tempId } = this.client.startTestItem(
      suiteStartObj,
      this.tempLaunchId,
      this.getParentId(suite.cid),
    );

    this.addParentId(suite.cid, tempId);
  }

  suiteEnd(suite) {
    this.client.finishTestItem(this.getParentId(suite.cid), {});
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

    const { tempId } = this.client.startTestItem(
      testStartObj,
      this.tempLaunchId,
      this.getParentId(test.cid),
    );

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

    this.client.finishTestItem(parentId, finishTestObj);
    this.clearParent(test.cid);
  }

  runnerCommand(command) {
  }

  start(event) {

  }

  runnerResult(command) {

  }

  hookStart(hook) {

  }

  hookEnd(hook) {

  }

  sendLog({ cid, level, message }) {
    const parentId = this.getParentId(cid);
    this.client.sendLog(parentId, {
      message: String(message),
      level,
    });
  }

  // eslint-disable-next-line object-curly-newline
  sendFile({ cid, level, name, content, type = 'image/png' }) {
    const parentId = this.getParentId(cid);
    this.client.sendLog(parentId, { level }, { name, content, type });
  }

  getParentIds(cid) {
    if (this.parentIds[cid]) {
      return this.parentIds[cid];
    }

    this.parentIds[cid] = [];
    return this.parentIds[cid];
  }
}

module.exports = ReportPortalReporter;
