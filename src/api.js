// src/api.js - COMPLETE FIXED VERSION
import axios from 'axios';
import environment from './config/environment';

const api = axios.create({
  baseURL: `${environment.API_BASE_URL}/api`,
  timeout: 10000,
  withCredentials: true,
});


// Request interceptor (cookie session + CSRF)
api.interceptors.request.use(config => {
  // Ensure credentials are sent (HttpOnly cookies)
  config.withCredentials = true;

  // For unsafe methods, attach CSRF header from av_csrf cookie
  const method = (config.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const m = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/);
    if (m && m[1]) {
      config.headers['X-CSRF-Token'] = decodeURIComponent(m[1]);
    }
  }
  return config;
});


// Response interceptor
// Response interceptor with one-time refresh + retry
api.interceptors.response.use(
  response => response,
  async (error) => {
    const { config, response } = error;

    // If no response or not a 401, just bubble up
    if (!response || response.status !== 401) {
      return Promise.reject(error);
    }

    // Prevent infinite loops
    if (config.__retried) {
      // Already retried once: hard fail → redirect to login
      try { window.location.href = '/login'; } catch {}
      return Promise.reject(error);
    }

    // Try refresh once
    try {
      // Attach CSRF header for refresh
      const m = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/);
      const headers = {};
      if (m && m[1]) headers['X-CSRF-Token'] = decodeURIComponent(m[1]);

      await api.post('/auth/refresh', null, { headers });

      // Mark and retry original request
      config.__retried = true;
      return api(config);
    } catch (e) {
      // Refresh failed → go to login
      try { window.location.href = '/login'; } catch {}
      return Promise.reject(error);
    }
  }
);

// ============================================================================
// SCENARIO & DEBATE API METHODS (FIXED WITH PROPER ERROR HANDLING)
// ============================================================================

// Template endpoints (public)
export const getTemplates = async (category = null) => {
  try {
    const url = category 
      ? `/debate/templates?category=${category}`
      : '/debate/templates';
    const response = await api.get(url);
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ getTemplates error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to fetch templates'
    };
  }
};

export const getTemplateDetail = async (templateId) => {
  try {
    const response = await api.get(`/debate/templates/${templateId}`);
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ getTemplateDetail error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to fetch template'
    };
  }
};

export const getCategories = async () => {
  try {
    const response = await api.get('/debate/templates/categories');
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ getCategories error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to fetch categories'
    };
  }
};

// Scenario endpoints (auth required) - FIXED
export const createScenario = async (scenarioData) => {
  try {
    console.log('📤 API: Creating scenario:', scenarioData);
    const response = await api.post('/debate/scenarios/create', scenarioData);
    console.log('✅ API: Scenario created successfully:', response.data);
    
    // Backend returns {message, scenario_id, scenario}
    // Wrap with status for frontend
    return {
      status: 'success',
      scenario: response.data.scenario,
      scenario_id: response.data.scenario_id,
      message: response.data.message
    };
  } catch (error) {
    console.error('❌ createScenario error:', error);
    console.error('Error response:', error.response?.data);
    
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to create scenario'
    };
  }
};

export const getMyScenarios = async () => {
  try {
    const response = await api.get('/debate/scenarios/my-scenarios');
    
    // Backend returns {scenarios, count, limit}
    return {
      status: 'success',
      scenarios: response.data.scenarios || [],
      count: response.data.count || 0,
      limit: response.data.limit || 5
    };
  } catch (error) {
    console.error('❌ getMyScenarios error:', error);
    
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to fetch scenarios',
      scenarios: []
    };
  }
};

export const getScenarioDetail = async (scenarioId) => {
  try {
    const response = await api.get(`/debate/scenarios/${scenarioId}`);
    
    return {
      status: 'success',
      scenario: response.data.scenario
    };
  } catch (error) {
    console.error('❌ getScenarioDetail error:', error);
    
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to fetch scenario'
    };
  }
};

export const deleteScenario = async (scenarioId) => {
  try {
    const response = await api.delete(`/debate/scenarios/${scenarioId}`);
    
    return {
      status: 'success',
      message: response.data.message || 'Scenario deleted successfully'
    };
  } catch (error) {
    console.error('❌ deleteScenario error:', error);
    
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to delete scenario'
    };
  }
};

// Debate endpoints - FIXED
export const createDebate = async (debateData) => {
  try {
    const response = await api.post('/debate/create', debateData);
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ createDebate error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to create debate'
    };
  }
};

export const getDebate = async (debateId) => {
  try {
    const response = await api.get(`/debate/${debateId}`);
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ getDebate error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to fetch debate'
    };
  }
};

export const deleteDebate = async (debateId) => {
  try {
    const response = await api.delete(`/debate/${debateId}`);
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ deleteDebate error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to delete debate'
    };
  }
};

export const listDebates = async () => {
  try {
    const response = await api.get('/debate/list');
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ listDebates error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to list debates'
    };
  }
};

// Usage tracking - FIXED
export const getScenarioUsage = async (scenarioId) => {
  try {
    const response = await api.get(`/debate/scenarios/${scenarioId}/usage`);
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ getScenarioUsage error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to fetch usage'
    };
  }
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
// PREMIUM API METHODS (FIXED)
// ============================================================================

export const getUserSubscriptionStatus = async (userId) => {
  try {
    const response = await api.get(`/premium/user_subscription/${userId}`);
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ getUserSubscriptionStatus error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to fetch subscription'
    };
  }
};

export const getAvailableTiers = async () => {
  try {
    const response = await api.get('/premium/subscription/tiers');
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ getAvailableTiers error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to fetch tiers'
    };
  }
};

export const createSubscription = async (subscriptionData) => {
  try {
    const response = await api.post('/premium/subscription/create', subscriptionData);
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ createSubscription error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to create subscription'
    };
  }
};

export const getPremiumCharacters = async () => {
  try {
    const response = await api.get('/premium/characters');
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ getPremiumCharacters error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to fetch characters'
    };
  }
};

export const createPremiumCharacter = async (characterData) => {
  try {
    const response = await api.post('/premium/characters', characterData);
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ createPremiumCharacter error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to create character'
    };
  }
};

export const getCharacterTemplates = async () => {
  try {
    const response = await api.get('/premium/templates?per_page=100');
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ getCharacterTemplates error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to fetch templates'
    };
  }
};

// ============================================================================
// AUTH & USER METHODS (FIXED)
// ============================================================================

export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ login error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Login failed'
    };
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ register error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Registration failed'
    };
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ getCurrentUser error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to fetch user'
    };
  }
};

export const updateUserProfile = async (userData) => {
  try {
    const response = await api.put('/auth/profile', userData);
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ updateUserProfile error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to update profile'
    };
  }
};

// ============================================================================
// CHAT & DISCOVERY METHODS (FIXED)
// ============================================================================

export const getChatHistory = async (characterId) => {
  try {
    const response = await api.get(`/chat/history/${characterId}`);
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ getChatHistory error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to fetch chat history'
    };
  }
};

export const sendChatMessage = async (characterId, message) => {
  try {
    const response = await api.post(`/chat/message/${characterId}`, { message });
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ sendChatMessage error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to send message'
    };
  }
};

export const getDiscoveredCharacters = async () => {
  try {
    const response = await api.get('/discovered-characters');
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ getDiscoveredCharacters error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to fetch discovered characters'
    };
  }
};

export const addDiscoveredCharacter = async (characterData) => {
  try {
    const response = await api.post('/discovered-characters', characterData);
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ addDiscoveredCharacter error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to add character'
    };
  }
};

export const removeDiscoveredCharacter = async (characterKey) => {
  try {
    const response = await api.delete(`/discovered-characters/${characterKey}`);
    return {
      status: 'success',
      ...response.data
    };
  } catch (error) {
    console.error('❌ removeDiscoveredCharacter error:', error);
    return {
      status: 'error',
      error: error.response?.data?.error || error.message || 'Failed to remove character'
    };
  }
};

// Export the axios instance for direct use
export default api;