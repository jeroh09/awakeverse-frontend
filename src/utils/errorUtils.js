export const sanitizeError = (error) => {
  if (process.env.NODE_ENV === 'production') {
    // Generic messages for production
    if (error.message?.includes('token')) return 'Authentication failed';
    if (error.message?.includes('database')) return 'Service temporarily unavailable';
    if (error.message?.includes('API')) return 'Request failed';
    if (error.message?.includes('network')) return 'Connection error';
    return 'An error occurred';
  }
  return error.message; // Full errors in development
};

export const sanitizeRequestBody = (body) => {
  if (process.env.NODE_ENV === 'production' && typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      const sanitized = { ...parsed };
      if (sanitized.password) sanitized.password = '[REDACTED]';
      if (sanitized.token) sanitized.token = '[REDACTED]';
      return JSON.stringify(sanitized);
    } catch {
      return '[REQUEST BODY]';
    }
  }
  return body;
};