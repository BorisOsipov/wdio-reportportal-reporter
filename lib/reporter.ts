import {EventEmitter} from "events";
import * as ReportPortalClient from "reportportal-client";
import {EVENTS, LEVEL, STATUS, TYPE} from "./constants";
import {Issue, StorageEntity, SuiteStartObj, TestEndObj, TestStartObj} from "./entities";
import ReporterOptions from "./ReporterOptions";
import {Storage} from "./storage";
import {
  addBrowserParam,
  addDescription,
  addTagsToSuite,
  isEmpty,
  limit,
  Logger,
  promiseErrorHandler,
  sendToReporter,
} from "./utils";

class ReportPortalReporter extends EventEmitter {
  public static reporterName = "reportportal";

  public static sendLog(level: LEVEL, message: any) {
    sendToReporter(EVENTS.RP_LOG, { level, message });
  }

  public static sendFile(level: LEVEL, name: string, content: any, type = "image/png") {
    sendToReporter(EVENTS.RP_FILE, { level, name, content, type });
  }

  public static sendLogToTest(test: any, level: LEVEL, message: any) {
    sendToReporter(EVENTS.RP_TEST_LOG, { test, level, message });
  }

  public static sendFileToTest(test: any, level: LEVEL, name: string, content: any, type = "image/png") {
    sendToReporter(EVENTS.RP_TEST_FILE, { test, level, name, content, type });
  }
  public storage = new Storage();
  public logger: Logger;
  public tempLaunchId: string;
  public options: ReporterOptions;
  public client: ReportPortalClient;
  public baseReporter: any;
  public isMultiremote: boolean;

  constructor(baseReporter: any, config: any, options: ReporterOptions) {
    super();
    this.baseReporter = baseReporter;
    this.logger = new Logger(options.debug);
    this.options = Object.assign(new ReporterOptions(), options);

    // Test framework events
    this.on("suite:start", this.suiteStart.bind(this));
    this.on("suite:end", this.suiteEnd.bind(this));
    this.on("test:start", this.testStart.bind(this));
    this.on("test:pass", this.testPass.bind(this));
    this.on("test:fail", this.testFail.bind(this));
    this.on("test:pending", this.testPending.bind(this));

    this.on("start", this.start.bind(this));
    this.on("end", this.end.bind(this));
    this.on("runner:command", this.runnerCommand.bind(this));
    this.on("runner:result", this.runnerResult.bind(this));
    this.on("runner:end", this.runnerEnd.bind(this));

    // Rp events
    this.on(EVENTS.RP_LOG, this.sendLog.bind(this));
    this.on(EVENTS.RP_FILE, this.sendFile.bind(this));
    this.on(EVENTS.RP_TEST_LOG, this.sendLogToTest.bind(this));
    this.on(EVENTS.RP_TEST_FILE, this.sendFileToTest.bind(this));
  }

 public suiteStart(suite: any) {
    const suiteStartObj = new SuiteStartObj(suite.title);
    addTagsToSuite(suite.tags, suiteStartObj);
    addDescription(suite.description, suiteStartObj);
    const parent = this.storage.get(suite.cid) || {id: null};
    const { tempId, promise } = this.client.startTestItem(
      suiteStartObj,
      this.tempLaunchId,
      parent.id,
    );
    promiseErrorHandler(promise);

    this.storage.add(suite.cid, new StorageEntity(TYPE.SUITE, tempId, promise, suite));
  }

  public suiteEnd(suite: any) {
    const parent = this.storage.get(suite.cid);
    const finishSuiteObj = {status: STATUS.PASSED};
    if (this.storage.getStartedTests(suite.cid).length === 0) {
      finishSuiteObj.status = STATUS.FAILED;
    }
    const { promise } = this.client.finishTestItem(parent.id, finishSuiteObj);
    promiseErrorHandler(promise);
    this.storage.clear(suite.cid);
  }

  public testStart(test: any) {
    if (!test.title) {
      return;
    }
    const parent = this.storage.get(test.cid);
    if (parent.type === TYPE.STEP && this.options.enableRetriesWorkaround) {
      return;
    }
    const testStartObj = new TestStartObj(test.title);
    addBrowserParam(test.runner[test.cid].browserName, testStartObj);
    testStartObj.addTagsToTest(this.options.parseTagsFromTestTitle);

    const { tempId, promise } = this.client.startTestItem(
      testStartObj,
      this.tempLaunchId,
      parent.id,
    );
    promiseErrorHandler(promise);

    this.storage.add(test.cid, new StorageEntity(TYPE.STEP, tempId, promise, test));
    return promise;
  }

  public testPass(test: any) {
    this.testFinished(test, STATUS.PASSED);
  }

  public testFail(test: any) {
    this.testFinished(test, STATUS.FAILED);
  }

  public testPending(test: any) {
    const parent = this.storage.get(test.cid);
    if (parent && parent.type === TYPE.SUITE) {
      this.testStart(test);
    }
    this.testFinished(test, STATUS.SKIPPED, new Issue("NOT_ISSUE"));
  }

  public testFinished(test: any, status: STATUS, issue?: Issue) {
    const parent = this.storage.get(test.cid);
    if (parent && parent.type !== TYPE.STEP) {
      return;
    }

    const finishTestObj = new TestEndObj(status, issue);
    if (status === STATUS.FAILED) {
      const message = `${test.err.stack} `;
      finishTestObj.description = `${test.file}\n\`\`\`error\n${message}\n\`\`\``;
      this.client.sendLog(parent.id, {
        level: LEVEL.ERROR,
        message,
      });
    }

    const { promise } = this.client.finishTestItem(parent.id, finishTestObj);
    promiseErrorHandler(promise);

    this.storage.clear(test.cid);
  }

  public start(event: any, client: ReportPortalClient) {
    this.isMultiremote = event.isMultiremote;
    this.client = client || new ReportPortalClient(this.options.rpConfig);
    const startLaunchObj = {
      description: this.options.rpConfig.description,
      mode: this.options.rpConfig.mode,
      tags: this.options.rpConfig.tags,
    };
    const { tempId, promise } = this.client.startLaunch(startLaunchObj);
    promiseErrorHandler(promise);
    this.tempLaunchId = tempId;
  }

  public async end() {
    const { promise: finishLaunchPromise } = this.client.finishLaunch(this.tempLaunchId, {});
    promiseErrorHandler(finishLaunchPromise);
    await finishLaunchPromise;
    this.baseReporter.epilogue.call(this.baseReporter);
  }

  public runnerCommand(command: any) {
    if (!this.options.enableSeleniumCommandReporting || this.isMultiremote) {
      return;
    }

    const parent = this.storage.get(command.cid);
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

  public runnerResult(command: any) {
    if (this.isMultiremote) {
      return;
    }

    const parent = this.storage.get(command.cid);
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

  public runnerEnd(runner: any) {
    const clear = (cid: string) => {
      this.storage.clearStartedTests(cid);
    };
    setTimeout(clear.bind(this), 5000, runner.cid);
  }

  public async sendLogToTest({ cid, test, level, message }) {
    const testObj = this.storage.getStartedTests(cid).reverse().find((startedTest) => {
      return startedTest.wdioEntity.title === test.title;
    });

    if (!testObj) {
      this.logger.warn(`Can not send log to test ${test.title}`);
      return;
    }
    const rs = await testObj.promise;

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

  public async sendFileToTest({ cid, test, level, name, content, type = "image/png" }) {
    const testObj = this.storage.getStartedTests(cid).reverse().find((startedTest) => {
      return startedTest.wdioEntity.title === test.title;
    });
    if (!testObj) {
      this.logger.warn(`Can not send file to test ${test.title}`);
      return;
    }
    const rs = await testObj.promise;

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
    const parent = this.storage.get(cid);
    if (!parent) {
      this.logger.warn(`Can not send log to test. There is no running tests`);
      return;
    }
    const { promise } = this.client.sendLog(parent.id, {
      level,
      message: String(message),
    });
    promiseErrorHandler(promise);
  }

  public sendFile({ cid, level, name, content, type = "image/png" }) {
    const parent = this.storage.get(cid);
    if (!parent) {
      this.logger.warn(`Can not send file to test. There is no running tests`);
      return;
    }

    const { promise } = this.client.sendLog(parent.id, { level }, { name, content, type });
    promiseErrorHandler(promise);
  }

}

export = ReportPortalReporter;
