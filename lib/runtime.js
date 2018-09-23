const { events } = require('./constants');

const sendToReporter = (event, msg = {}) => {
  process.send({ event, ...msg });
};

const sendLog = (level, message) => {
  sendToReporter(events.RP_LOG, { level, message });
};

const sendFile = (level, name, content, type = 'image/png') => {
  // eslint-disable-next-line object-curly-newline
  sendToReporter(events.RP_FILE, { level, name, content, type });
};

const sendLogToLastFailedTest = (level, message) => {
  sendToReporter(events.RP_FAILED_LOG, { level, message });
};

const sendFileToLastFailedTest = (level, name, content, type = 'image/png') => {
  // eslint-disable-next-line object-curly-newline
  sendToReporter(events.RP_FAILED_FILE, { level, name, content, type });
};

module.exports = {
  sendLog, sendFile, sendLogToLastFailedTest, sendFileToLastFailedTest,
};

