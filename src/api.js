// src/api.js - Fixed base URL to prevent double /api
import axios from 'axios';
import environment from './config/environment';

const isPreview = process.env.REACT_APP_VERCEL_ENV === 'preview' || 
                  process.env.VERCEL_ENV === 'preview';

const api = axios.create({
  // FIXED: Remove /api from baseURL - components already include it
  baseURL: environment.API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// Smart Request Interceptor with Preview Debugging
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    
    // Token debugging for preview builds
    if (isPreview) {
      console.log('🔍 [PREVIEW] API Request with Token:', {
        url: config.url,
        method: config.method,
        tokenPreview: token.substring(0, 20) + '...', // First 20 chars only
        timestamp: new Date().toISOString()
      });
    }
  } else if (isPreview) {
    console.log('🔍 [PREVIEW] API Request without Token:', config.url);
  }
  
  return config;
});

// Response Interceptor with Preview Debugging
api.interceptors.response.use(
  response => {
    if (isPreview) {
      console.log('🔍 [PREVIEW] API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  error => {
    if (isPreview) {
      console.error('🔍 [PREVIEW] API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message
      });
    }
    
    // Handle 401 logout
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;