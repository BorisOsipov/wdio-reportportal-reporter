import {LEVEL, MODE} from "./constants";

export class Attribute {
  public key?: string;
  public value?: string;

  constructor(key?: string, value?: string) {
    this.key = key;
    this.value = value;
  }
}

export default class ReporterOptions {
  public debug = false;
  public autoAttachScreenshots = false;
  public screenshotsLogLevel = LEVEL.INFO;
  public reportSeleniumCommands = false;
  public seleniumCommandsLogLevel = LEVEL.DEBUG;
  public parseTagsFromTestTitle = false;
  public setRetryTrue = false;
  public cucumberNestedSteps = false;
  public autoAttachCucumberFeatureToScenario = false;
  public reportPortalClientConfig = {mode: MODE.DEFAULT, attributes: [Attribute], description: ""};
}
