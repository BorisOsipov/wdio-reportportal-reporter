const sendToReporter = (event, msg = {}) => {
  process.send({ event, ...msg });
};

const sendLog = (level, message) => {
  sendToReporter('rp:log', { level, message });
};

module.exports = { sendLog };

