const stringify = require("json-stringify-safe");

const OBJLENGTH = 10;
const ARRLENGTH = 10;
const STRINGLIMIT = 1000;
const STRINGTRUNCATE = 200;
const notBase64 = /[^A-Z0-9+/=]/i;
const TAGS_PATTERN = /\B@[a-z0-9_-]+/gi;

export class Logger {
  private debug = false;
  constructor(debug = false) {
    this.debug = debug;
  }

  public info(msg: string) {
    // tslint:disable-next-line
    console.log(msg);
  }

  public error(msg: string) {
    // tslint:disable-next-line
    console.error(msg);
  }

  public warn(msg: string) {
    if (this.debug) {
      // tslint:disable-next-line
      console.warn(msg);
    }
  }
}

const logger = new Logger();
export const promiseErrorHandler = (promise: Promise<any>) => {
  promise.catch((err) => {
    logger.error(err);
  });
};

export const isEmpty = (object: object) => !object || Object.keys(object).length === 0;

const isBase64 = (str: string) => {
  if (typeof str !== "string") {
    return false;
  }

  const len = str.length;
  if (!len || len % 4 !== 0 || notBase64.test(str)) {
    return false;
  }

  const firstPaddingChar = str.indexOf("=");
  return firstPaddingChar === -1 ||
    firstPaddingChar === len - 1 ||
    (firstPaddingChar === len - 2 && str[len - 1] === "=");
};

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
      if (value.length > 100 && isBase64(value)) {
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

export const addTagsToSuite = (tags, suiteStartObj) => {
  if (tags && tags.length > 0) {
    if (tags[0].name) {
      suiteStartObj.tags = tags.map((tag) => tag.name);
    } else {
      suiteStartObj.tags = tags;
    }
  }
};

export const addBrowserParam = (browser, testStartObj) => {
  if (browser) {
    const param = {key: "browser", value: browser};
    testStartObj.parameters = [param];
  }
};

export const addDescription = (description, suiteStartObj) => {
  if (description) {
    suiteStartObj.description = description;
  }
};

export const getBrowserDescription = (capabilities, cid) => {
  if (capabilities && !isEmpty(capabilities)) {
    const targetName = capitalizeFirstLetter(capabilities.browserName || capabilities.deviceName || cid);
    const version = capabilities.version || capabilities.platformVersion;
    const browser = version ? `${targetName} v.${version}` : `${targetName}`;
    const browserWithPlatform = capabilities.platform ?
      `${browser} on ${capitalizeFirstLetter(capabilities.platform)}`
      : browser;

    return browserWithPlatform;
  }
  return "";
};

const capitalizeFirstLetter = (val: string) => {
  if (val) {
    return val.charAt(0).toUpperCase() + val.toLowerCase().slice(1);
  }
  return val;
};

export const parseTags = (text: string): string[] => ("" + text).match(TAGS_PATTERN) || [];

export const sendToReporter = (event: any, msg = {}) => {
  process.send({ event, ...msg });
};
