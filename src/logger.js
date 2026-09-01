/**
 * Structured Logger for DevOps Monitoring (CloudWatch / Docker stdout)
 */

function formatLog(level, message, meta = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    service: 'edugrade-app',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    message,
    ...meta,
  };
  return JSON.stringify(logEntry);
}

const logger = {
  info: (message, meta) => console.log(formatLog('info', message, meta)),
  warn: (message, meta) => console.warn(formatLog('warn', message, meta)),
  error: (message, meta) => console.error(formatLog('error', message, meta)),
  debug: (message, meta) => {
    if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
      console.log(formatLog('debug', message, meta));
    }
  },
};

module.exports = logger;
