import {LEVEL, MODE} from "./constants";

export class Attribute {
  public key?: string;
  public value?: string;

  constructor(key?: string, value?: string) {
    this.key = key;
    this.value = value;
  }
}
export class SauceLabOptions {
  public enabled: boolean
  public sldc?: string;

  constructor(enabled: boolean, sldc?: string) {
    this.enabled = enabled;
    this.sldc = sldc;
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
  public sauceLabOptions?: SauceLabOptions
  public cucumberNestedSteps = false;
  public autoAttachCucumberFeatureToScenario = false;
  public sanitizeErrorMessages = true;
  public reportPortalClientConfig = {mode: MODE.DEFAULT, attributes: [Attribute], description: ""};
}
