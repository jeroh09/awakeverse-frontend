// src/api.js - PRODUCTION-SILENT VERSION
import axios from 'axios';
import environment from './config/environment';

const api = axios.create({
  baseURL: `${environment.API_BASE_URL}/api`,
  timeout: 10000,
  withCredentials: true,
});

// Smart Request Interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add retry tracking for smart error handling
  config._retryCount = config._retryCount || 0;
  config._maxRetries = config._maxRetries || (process.env.NODE_ENV === 'development' ? 2 : 0);
  
  return config;
});

// Smart Response Interceptor - Production Silent
api.interceptors.response.use(
  response => response,
  error => {
    const config = error.config;
    
    // Handle 401 logout (keep this - it's important)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // SMART RETRY LOGIC - Silent in production
    if (config && config._retryCount < config._maxRetries) {
      config._retryCount += 1;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 [DEV] Retrying ${config.url} (attempt ${config._retryCount})`);
      }
      
      return new Promise(resolve => {
        setTimeout(() => resolve(api(config)), 1000 * config._retryCount);
      });
    }
    
    // PRODUCTION-SILENT ERROR HANDLING
    if (process.env.NODE_ENV === 'production') {
      // Silence specific noisy errors (your 404 premium status)
      const isNoisyError = 
        error.response?.status === 404 && 
        error.config?.url?.includes('/premium/status');
      
      if (isNoisyError) {
        // Return a graceful fallback instead of throwing
        return Promise.resolve({
          data: { isPremium: false, capabilities: {} },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config
        });
      }
    }
    
    // Development: full error logging
    if (process.env.NODE_ENV === 'development') {
      console.error('🔍 [DEV] API Error:', error.response?.status, error.config?.url);
    }
    
    return Promise.reject(error);
  }
);

// Smart API methods with production silence
export const smartGet = async (url, config = {}) => {
  try {
    const response = await api.get(url, config);
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      // For GET requests, return fallback data instead of throwing
      if (url.includes('/premium/status')) {
        return { isPremium: false, capabilities: {} };
      }
    }
    throw error;
  }
};

export const smartPost = async (url, data, config = {}) => {
  return api.post(url, data, config);
};

export default api;