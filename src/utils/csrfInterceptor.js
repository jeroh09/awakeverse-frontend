// src/utils/csrfInterceptor.js
/**
 * Global fetch interceptor to add CSRF token to ALL requests
 * Import this ONCE in your index.js or App.js
 */

// Store original fetch
const originalFetch = window.fetch;

// Override global fetch
window.fetch = function(...args) {
  let [url, config = {}] = args;

  // Get CSRF token from cookie
  const csrfMatch = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/);
  const csrfToken = csrfMatch ? decodeURIComponent(csrfMatch[1]) : null;

  // Add CSRF token for unsafe methods (POST, PUT, PATCH, DELETE)
  const method = (config.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && csrfToken) {
    config.headers = {
      ...config.headers,
      'X-CSRF-Token': csrfToken
    };
  }

  // Ensure credentials are included
  if (config.credentials === undefined) {
    config.credentials = 'include';
  }

  // Call original fetch with modified config
  return originalFetch(url, config);
};

console.log('🔐 CSRF interceptor installed - all fetch requests will include CSRF token');