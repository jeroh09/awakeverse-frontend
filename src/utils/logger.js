// src/utils/logger.js - SECURE VERSION
const logLevels = {
  ERROR: 0,
  WARN: 1, 
  INFO: 2,
  DEBUG: 3
};

const getCurrentLevel = () => {
  if (process.env.NODE_ENV === 'production') return logLevels.WARN;
  return logLevels.DEBUG;
};

const currentLevel = getCurrentLevel();

// Safe console logging (user CAN see these)
const safeConsoleLog = (level, message, data = {}) => {
  const sanitizedData = sanitizeFrontendData(data);
  
  switch(level) {
    case 'error': console.error(`[${level.toUpperCase()}]`, message, sanitizedData); break;
    case 'warn': console.warn(`[${level.toUpperCase()}]`, message, sanitizedData); break;
    case 'info': console.info(`[${level.toUpperCase()}]`, message, sanitizedData); break;
    case 'debug': console.debug(`[${level.toUpperCase()}]`, message, sanitizedData); break;
  }
};

// Backend logging (user CANNOT see these)
const sendToBackend = async (level, message, data = {}) => {
  try {
    await fetch('/api/client-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        message,
        data, // Send original data to backend (it will sanitize)
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    // Silent fail - don't log logging failures
  }
};

// Remove sensitive data from frontend logs
const sanitizeFrontendData = (data) => {
  const sanitized = { ...data };
  const sensitiveFields = ['token', 'password', 'authorization', 'email'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
    if (sanitized.headers && sanitized.headers[field]) {
      sanitized.headers[field] = '[REDACTED]';
    }
    if (sanitized.headers && sanitized.headers.Authorization) {
      sanitized.headers.Authorization = '[REDACTED]';
    }
  });
  
  return sanitized;
};

export const logger = {
  error: (message, data = {}) => {
    if (currentLevel >= logLevels.ERROR) {
      safeConsoleLog('error', message, data);
      sendToBackend('error', message, data);
    }
  },
  
  warn: (message, data = {}) => {
    if (currentLevel >= logLevels.WARN) {
      safeConsoleLog('warn', message, data);
      sendToBackend('warn', message, data);
    }
  },
  
  info: (message, data = {}) => {
    if (currentLevel >= logLevels.INFO) {
      safeConsoleLog('info', message, data);
      if (process.env.NODE_ENV === 'production') {
        sendToBackend('info', message, data);
      }
    }
  },
  
  debug: (message, data = {}) => {
    if (currentLevel >= logLevels.DEBUG) {
      safeConsoleLog('debug', message, data);
      // Don't send debug logs to backend in production
    }
  }
};