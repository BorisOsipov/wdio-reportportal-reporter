const { events } = require('./constants');

const sendToReporter = (event, msg = {}) => {
  process.send({ event, ...msg });
};

const sendLog = (level, message) => {
  sendToReporter(events.RPLOG, { level, message });
};

const sendFile = (level, name, content, type = 'image/png') => {
  // eslint-disable-next-line object-curly-newline
  sendToReporter(events.RPFILE, { level, name, content, type });
};


module.exports = { sendLog, sendFile };

