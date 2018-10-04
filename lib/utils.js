/* eslint-disable no-console,no-param-reassign,class-methods-use-this */
const stringify = require('json-stringify-safe');

const OBJLENGTH = 10;
const ARRLENGTH = 10;
const STRINGLIMIT = 1000;
const STRINGTRUNCATE = 200;
const notBase64 = /[^A-Z0-9+/=]/i;

class Logger {
  constructor(debug = false) {
    this.debug = debug;
  }

  info(msg) {
    console.log(msg);
  }

  error(msg) {
    console.error(msg);
  }

  warn(msg) {
    if (this.debug) {
      console.warn(msg);
    }
  }
}

const logger = new Logger();
const promiseErrorHandler = (promise) => {
  promise.catch((err) => {
    logger.error(err);
  });
};

const isEmpty = object => !object || Object.keys(object).length === 0;

const isBase64 = (str) => {
  if (typeof str !== 'string') {
    return false;
  }

  const len = str.length;
  if (!len || len % 4 !== 0 || notBase64.test(str)) {
    return false;
  }

  const firstPaddingChar = str.indexOf('=');
  return firstPaddingChar === -1 ||
    firstPaddingChar === len - 1 ||
    (firstPaddingChar === len - 2 && str[len - 1] === '=');
};

/**
 * Limit the length of an arbitrary variable of any type, suitable for being logged or displayed
 * @param  {Any} val Any variable
 * @return {Any} Limited var of same type
 */
const limit = (val) => {
  if (!val) return val;
  // Ensure we're working with a copy
  let value = JSON.parse(stringify(val));

  switch (Object.prototype.toString.call(value)) {
    case '[object String]':
      if (value.length > 100 && isBase64(value)) {
        return `[base64] ${value.length} bytes`;
      }

      if (value.length > STRINGLIMIT) {
        return `${value.substr(0, STRINGTRUNCATE)} ... (${value.length - STRINGTRUNCATE} more bytes)`;
      }

      return value;
    case '[object Array]': {
      const { length } = value;
      if (length > ARRLENGTH) {
        value = value.slice(0, ARRLENGTH);
        value.push(`(${length - ARRLENGTH} more items)`);
      }
      return value.map(limit);
    }
    case '[object Object]': {
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

const sendToReporter = (event, msg = {}) => {
  process.send({ event, ...msg });
};

module.exports = {
  promiseErrorHandler, Logger, isEmpty, limit, sendToReporter,
};
