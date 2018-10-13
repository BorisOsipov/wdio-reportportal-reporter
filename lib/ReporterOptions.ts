import {LEVEL, MODE} from "./constants";

export default class ReporterOptions {
  public debug = false;
  public enableRetriesWorkaround = false;
  public enableScreenshotsReporting = false;
  public enableSeleniumCommandReporting = false;
  public parseTagsFromTestTitle = false;
  public screenshotsLogLevel = LEVEL.INFO;
  public seleniumCommandsLogLevel = LEVEL.DEBUG;
  public rpConfig = {mode: MODE.DEFAULT};
}
