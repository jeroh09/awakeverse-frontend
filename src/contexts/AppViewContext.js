// src/contexts/AppViewContext.jsx - FIXED: Proper hash parsing in popstate
// DEFENSIVE: Fixes browser back button, navigation state loss, and Stripe redirect issues

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';

const AppViewContext = createContext();

export const VIEW_STATES = {
  CHAT: 'chat',
  MARKET_HUB: 'market_hub',
  CREATOR_DASHBOARD: 'creator_dashboard',
  SCENARIOS: 'scenarios',
  STORY_MODE: 'story_mode'  // NEW
};

const STORAGE_KEY = 'awakeverse_discovered_characters';
const NAVIGATION_HISTORY_KEY = 'awakeverse_navigation_history';
const SYNC_INTERVAL = 60000; // Sync every 60 seconds

// ============================================================================
// HASH NAVIGATION UTILITIES - STEP 1: Core parsing functions
// ============================================================================

/**
 * Parse hash fragment with query params
 * Example: "#chat?stripe_success=true&session_id=XXX"
 * Returns: { view: "chat", params: { stripe_success: "true", session_id: "XXX" } }
 * 
 * DEFENSIVE: Handles all edge cases gracefully
 */
export function parseHashFragment(hashString) {
  try {
    // Remove leading # if present
    const hash = hashString.startsWith('#') ? hashString.slice(1) : hashString;
    
    // DEFENSIVE: Empty hash
    if (!hash) {
      return { view: null, params: {} };
    }
    
    // Split on ? to separate view from params
    const [viewPart, paramsPart] = hash.split('?');
    
    // Parse view (e.g., "chat", "discover", "chat/characterKey")
    const view = viewPart || null;
    
    // Parse query params
    const params = {};
    if (paramsPart) {
      try {
        const searchParams = new URLSearchParams(paramsPart);
        searchParams.forEach((value, key) => {
          params[key] = value;
        });
      } catch (paramError) {
        console.warn('Failed to parse hash params:', paramError);
      }
    }
    
    return { view, params };
  } catch (error) {
    console.error('Hash parsing error:', error);
    return { view: null, params: {} };
  }
}

/**
 * Build clean hash URL from view and optional params
 * Example: buildHashUrl('chat', { test: 'value' }) → "#chat?test=value"
 * 
 * DEFENSIVE: Always returns valid string
 */
export function buildHashUrl(view, params = {}) {
  try {
    if (!view) return '#chat'; // Default fallback
    
    const paramKeys = Object.keys(params);
    
    // No params - return simple hash
    if (paramKeys.length === 0) {
      return `#${view}`;
    }
    
    // Build query string
    const queryString = new URLSearchParams(params).toString();
    return `#${view}?${queryString}`;
  } catch (error) {
    console.error('Hash building error:', error);
    return '#chat'; // Safe fallback
  }
}

/**
 * Clean URL by removing query params from hash
 * Example: "#chat?stripe_success=true" → "#chat"
 * 
 * DEFENSIVE: Never reloads page
 */
export function cleanHashUrl(preserveView = true) {
  try {
    const { view } = parseHashFragment(window.location.hash);
    const cleanView = preserveView && view ? view : 'chat';
    
    // Use replaceState to avoid reload and maintain history
    window.history.replaceState(
      { isAppRoot: true, view: cleanView, cleaned: true },
      '',
      `/app#${cleanView}`
    );
    
    console.log(`🧹 Cleaned hash URL to: #${cleanView}`);
    return cleanView;
  } catch (error) {
    console.error('Hash cleaning error:', error);
    return 'chat';
  }
}

/**
 * Map view state to hash string
 */
const VIEW_TO_HASH_MAP = {
  [VIEW_STATES.CHAT]: 'chat',
  [VIEW_STATES.MARKET_HUB]: 'discover',
  [VIEW_STATES.CREATOR_DASHBOARD]: 'create',
  [VIEW_STATES.SCENARIOS]: 'scenarios',
  [VIEW_STATES.STORY_MODE]: 'stories',
  
};

/**
 * Map hash string to view state
 * FIXED: Now handles hash with params properly
 */
function getViewFromHash(hashString) {
  // Parse the hash to extract just the view part
  const { view: hashView } = parseHashFragment(hashString);
  
  if (!hashView) return VIEW_STATES.CHAT;
  
  // Extract base view (before any / or params)
  const baseView = hashView.split('/')[0];
  
  // Map to view state
  const HASH_TO_VIEW_MAP = {
    'chat': VIEW_STATES.CHAT,
    'launcher': VIEW_STATES.CHAT, // Alias
    'discover': VIEW_STATES.MARKET_HUB,
    'market_hub': VIEW_STATES.MARKET_HUB, // Alias
    'create': VIEW_STATES.CREATOR_DASHBOARD,
    'creator_dashboard': VIEW_STATES.CREATOR_DASHBOARD, // Alias
    'scenarios': VIEW_STATES.SCENARIOS,
    'stories': VIEW_STATES.STORY_MODE
    
  };
  
  return HASH_TO_VIEW_MAP[baseView] || VIEW_STATES.CHAT;
}

// ============================================================================
// MAIN PROVIDER COMPONENT
// ============================================================================

export const AppViewProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState(VIEW_STATES.CHAT);
  const [discoveredCharacters, setDiscoveredCharacters] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  
  // Navigation history stack for back button support
  const [navigationHistory, setNavigationHistory] = useState([]);
  const isInitialized = useRef(false);
  const popstateListenerAttached = useRef(false);

  // Scenarios state
  const [activeScenario, setActiveScenario] = useState(null);
  const [activeDebate, setActiveDebate] = useState(null);
  const [myScenarios, setMyScenarios] = useState([]);

  // ============================================================================
  // LOCALSTORAGE CACHE LAYER (Instant load, offline support)
  // ============================================================================

  const loadFromLocalStorage = useCallback(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setDiscoveredCharacters(parsed);
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
    }
    return [];
  }, []);

  const saveToLocalStorage = useCallback((characters) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, []);

  // ============================================================================
  // NAVIGATION HISTORY PERSISTENCE
  // ============================================================================

  const loadNavigationHistory = useCallback(() => {
    try {
      const cached = sessionStorage.getItem(NAVIGATION_HISTORY_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.warn('Failed to load navigation history:', e);
    }
    return [];
  }, []);

  const saveNavigationHistory = useCallback((history) => {
    try {
      sessionStorage.setItem(NAVIGATION_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save navigation history:', e);
    }
  }, []);

  // ============================================================================
  // BACKEND SYNC LAYER (Source of truth, cross-device sync)
  // ============================================================================

  const syncWithBackend = useCallback(async (silent = false) => {
    if (isSyncing) return;
    
    try {
      setIsSyncing(true);
      
      const response = await api.get('/discovered-characters');
      const backendCharacters = response.data;
      
      // Update state and localStorage with backend data
      setDiscoveredCharacters(backendCharacters);
      saveToLocalStorage(backendCharacters);
      setLastSyncTime(new Date());
      
      if (!silent) {
        console.log(`✅ Synced ${backendCharacters.length} discovered characters from backend`);
      }
      
      return backendCharacters;
    } catch (error) {
      console.warn('Backend sync failed, using localStorage cache:', error);
      return discoveredCharacters;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, discoveredCharacters, saveToLocalStorage]);

  // ============================================================================
  // STEP 2: ENHANCED VIEW SWITCHING WITH BROWSER HISTORY
  // ============================================================================

  /**
   * Switch to a new view with proper browser history integration
   * DEFENSIVE: This fixes the browser back button issue
   */
  const switchView = useCallback((newView, options = {}) => {
    const { 
      skipHistory = false,  // Don't add to history stack
      replace = false,      // Replace current history entry
      params = {}           // Optional query params
    } = options;

    try {
      // DEFENSIVE: Validate view
      if (!Object.values(VIEW_STATES).includes(newView)) {
        console.warn(`❌ Invalid view state: ${newView}`);
        return false;
      }

      // Update React state
      setCurrentView(newView);
      
      // Build hash URL
      const hashName = VIEW_TO_HASH_MAP[newView] || 'chat';
      const fullHash = buildHashUrl(hashName, params);
      const fullUrl = `/app${fullHash}`;
      
      // CRITICAL: Use pushState (not replaceState) for browser back button to work
      // This adds the navigation to browser history
      const historyMethod = replace ? 'replaceState' : 'pushState';
      
      window.history[historyMethod](
        { 
          isAppRoot: true, 
          view: newView,
          timestamp: Date.now(),
          params
        },
        '',
        fullUrl
      );
      
      // Update navigation history stack (for our own tracking)
      if (!skipHistory && !replace) {
        setNavigationHistory(prev => {
          const newHistory = [...prev, { view: newView, timestamp: Date.now(), hash: fullHash }];
          // Keep only last 50 entries
          const trimmed = newHistory.slice(-50);
          saveNavigationHistory(trimmed);
          return trimmed;
        });
      }
      
      console.log(`🔄 Switched to view: ${newView} (${fullHash})`);
      return true;
      
    } catch (error) {
      console.error('View switching error:', error);
      return false;
    }
  }, [saveNavigationHistory]);

  /**
   * Navigate back using browser history
   * DEFENSIVE: Safe back navigation that won't log user out
   */
  const navigateBack = useCallback((fallbackView = VIEW_STATES.CHAT) => {
    try {
      // Check if we have history to go back to
      if (navigationHistory.length > 1) {
        // Go back in browser history (this will trigger popstate)
        window.history.back();
        return true;
      } else {
        // No history - go to fallback view
        console.log('📍 No navigation history, going to fallback view');
        switchView(fallbackView, { replace: true });
        return false;
      }
    } catch (error) {
      console.error('Back navigation error:', error);
      switchView(fallbackView, { replace: true });
      return false;
    }
  }, [navigationHistory, switchView]);

  // ============================================================================
  // BROWSER POPSTATE LISTENER - FIXED: Proper hash parsing
  // ============================================================================

  useEffect(() => {
    // Only attach once
    if (popstateListenerAttached.current) return;
    
    const handlePopState = (event) => {
      console.log('🔙 Browser back/forward button pressed', event.state);
      
      try {
        // FIXED: Use getViewFromHash helper that properly parses the hash
        const mappedView = getViewFromHash(window.location.hash);
        
        // Update React state to match URL
        setCurrentView(mappedView);
        
        console.log(`🔄 Popstate: Updated view to ${mappedView} from hash ${window.location.hash}`);
      } catch (error) {
        console.error('Popstate handling error:', error);
        setCurrentView(VIEW_STATES.CHAT);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    popstateListenerAttached.current = true;
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      popstateListenerAttached.current = false;
    };
  }, []);

  // ============================================================================
  // INITIALIZATION: Load from cache, parse URL, then sync with backend
  // ============================================================================

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized.current) return;
    isInitialized.current = true;
    
    console.log('🚀 Initializing AppViewContext...');
    
    // Load cached data immediately
    loadFromLocalStorage();
    const cachedHistory = loadNavigationHistory();
    setNavigationHistory(cachedHistory);
    
    // Parse initial URL to set correct view - FIXED: Use getViewFromHash
    const initialView = getViewFromHash(window.location.hash);
    
    console.log(`📍 Initial view from URL: ${initialView} (hash: ${window.location.hash})`);
    setCurrentView(initialView);
    
    // Initialize browser history with current state if not already set
    if (!window.history.state?.isAppRoot) {
      window.history.replaceState(
        { isAppRoot: true, view: initialView, timestamp: Date.now() },
        '',
        window.location.pathname + window.location.hash
      );
    }

    // Sync with backend in background
    const syncTimer = setTimeout(() => {
      syncWithBackend(true);
    }, 500);

    // Set up periodic sync
    const syncInterval = setInterval(() => {
      syncWithBackend(true);
    }, SYNC_INTERVAL);

    return () => {
      clearTimeout(syncTimer);
      clearInterval(syncInterval);
    };
  }, [loadFromLocalStorage, loadNavigationHistory, syncWithBackend]);

  // ============================================================================
  // DISCOVERED CHARACTERS MANAGEMENT
  // ============================================================================

  const addDiscoveredCharacter = useCallback(async (character) => {
    // DEFENSIVE: Prevent duplicates
    if (discoveredCharacters.some(c => c.character_key === character.character_key)) {
      return;
    }

    // OPTIMISTIC UPDATE: Add to state immediately for instant UI
    const newList = [...discoveredCharacters, character];
    setDiscoveredCharacters(newList);
    saveToLocalStorage(newList);

    // BACKGROUND SYNC: Persist to backend
    try {
      await api.post('/discovered-characters', {
        character_key: character.character_key,
        display_name: character.display_name || character.name,
        short_description: character.short_description || character.description,
        avatar_url: character.avatar_url || character.thumbnailUrl
      });
    } catch (error) {
      console.warn('Failed to save to backend, will retry on next sync:', error);
    }
  }, [discoveredCharacters, saveToLocalStorage]);

  const removeDiscoveredCharacter = useCallback(async (characterKey) => {    
    // OPTIMISTIC UPDATE: Remove from state immediately
    const newList = discoveredCharacters.filter(c => c.character_key !== characterKey);
    setDiscoveredCharacters(newList);
    saveToLocalStorage(newList);

    // BACKGROUND SYNC: Remove from backend
    try {
      await api.delete(`/discovered-characters/${characterKey}`);
    } catch (error) {
      console.warn('Failed to remove from backend:', error);
    }
  }, [discoveredCharacters, saveToLocalStorage]);

  // ============================================================================
  // SCENARIO MANAGEMENT METHODS
  // ============================================================================

  const setActiveScenarioData = useCallback((scenario) => {
    console.log('🎭 Setting active scenario:', scenario?.id);
    setActiveScenario(scenario);
  }, []);

  const setActiveDebateData = useCallback((debate) => {
    console.log('💬 Setting active debate:', debate?.debate_id);
    setActiveDebate(debate);
  }, []);

  const updateMyScenarios = useCallback((scenarios) => {
    console.log('📚 Updating my scenarios:', scenarios?.length);
    setMyScenarios(scenarios || []);
  }, []);

  // ============================================================================
  // MANUAL SYNC (for pull-to-refresh or settings)
  // ============================================================================

  const manualSync = useCallback(async () => {
    return await syncWithBackend(false);
  }, [syncWithBackend]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value = {
    // View state
    currentView,
    VIEW_STATES,
    switchView,
    navigateBack,
    
    // Hash utilities (exported for use in other components)
    parseHashFragment,
    buildHashUrl,
    cleanHashUrl,
    
    // Navigation history
    navigationHistory,
    
    // Discovered characters
    discoveredCharacters,
    addDiscoveredCharacter,
    removeDiscoveredCharacter,
    
    // Sync status
    isSyncing,
    lastSyncTime,
    manualSync,

    // Scenario context values
    activeScenario,
    setActiveScenario: setActiveScenarioData,
    activeDebate,
    setActiveDebate: setActiveDebateData,
    myScenarios,
    updateMyScenarios
  };

  return (
    <AppViewContext.Provider value={value}>
      {children}
    </AppViewContext.Provider>
  );
};

export const useAppView = () => {
  const context = useContext(AppViewContext);
  if (!context) {
    throw new Error('useAppView must be used within AppViewProvider');
  }
  return context;
};