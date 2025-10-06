// src/api.js - COMPLETE UPDATED VERSION WITH SCENARIO ENDPOINTS
import axios from 'axios';
import environment from './config/environment';

const api = axios.create({
  baseURL: `${environment.API_BASE_URL}/api`,
  timeout: 10000,
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Response interceptor
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// ============================================================================
// SCENARIO & DEBATE API METHODS
// ============================================================================

// Template endpoints (public)
export const getTemplates = (category = null) => {
  const url = category 
    ? `/debate/templates?category=${category}`
    : '/debate/templates';
  return api.get(url).then(r => r.data);
};

export const getTemplateDetail = (templateId) => {
  return api.get(`/debate/templates/${templateId}`).then(r => r.data);
};

export const getCategories = () => {
  return api.get('/debate/templates/categories').then(r => r.data);
};

// Scenario endpoints (auth required)
export const createScenario = (scenarioData) => {
  return api.post('/debate/scenarios/create', scenarioData).then(r => r.data);
};

export const getMyScenarios = () => {
  return api.get('/debate/scenarios/my-scenarios').then(r => r.data);
};

export const getScenarioDetail = (scenarioId) => {
  return api.get(`/debate/scenarios/${scenarioId}`).then(r => r.data);
};

export const deleteScenario = (scenarioId) => {
  return api.delete(`/debate/scenarios/${scenarioId}`).then(r => r.data);
};

// Debate endpoints
export const createDebate = (debateData) => {
  return api.post('/debate/create', debateData).then(r => r.data);
};

export const getDebate = (debateId) => {
  return api.get(`/debate/${debateId}`).then(r => r.data);
};

export const deleteDebate = (debateId) => {
  return api.delete(`/debate/${debateId}`).then(r => r.data);
};

export const listDebates = () => {
  return api.get('/debate/list').then(r => r.data);
};

// Usage tracking
export const getScenarioUsage = (scenarioId) => {
  return api.get(`/debate/scenarios/${scenarioId}/usage`).then(r => r.data);
};

// Streaming message - uses fetch directly for streaming
export const postDebateMessage = async (debateId, message, token) => {
  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';
  const response = await fetch(`${API_BASE}/api/debate/${debateId}/message`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response; // Return response for streaming handling
};

// ============================================================================
// EXISTING PREMIUM API METHODS (keep these)
// ============================================================================

export const getUserSubscriptionStatus = (userId) => {
  return api.get(`/premium/user_subscription/${userId}`).then(r => r.data);
};

export const getAvailableTiers = () => {
  return api.get('/premium/subscription/tiers').then(r => r.data);
};

export const createSubscription = (subscriptionData) => {
  return api.post('/premium/subscription/create', subscriptionData).then(r => r.data);
};

export const getPremiumCharacters = () => {
  return api.get('/premium/characters').then(r => r.data);
};

export const createPremiumCharacter = (characterData) => {
  return api.post('/premium/characters', characterData).then(r => r.data);
};

export const getCharacterTemplates = () => {
  return api.get('/premium/templates?per_page=100').then(r => r.data);
};

// ============================================================================
// EXISTING AUTH & USER METHODS (keep these)
// ============================================================================

export const login = (credentials) => {
  return api.post('/auth/login', credentials).then(r => r.data);
};

export const register = (userData) => {
  return api.post('/auth/register', userData).then(r => r.data);
};

export const getCurrentUser = () => {
  return api.get('/auth/me').then(r => r.data);
};

export const updateUserProfile = (userData) => {
  return api.put('/auth/profile', userData).then(r => r.data);
};

// ============================================================================
// EXISTING CHAT & DISCOVERY METHODS (keep these)
// ============================================================================

export const getChatHistory = (characterId) => {
  return api.get(`/chat/history/${characterId}`).then(r => r.data);
};

export const sendChatMessage = (characterId, message) => {
  return api.post(`/chat/message/${characterId}`, { message }).then(r => r.data);
};

export const getDiscoveredCharacters = () => {
  return api.get('/discovered-characters').then(r => r.data);
};

export const addDiscoveredCharacter = (characterData) => {
  return api.post('/discovered-characters', characterData).then(r => r.data);
};

export const removeDiscoveredCharacter = (characterKey) => {
  return api.delete(`/discovered-characters/${characterKey}`).then(r => r.data);
};

// Export the axios instance for direct use
export default api;