/* eslint-disable object-curly-newline */
const testItemStatuses = { PASSED: 'passed', FAILED: 'failed', SKIPPED: 'skipped' };
const logLevels = {
  ERROR: 'error', TRACE: 'trace', DEBUG: 'debug', INFO: 'info', WARN: 'warn',
};
const events = { RPLOG: 'rp:log', RPFILE: 'rp:file' };
const entityType = { SUITE: 'SUITE', TEST: 'STEP' };

module.exports = { testItemStatuses, logLevels, events, entityType };

