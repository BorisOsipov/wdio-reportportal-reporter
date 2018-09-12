const { EventEmitter } = require('events');
const { PASSED, FAILED, SKIPPED } = require('./constants');
const ReportPortalClient = require('reportportal-client');

class ReportPortalReporter extends EventEmitter {
  constructor(baseReporter, config, options = {}) {
    super();
    this.parentIds = {};
    this.client = new ReportPortalClient(options);
    const launchInstance = this.client.startLaunch({});
    this.tempLaunchId = launchInstance.tempId;

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
    const suiteObj = this.client.startTestItem({
      type: 'SUITE',
      description: suite.title,
      name: suite.title,
    }, this.tempLaunchId, this.getParentId(suite.cid));
    this.addParentId(suite.cid, suiteObj.tempId);
  }

  suiteEnd(suite) {
    this.client.finishTestItem(this.getParentId(suite.cid), {});
    this.clearParent(suite.cid);
  }

  testStart(test) {
    if (!test.title) {
      return;
    }
    const stepObj = this.client.startTestItem({
      type: 'TEST',
      description: test.title,
      name: test.title,
    }, this.tempLaunchId, this.getParentId(test.cid));
    this.addParentId(test.cid, stepObj.tempId);
  }

  testPass(test) {
    this.testFinished(test, PASSED);
  }

  testFail(test) {
    this.testFinished(test, FAILED);
  }

  testPending(test) {
    this.testFinished(test, SKIPPED);
  }

  testFinished(test, status) {
    let level = 'info';
    let message = `${test.title}`;

    if (status === FAILED) {
      level = 'ERROR';
      message = JSON.stringify(test.err);
    }

    const parentId = this.getParentId(test.cid);
    this.client.sendLog(parentId, {
      message,
      level,
    });

    this.client.finishTestItem(parentId, {
      status,
    });

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

  getParentIds(cid) {
    if (this.parentIds[cid]) {
      return this.parentIds[cid];
    }

    this.parentIds[cid] = [];
    return this.parentIds[cid];
  }
}

module.exports = ReportPortalReporter;

