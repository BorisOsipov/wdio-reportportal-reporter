/* eslint-disable no-console */

const logger = {
  info(msg) {
    console.log(msg);
  },
  error(msg) {
    console.error(msg);
  },
  warn(msg) {
    console.warn(msg);
  },
};

const promiseErrorHandler = (promise) => {
  promise.catch((err) => {
    logger.error(err);
  });
};

module.exports = { promiseErrorHandler, logger };
