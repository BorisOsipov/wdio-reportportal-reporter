import Reporter from "@wdio/reporter";
import { LEVEL } from "./lib/constants";
declare class ReportPortalReporter extends Reporter {
  public static sendLog(level: LEVEL, message: any): void;
  public static sendFile(level: LEVEL, name: string, content: any, type?: string): void;
  public static sendLogToTest(test: any, level: LEVEL, message: any): void;
  public static sendFileToTest(test: any, level: LEVEL, name: string, content: any, type?: string): void;
  constructor(options: any);
}
export = ReportPortalReporter;
