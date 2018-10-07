import { EventEmitter } from "events";
import * as ReportPortalClient from "reportportal-client";
import {EVENTS, LEVEL, STATUS, TYPE} from "./constants";
import ReporterOptions from "./ReporterOptions";
import { isEmpty, limit, Logger, promiseErrorHandler, sendToReporter } from "./utils";

class ReportPortalReporter extends EventEmitter {
  public static reporterName = "reportportal";

  public static sendLog(level, message) {
    sendToReporter(EVENTS.RP_LOG, { level, message });
  }

  public static sendFile(level, name, content, type = "image/png") {
    sendToReporter(EVENTS.RP_FILE, { level, name, content, type });
  }

  public static sendLogToLastFailedTest(level, message) {
    sendToReporter(EVENTS.RP_FAILED_LOG, { level, message });
  }

  public static sendFileToLastFailedTest(level, name, content, type = "image/png") {
    sendToReporter(EVENTS.RP_FAILED_FILE, { level, name, content, type });
  }
  public parents: object;
  public logger: Logger;
  public testStartRequestsPromises: object;
  public lastFailedTestRequestPromises: object;
  public tempLaunchId: string;
  public config: object;
  public options: ReporterOptions;
  public client: ReportPortalClient;
  public baseReporter: any;
  public isMultiremote: boolean;

  constructor(baseReporter: any, config: any, options: ReporterOptions) {
    super();
    this.baseReporter = baseReporter;
    this.parents = {};
    this.logger = new Logger(options.debug);
    this.testStartRequestsPromises = {};
    this.lastFailedTestRequestPromises = {};
    this.config = config;
    this.options = Object.assign(new ReporterOptions(), options);

    // Test framework events
    this.on("suite:start", this.suiteStart.bind(this));
    this.on("suite:end", this.suiteEnd.bind(this));
    this.on("test:start", this.testStart.bind(this));
    this.on("test:pass", this.testPass.bind(this));
    this.on("test:fail", this.testFail.bind(this));
    this.on("test:pending", this.testPending.bind(this));

    this.on("start", this.start.bind(this));
    this.on("runner:command", this.runnerCommand.bind(this));
    this.on("runner:result", this.runnerResult.bind(this));

    // Rp events
    this.on(EVENTS.RP_LOG, this.sendLog.bind(this));
    this.on(EVENTS.RP_FILE, this.sendFile.bind(this));
    this.on(EVENTS.RP_FAILED_LOG, this.sendLogToLastFailedItem.bind(this));
    this.on(EVENTS.RP_FAILED_FILE, this.sendFileToLastFailedItem.bind(this));

    this.on("end", this.end.bind(this));
  }

  public getParent(cid: string) {
    const parents = this.getParentIds(cid);
    if (!parents.length) {
      return null;
    }
    return parents[parents.length - 1];
  }

  public addParent(cid: string, parent) {
    const parents = this.getParentIds(cid);
    parents.push(parent);
  }

  public clearParent(cid: string) {
    const parents = this.getParentIds(cid);
    parents.pop();
  }

  public suiteStart(suite) {
    const suiteStartObj = new SuiteStartObj(suite.title);
    if (suite.tags && suite.tags.length > 0) {
      // check is it at least cucumber v1
      if (suite.tags[0].name) {
        suiteStartObj.tags = suite.tags.map((tag) => tag.name);
      } else {
        suiteStartObj.tags = suite.tags;
      }
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
    this.addParent(suite.cid, { type: TYPE.SUITE, id: tempId, promise });
  }

  public suiteEnd(suite) {
    const parent = this.getParent(suite.cid);
    const { promise } = this.client.finishTestItem(parent.id, {});
    promiseErrorHandler(promise);
    this.clearParent(suite.cid);
  }

  public testStart(test) {
    if (!test.title) {
      return;
    }
    const parent = this.getParent(test.cid);
    if (parent.type === TYPE.TEST && this.options.enableRetriesWorkaround) {
      return;
    }
    const testStartObj = new TestStartObj(test.title);

    const browser = test.runner[test.cid].browserName;
    if (browser) {
      const param = { key: "browser", value: browser };
      testStartObj.parameters = [param];
    }

    const { tempId, promise } = this.client.startTestItem(
      testStartObj,
      this.tempLaunchId,
      parent.id,
    );
    promiseErrorHandler(promise);

    this.testStartRequestsPromises[test.cid] = promise;
    this.addParent(test.cid, { type: TYPE.TEST, id: tempId, promise });
  }

  public testPass(test) {
    this.testFinished(test, STATUS.PASSED);
  }

  public testFail(test) {
    this.testFinished(test, STATUS.FAILED);
  }

  public testPending(test) {
    const parent = this.getParent(test.cid);
    if (parent && parent.type === TYPE.SUITE) {
      this.testStart(test);
    }
    this.testFinished(test, STATUS.SKIPPED, new Issue("NOT_ISSUE"));
  }

  public testFinished(test, status, issue?) {
    const parent = this.getParent(test.cid);
    const finishTestObj = new TestEndObj(status, issue);
    if (status === STATUS.FAILED) {
      let message = `Message: ${test.err.message}\n`;
      message += `Stacktrace: ${test.err.stack}\n`;
      finishTestObj.description = `${test.file}\n\`\`\`error\n${message}\n\`\`\``;
      this.client.sendLog(parent.id, {
        level: LEVEL.ERROR,
        message,
      });
    }

    const { promise } = this.client.finishTestItem(parent.id, finishTestObj);
    promiseErrorHandler(promise);

    if (status === STATUS.FAILED) {
      this.lastFailedTestRequestPromises[test.cid] = this.testStartRequestsPromises[test.cid];
    }

    this.clearParent(test.cid);
    delete this.testStartRequestsPromises[test.cid];
  }

  public runnerCommand(command) {
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

  public start(event, client) {
    this.isMultiremote = event.isMultiremote;
    this.client = client || new ReportPortalClient(this.options.rpConfig);
    const { tempId, promise } = this.client.startLaunch({ mode: this.options.rpConfig.mode });
    promiseErrorHandler(promise);
    this.tempLaunchId = tempId;
  }

  public async end() {
    const { promise: finishLaunchPromise } = this.client.finishLaunch(this.tempLaunchId, {});
    promiseErrorHandler(finishLaunchPromise);
    await finishLaunchPromise;
    this.baseReporter.epilogue.call(this.baseReporter);
  }

  public runnerResult(command) {
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
          content: command.body.value,
          level: this.options.screenshotsLogLevel,
          name: "screenshot.png",
        };
        this.sendFile(obj);
      }
    }

    if (this.options.enableSeleniumCommandReporting) {
      if (command.body && !isEmpty(command.body.value)) {
        const method = `${command.requestOptions.uri.path}`;
        delete command.body.sessionId;
        const data = JSON.stringify(limit(command.body));
        this.sendLog({ cid: command.cid, level: this.options.seleniumCommandsLogLevel, message: `${method}\n${data}` });
      }
    }
  }

  public async sendLogToLastFailedItem({ cid, level, message }) {
    if (!(await this.waitForFailedTest(cid, 2000, 10))) {
      this.logger.warn("Attempt to send file to failed item fails. There is no failed test yet.");
      return;
    }
    const rs = await this.lastFailedTestRequestPromises[cid];

    const saveLogRQ = {
      item_id: rs.id,
      level,
      message,
      time: this.client.helpers.now(),
    };

    const url = [this.client.baseURL, "log"].join("/");
    const promise = this.client.helpers.getServerResult(url, saveLogRQ, { headers: this.client.headers }, "POST");
    promiseErrorHandler(promise);
  }

  public async sendFileToLastFailedItem({ cid, level, name, content, type = "image/png" }) {
    if (!(await this.waitForFailedTest(cid, 2000, 10))) {
      this.logger.warn("Attempt to send log to failed item fails. There is no failed test yet.");
      return;
    }
    const rs = await this.lastFailedTestRequestPromises[cid];
    const saveLogRQ = {
      item_id: rs.id,
      level,
      message: "",
      time: this.client.helpers.now(),
    };

    const promise = this.client.getRequestLogWithFile(saveLogRQ, { name, content, type });
    promiseErrorHandler(promise);
  }

  public sendLog({ cid, level, message }) {
    const parent = this.getParent(cid);
    if (!parent) {
      return;
    }
    const { promise } = this.client.sendLog(parent.id, {
      level,
      message: String(message),
    });
    promiseErrorHandler(promise);
  }

  public sendFile({ cid, level, name, content, type = "image/png" }) {
    const parent = this.getParent(cid);
    if (!parent) {
      return;
    }

    const { promise } = this.client.sendLog(parent.id, { level }, { name, content, type });
    promiseErrorHandler(promise);
  }

  public getParentIds(cid) {
    if (this.parents[cid]) {
      return this.parents[cid];
    }

    this.parents[cid] = [];
    return this.parents[cid];
  }

  public async waitForFailedTest(cid, time, count = 10) {
    const interval = time / count;
    while (count > 0) {
      if (this.lastFailedTestRequestPromises[cid]) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
      count -= 1;
    }
    return false;
  }
}

class SuiteStartObj {
  public name = "";
  public description?: string;
  public tags?: string[];
  private readonly type = TYPE.SUITE;

  constructor(name: string) {
    this.name = name;
  }
}

class TestStartObj {
  public name = "";
  public parameters?: any[];
  private readonly type = TYPE.STEP;

  constructor(name: string) {
    this.name = name;
  }
}

class TestEndObj {
  public status: STATUS;
  public issue?: Issue;
  public description?: string;
  constructor(status: STATUS, issue = new Issue("NOT_ISSUE")) {
    this.status = status;
    this.issue = issue;
  }
}

class Issue {
  // tslint:disable-next-line
  public issue_type: string;
  // tslint:disable-next-line
  constructor(issue_type) {
    this.issue_type = issue_type;
  }
}

export = ReportPortalReporter;
