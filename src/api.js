// src/api.js
import axios from 'axios';
import environment from './config/environment';

const api = axios.create({
  baseURL: `${environment.API_BASE_URL}/api`,
  timeout: 10000, // Increased timeout for production
  withCredentials: true, // Important for CORS
});

// Attach token from localStorage on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token'); // ensure this matches AuthContext storage key
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle global 401 logout
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
