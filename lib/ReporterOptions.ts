import {LEVEL, MODE} from "./constants";

export default class ReporterOptions {
  public debug = false;
  public autoAttachScreenshots = false;
  public screenshotsLogLevel = LEVEL.INFO;
  public reportSeleniumCommands = false;
  public seleniumCommandsLogLevel = LEVEL.DEBUG;
  public parseTagsFromTestTitle = false;
  public reportPortalClientConfig = {mode: MODE.DEFAULT, tags: [], description: ""};
}
