import logger from "@wdio/logger";
import Reporter from "@wdio/reporter";
import {createHash} from "crypto";
import * as path from "path";
import * as ReportPortalClient from "reportportal-js-client";
import {WDIO_TEST_STATUS, CUCUMBER_TYPE, EVENTS, LEVEL, STATUS, TYPE} from "./constants";
import {EndTestItem, Issue, StartTestItem, StorageEntity} from "./entities";
import ReporterOptions, {Attribute} from "./ReporterOptions";
import {Storage} from "./storage";
import {
  addBrowserParam,
  addCodeRef,
  addCodeRefCucumber,
  addSauceLabAttributes,
  ansiRegex,
  getRelativePath,
  isEmpty,
  isScreenshotCommand,
  limit,
  promiseErrorHandler,
  sendToReporter
} from "./utils";

const log = logger("wdio-reportportal-reporter");

class ReportPortalReporter extends Reporter {

  get isSynchronised(): boolean {
    return this.rpPromisesCompleted;
  }

  set isSynchronised(value) {
    this.rpPromisesCompleted = value;
  }

  public static sendLog(level: LEVEL | keyof typeof LEVEL, message: any) {
    sendToReporter(EVENTS.RP_LOG, {level, message});
  }

  public static sendFile(level: LEVEL | keyof typeof LEVEL, name: string, content: any, type = "image/png", message = "") {
    sendToReporter(EVENTS.RP_FILE, {level, name, content, type, message});
  }

  public static sendLogToTest(test: any, level: LEVEL | keyof typeof LEVEL, message: any) {
    sendToReporter(EVENTS.RP_TEST_LOG, {test, level, message});
  }

  public static sendFileToTest(test: any, level: LEVEL | keyof typeof LEVEL, name: string, content: any, type = "image/png", message = "") {
    sendToReporter(EVENTS.RP_TEST_FILE, {test, level, name, content, type, message});
  }

  public static finishTestManually(test: any) {
    sendToReporter(EVENTS.RP_TEST_RETRY, {test});
  }

  public static addDescriptionToCurrentSuite(description: string) {
    sendToReporter(EVENTS.RP_SUITE_ADD_DESCRIPTION, description)
  }

  public static addDescriptionToAllSuites(description: string) {
    sendToReporter(EVENTS.RP_ALL_SUITE_ADD_DESCRIPTION, description)
  }


  private static getValidatedAttribute(attribute: Attribute): Attribute {
    if (!attribute) {
      throw new Error("Attribute should be an object")
    }
    const clonedAttribute = Object.assign({}, attribute)
    if (clonedAttribute.value) {
      clonedAttribute.value = String(clonedAttribute.value);
      if (clonedAttribute.value.trim().length === 0) {
        throw Error("Attribute value should not be an empty string")
      }
    } else {
      throw new Error("Invalid attribute: " + JSON.stringify(attribute));
    }
    if (clonedAttribute.key) {
      clonedAttribute.key = String(clonedAttribute.key);
      if (clonedAttribute.key.trim().length === 0) {
        throw Error("Attribute key should not be an empty string")
      }
    }
    return clonedAttribute
  }

  public static addAttribute(attribute: Attribute) {
    sendToReporter(EVENTS.RP_TEST_ATTRIBUTES, {...this.getValidatedAttribute(attribute)});
  }

  public static addAttributeToSuite(attribute: Attribute) {
    sendToReporter(EVENTS.RP_SUITE_ATTRIBUTES, {...this.getValidatedAttribute(attribute)});
  }

  private static reporterName = "reportportal";
  private launchId: string;
  private client: ReportPortalClient;
  private storage = new Storage();
  private tempLaunchId: string;
  private readonly reporterOptions: ReporterOptions;
  private isMultiremote: boolean;
  private isCucumberFramework: boolean;
  private sanitizedCapabilities: string;
  private sessionId: string;
  private rpPromisesCompleted = true;
  private specFilePath: string;
  private featureStatus: STATUS;
  private featureName: string;
  private currentTestAttributes: Attribute[] = [];
  private currentSuiteAttributes: Attribute[] = []
  private currentSuiteDescription: string[] = []
  private suitesDescription: string[] = []

  constructor(options: any) {
    super(options);
    this.reporterOptions = Object.assign(new ReporterOptions(), options);
    this.registerListeners();

    if (this.reporterOptions.cucumberNestedSteps) {
      this.featureStatus = STATUS.PASSED;
    }
  }

  onSuiteStart(suite) {
    log.debug(`Start suite ${suite.title} ${suite.uid}`);
    this.specFilePath = suite.file;
    const isCucumberFeature = suite.type === CUCUMBER_TYPE.FEATURE;
    const isCucumberScenario = suite.type === CUCUMBER_TYPE.SCENARIO;
    const suiteStartObj = this.reporterOptions.cucumberNestedSteps ?
      new StartTestItem(suite.title, isCucumberFeature ? TYPE.TEST : TYPE.STEP) :
      new StartTestItem(suite.title, TYPE.SUITE);
    if (isCucumberFeature) {
      addSauceLabAttributes(this.reporterOptions, suiteStartObj, this.sessionId);
    }
    if (isCucumberScenario) {
      suiteStartObj.codeRef = getRelativePath(this.specFilePath) + ':' + suite.uid.replace(suite.title, '').trim();
    }
    if (this.reporterOptions.cucumberNestedSteps && this.reporterOptions.autoAttachCucumberFeatureToScenario) {
      switch (suite.type) {
        case CUCUMBER_TYPE.FEATURE:
          this.featureName = suite.title;
          break;
        case CUCUMBER_TYPE.SCENARIO:
          suiteStartObj.attributes = [
            {
              key: CUCUMBER_TYPE.FEATURE,
              value: this.featureName,
            },
          ];
          if (this.reporterOptions.setRetryTrue) {
            suiteStartObj.retry = true;
          }
          break;
      }
    }
    const suiteItem = this.storage.getCurrentSuite();
    let parentId = null;
    if (suiteItem !== null) {
      parentId = suiteItem.id;
    }
    if (this.reporterOptions.parseTagsFromTestTitle) {
      suiteStartObj.addTags();
    }

    suiteStartObj.description = [...this.suitesDescription, ...this.currentSuiteDescription].join('\n')
    const {tempId, promise} = this.client.startTestItem(
      suiteStartObj,
      this.tempLaunchId,
      parentId,
    );
    promiseErrorHandler(promise);
    this.storage.addSuite(new StorageEntity(suiteStartObj.type, tempId, promise, suite));
  }

  onSuiteEnd(suite) {
    log.debug(`End suite ${suite.title} ${suite.uid}`);

    const isSomeTestFailed = suite.tests.some(({ state }) => state === WDIO_TEST_STATUS.FAILED);
    let suiteStatus = isSomeTestFailed ? STATUS.FAILED : STATUS.PASSED;
    if (this.reporterOptions.cucumberNestedSteps) {
      switch (suite.type) {
        case CUCUMBER_TYPE.SCENARIO:
          const scenarioStepsAllPassed = suite.tests.every(({state}) => state === WDIO_TEST_STATUS.PASSED);
          const scenarioStepsSkipped = isSomeTestFailed ? false : suite.tests.some(({ state }) => state === WDIO_TEST_STATUS.SKIPPED);
          suiteStatus = scenarioStepsAllPassed ? STATUS.PASSED : scenarioStepsSkipped ? STATUS.SKIPPED : STATUS.FAILED;
          this.featureStatus = this.featureStatus === STATUS.PASSED && suiteStatus === STATUS.PASSED ? STATUS.PASSED : STATUS.FAILED;
          break;
        case CUCUMBER_TYPE.FEATURE:
          suiteStatus = this.featureStatus;
          break;
      }
    }

    const suiteItem = this.storage.getCurrentSuite();
    const finishSuiteObj = suiteStatus === STATUS.SKIPPED ? new EndTestItem(STATUS.SKIPPED, new Issue("NOT_ISSUE")) : {status: suiteStatus, attributes: this.currentSuiteAttributes, description: [...this.suitesDescription, ...this.currentSuiteDescription].join('\n')};

    const {promise} = this.client.finishTestItem(suiteItem.id, finishSuiteObj);
    promiseErrorHandler(promise);
    this.currentSuiteDescription = []
    this.storage.removeSuite();
  }

  onTestStart(test, type = TYPE.STEP) {
    log.debug(`Start test ${test.title} ${test.uid}`);
    if (this.storage.getCurrentTest()) {
      return;
    }
    const suite = this.storage.getCurrentSuite();
    const testStartObj = new StartTestItem(test.title, type);
    if(this.isCucumberFramework) {
      addCodeRefCucumber(this.specFilePath, test, testStartObj)
    } else {
      addCodeRef(this.specFilePath, test.fullTitle, testStartObj)
    }
    if (this.reporterOptions.cucumberNestedSteps) {
      testStartObj.hasStats = false;
    } else {
      addSauceLabAttributes(this.reporterOptions, testStartObj, this.sessionId);
    }
    if (this.reporterOptions.parseTagsFromTestTitle) {
      testStartObj.addTags();
    }
    if (this.reporterOptions.setRetryTrue) {
      testStartObj.retry = true;
    }
    addBrowserParam(this.sanitizedCapabilities, testStartObj);

    const {tempId, promise} = this.client.startTestItem(
      testStartObj,
      this.tempLaunchId,
      suite.id,
    );
    promiseErrorHandler(promise);

    this.storage.addTest(test.uid, new StorageEntity(testStartObj.type, tempId, promise, test));
    return promise;
  }

  onTestPass(test) {
    log.debug(`Pass test ${test.title} ${test.uid}`);
    this.testFinished(test, STATUS.PASSED);
  }

  onTestFail(test) {
    log.debug(`Fail test ${test.title} ${test.uid} ${test.error.stack}`);
    const testItem = this.storage.getCurrentTest();
    if (testItem === null) {
      this.onTestStart(test, TYPE.BEFORE_METHOD);
    }
    this.testFinished(test, STATUS.FAILED);
  }

  onTestSkip(test) {
    log.debug(`Skip test ${test.title} ${test.uid}`);
    const testItem = this.storage.getCurrentTest();
    if (testItem === null) {
      this.onTestStart(test);
    }
    this.testFinished(test, STATUS.SKIPPED, new Issue("NOT_ISSUE"));
  }

  testFinished(test: any, status: STATUS, issue ?: Issue) {
    log.debug(`Finish test ${test.title} ${test.uid}`);
    const testItem = this.storage.getCurrentTest();
    if (testItem === null) {
      return;
    }
    const finishTestObj = new EndTestItem(status, issue);
    if (status === STATUS.FAILED) {
      const stacktrace = test.error.stack;
      const message = this.reporterOptions.sanitizeErrorMessages ?
        stacktrace.replace(ansiRegex(), '') : `${stacktrace}`;
      finishTestObj.description = `❌ ${message}`;
      this.client.sendLog(testItem.id, {
        level: LEVEL.ERROR,
        message,
      });
    }
    finishTestObj.attributes = [...this.currentTestAttributes];
    const {promise} = this.client.finishTestItem(testItem.id, finishTestObj);
    promiseErrorHandler(promise);

    this.storage.removeTest(testItem);
    this.currentTestAttributes = [];
  }

  onRunnerStart(runner) {
    log.debug(`Runner start`);
    this.rpPromisesCompleted = false;
    this.isMultiremote = runner.isMultiremote;
    this.sanitizedCapabilities = runner.sanitizedCapabilities;
    this.sessionId = runner.sessionId;
    this.isCucumberFramework = runner.config.framework === 'cucumber'
    this.client = this.getReportPortalClient();
    this.launchId = process.env.RP_LAUNCH_ID;
    const startLaunchObj = {
      attributes: this.reporterOptions.reportPortalClientConfig.attributes,
      description: this.reporterOptions.reportPortalClientConfig.description,
      id: this.launchId,
      mode: this.reporterOptions.reportPortalClientConfig.mode,
      rerun: false,
      rerunOf: null,
    };
    if (runner.retry > 0) {
      delete startLaunchObj.id;
      startLaunchObj.rerun = true;
      startLaunchObj.rerunOf = this.launchId;
      const result = this.client.startLaunch(startLaunchObj);
      this.tempLaunchId = result.tempId;
    } else {
      const {tempId} = this.client.startLaunch(startLaunchObj);
      this.tempLaunchId = tempId;
    }
  }

  async onRunnerEnd(runnerStats) {
    log.debug(`Runner end`);
    try {
      return await this.client.getPromiseFinishAllItems(this.tempLaunchId);
    } catch (e) {
      log.error("An error occurs on finish test items");
      log.error(e);
    } finally {
      this.isSynchronised = true;
      log.debug(`Runner end sync`);
    }
  }

  onBeforeCommand(command) {
    if (!this.reporterOptions.reportSeleniumCommands || this.isMultiremote) {
      return;
    }

    const method = `${command.method} ${command.endpoint}`;
    if (!isEmpty(command.body)) {
      const data = JSON.stringify(limit(command.body));
      this.sendLog({message: `${method} ${data}`, level: this.reporterOptions.seleniumCommandsLogLevel});
    } else {
      this.sendLog({message: `${method}`, level: this.reporterOptions.seleniumCommandsLogLevel});
    }
  }

  onAfterCommand(command) {
    if (this.isMultiremote) {
      return;
    }
    const isScreenshot = isScreenshotCommand(command) && command.result.value;
    const {autoAttachScreenshots, screenshotsLogLevel, seleniumCommandsLogLevel, reportSeleniumCommands} = this.reporterOptions;
    if (isScreenshot) {
      if (autoAttachScreenshots) {
        const obj = {
          content: command.result.value,
          level: screenshotsLogLevel,
          name: "screenshot.png",
          message: "screenshot"
        };
        this.sendFile(obj);
      }
    }

    if (reportSeleniumCommands) {
      if (command.body && !isEmpty(command.result.value)) {
        delete command.result.sessionId;
        const data = JSON.stringify(limit(command.result));
        this.sendLog({message: `${data}`, level: seleniumCommandsLogLevel});
      }
    }
  }

  onHookStart(hook) {
    log.debug(`Start hook ${hook.title} ${hook.uid}`);
  }

  onHookEnd(hook) {
    log.debug(`End hook ${hook.title} ${hook.uid} ${JSON.stringify(hook)}`);
    if (hook.error) {
      const testItem = this.storage.getCurrentTest();
      if (testItem === null) {
        this.onTestStart(hook, TYPE.BEFORE_METHOD);
      }
      this.testFinished(hook, STATUS.FAILED);
    }
  }

  private getReportPortalClient(): ReportPortalClient{
    return new ReportPortalClient(this.reporterOptions.reportPortalClientConfig);
  }

  private addDescriptionToCurrentSuite(description: string) {
    this.currentSuiteDescription.push(description)
  }

  private addDescriptionToAllSuites(description: string) {
    this.suitesDescription.push(description)
  }

  private addAttribute(attribute: Attribute) {
    this.currentTestAttributes.push({...attribute})
  }

  private addAttributeToSuite(attribute: Attribute){
    this.currentSuiteAttributes.push(attribute)
  }

  private finishTestManually(event: any) {
    const testItem = this.storage.getCurrentTest();
    if (testItem === null) {
      return;
    }
    const err = {
      stack: event.test.error,
    };
    const test = {
      error: err,
      title: testItem.wdioEntity.title,
      uid: testItem.wdioEntity.uid,
    };
    this.testFinished(test, STATUS.FAILED);
  }

  private sendLog(event: any) {
    const testItem = this.storage.getCurrentTest();
    if (testItem === null) {
      log.warn("Cannot send log message. There is no running tests");
      return;
    }

    const {promise} = this.client.sendLog(testItem.id, {
      level: event.level,
      message: String(event.message),
    });
    promiseErrorHandler(promise);
  }

  private sendFile({level, name, content, type = "image/png", message = ""}) {
    const testItem = this.storage.getCurrentTest();
    if (!testItem) {
      log.warn(`Can not send file to test. There is no running tests`);
      return;
    }

    const {promise} = this.client.sendLog(testItem.id, {level , message}, {name, content, type, message});
    promiseErrorHandler(promise);
  }

  private async sendLogToTest({test, level, message}) {
    const testObj = this.storage.getStartedTests().reverse().find((startedTest) => {
      return startedTest.wdioEntity.title === test.title;
    });

    if (!testObj) {
      log.warn(`Can not send log to test ${test.title}`);
      return;
    }
    const rs = await testObj.promise;

    const saveLogRQ = {
      itemUuid: rs.id,
      launchUuid: this.launchId,
      level,
      message,
      time: this.now(),
    };

    const url = [this.client.baseURL, "log"].join("/");
    const promise = this.client.helpers.getServerResult(url, saveLogRQ, {headers: this.client.headers}, "POST");
    promiseErrorHandler(promise);
  }

  private async sendFileToTest({test, level, name, content, type = "image/png", message = ""}) {
    const testObj = this.storage.getStartedTests().reverse().find((startedTest) => {
      return startedTest.wdioEntity.title === test.title;
    });
    if (!testObj) {
      log.warn(`Can not send file to test ${test.title}`);
      return;
    }
    const rs = await testObj.promise;

    const saveLogRQ = {
      itemUuid: rs.id,
      launchUuid: this.launchId,
      level,
      message,
      time: this.now(),
    };
    // to avoid https://github.com/BorisOsipov/wdio-reportportal-reporter/issues/42#issuecomment-456573592
    const fileName = createHash("md5").update(name).digest("hex");
    const extension = path.extname(name) || ".dat";
    const promise = this.client.getRequestLogWithFile(saveLogRQ, {name: `${fileName}${extension}`, content, type});
    promiseErrorHandler(promise);
  }

  private registerListeners() {
    process.on(EVENTS.RP_LOG, this.sendLog.bind(this));
    process.on(EVENTS.RP_FILE, this.sendFile.bind(this));
    process.on(EVENTS.RP_TEST_LOG, this.sendLogToTest.bind(this));
    process.on(EVENTS.RP_TEST_FILE, this.sendFileToTest.bind(this));
    process.on(EVENTS.RP_TEST_RETRY, this.finishTestManually.bind(this));
    process.on(EVENTS.RP_TEST_ATTRIBUTES, this.addAttribute.bind(this));
    process.on(EVENTS.RP_SUITE_ATTRIBUTES, this.addAttributeToSuite.bind(this));
    process.on(EVENTS.RP_SUITE_ADD_DESCRIPTION, this.addDescriptionToCurrentSuite.bind(this))
    process.on(EVENTS.RP_ALL_SUITE_ADD_DESCRIPTION, this.addDescriptionToAllSuites.bind(this))
  }

  private now() {
    return this.client.helpers.now();
  }
}

export = ReportPortalReporter;
