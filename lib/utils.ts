// @ts-ignore
import logger from "@wdio/logger";
import validator from "validator";
import {StartTestItem} from "./entities";
const stringify = require("json-stringify-safe");

const OBJLENGTH = 10;
const ARRLENGTH = 10;
const STRINGLIMIT = 1000;
const STRINGTRUNCATE = 200;
const TAGS_PATTERN = /\B@[a-z0-9_-]+/gi;
const log = logger("wdio-reportportal-reporter");

export const promiseErrorHandler = (promise: Promise<any>) => {
  promise.catch((err) => {
    log.error(err);
  });
};

export const isEmpty = (object: object) => !object || Object.keys(object).length === 0;
/**
 * Limit the length of an arbitrary variable of any type, suitable for being logged or displayed
 * @param  {Any} val Any variable
 * @return {Any} Limited var of same type
 */
export const limit = (val: any) => {
  if (!val) { return val; }
  // Ensure we're working with a copy
  let value = JSON.parse(stringify(val));

  switch (Object.prototype.toString.call(value)) {
    case "[object String]":
      if (value.length > 100 && validator.isBase64(value)) {
        return `[base64] ${value.length} bytes`;
      }

      if (value.length > STRINGLIMIT) {
        return `${value.substr(0, STRINGTRUNCATE)} ... (${value.length - STRINGTRUNCATE} more bytes)`;
      }

      return value;
    case "[object Array]": {
      const { length } = value;
      if (length > ARRLENGTH) {
        value = value.slice(0, ARRLENGTH);
        value.push(`(${length - ARRLENGTH} more items)`);
      }
      return value.map(limit);
    }
    case "[object Object]": {
      const keys = Object.keys(value);
      const removed = [];
      for (let i = 0, l = keys.length; i < l; i += 1) {
        if (i < OBJLENGTH) {
          value[keys[i]] = limit(value[keys[i]]);
        } else {
          delete value[keys[i]];
          removed.push(keys[i]);
        }
      }
      if (removed.length) {
        value._ = `${keys.length - OBJLENGTH} more keys: ${JSON.stringify(removed)}`;
      }
      return value;
    }
    default: {
      return value;
    }
  }
};

export const addBrowserParam = (browser: string, testItem: StartTestItem) => {
  if (browser) {
    const param = {key: "browser", value: browser};
    if (Array.isArray(testItem.parameters)) {
      testItem.parameters.push(param);
      return;
    }
    testItem.parameters = [param];
  }
};

export const addDescription = (description: string, testItem: StartTestItem) => {
  if (description) {
    testItem.description = description;
  }
};

export const parseTags = (text: string): string[] => ("" + text).match(TAGS_PATTERN) || [];

export const isScreenshotCommand = (command: any) => {
  const isScrenshotEndpoint = /\/session\/[^/]*\/screenshot/;
  return isScrenshotEndpoint.test(command.endpoint);
};

export const sendToReporter = (event: any, msg = {}) => {
  // @ts-ignore
  process.emit(event, msg);
};
