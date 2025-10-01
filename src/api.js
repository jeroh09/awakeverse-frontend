// src/api.js - SECURE BUT NON-BREAKING VERSION
import axios from 'axios';
import environment from './config/environment';

const api = axios.create({
  baseURL: `${environment.API_BASE_URL}/api`,
  timeout: 10000,
  withCredentials: true,
});

// IDENTICAL functionality, just removed token logging
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // REMOVED: Token debugging logs
  // KEPT: All actual functionality
  return config;
});

// IDENTICAL functionality, just removed response logging
api.interceptors.response.use(
  response => {
    // REMOVED: Response logging
    // KEPT: All actual response handling
    return response;
  },
  error => {
    // KEPT: Error handling (including 401 redirect)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;