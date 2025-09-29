// src/contexts/AppViewContext.jsx - Enhanced with discovered characters persistence
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const AppViewContext = createContext();

export const VIEW_STATES = {
  CHAT: 'chat',
  MARKET_HUB: 'market_hub',
  CREATOR_DASHBOARD: 'creator_dashboard'
};

const STORAGE_KEY = 'awakeverse_discovered_characters';
const SYNC_INTERVAL = 60000; // Sync every 60 seconds

export const AppViewProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState(VIEW_STATES.CHAT);
  const [discoveredCharacters, setDiscoveredCharacters] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  
  // Add this near the top with other state declarations (around line 20)
  const isInitialized = React.useRef(false);

  // ============================================================================
  // LOCALSTORAGE CACHE LAYER (Instant load, offline support)
  // ============================================================================

  const loadFromLocalStorage = useCallback(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setDiscoveredCharacters(parsed);
        console.log(`📦 Loaded ${parsed.length} discovered characters from localStorage`);
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
      console.log(`💾 Saved ${characters.length} discovered characters to localStorage`);
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, []);

  // ============================================================================
  // BACKEND SYNC LAYER (Source of truth, cross-device sync)
  // ============================================================================

  const syncWithBackend = useCallback(async (silent = false) => {
    if (isSyncing) return;
    
    try {
      setIsSyncing(true);
      
      const response = await api.get('/api/discovered-characters');
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
      // DEFENSIVE: On sync failure, keep using localStorage cache
      return discoveredCharacters;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, discoveredCharacters, saveToLocalStorage]);

  // ============================================================================
  // INITIALIZATION: Load from cache, then sync with backend
  // ============================================================================

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized.current) return;
    isInitialized.current = true;

    console.log('🚀 AppViewContext: Initializing discovered characters');

    // Immediately load from localStorage for instant UI
    const cachedCharacters = loadFromLocalStorage();

    // Then sync with backend in background
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
  }, []); // Run once on mount - useRef prevents re-initialization

  // ============================================================================
  // ADD CHARACTER: Optimistic update + backend sync
  // ============================================================================

  const addDiscoveredCharacter = useCallback(async (character) => {
    console.log('📝 Adding discovered character:', character.character_key);
    
    // DEFENSIVE: Prevent duplicates
    if (discoveredCharacters.some(c => c.character_key === character.character_key)) {
      console.log('⚠️ Character already in discovered list');
      return;
    }

    // OPTIMISTIC UPDATE: Add to state immediately for instant UI
    const newList = [...discoveredCharacters, character];
    setDiscoveredCharacters(newList);
    saveToLocalStorage(newList);

    // BACKGROUND SYNC: Persist to backend
    try {
      await api.post('/api/discovered-characters', {
        character_key: character.character_key,
        display_name: character.display_name || character.name,
        short_description: character.short_description || character.description,
        avatar_url: character.avatar_url || character.thumbnailUrl
      });
      
      console.log('✅ Character saved to backend:', character.character_key);
    } catch (error) {
      console.warn('Failed to save to backend, will retry on next sync:', error);
      // DEFENSIVE: Keep in localStorage, will sync later
    }
  }, [discoveredCharacters, saveToLocalStorage]);

  // ============================================================================
  // REMOVE CHARACTER: Optimistic update + backend sync
  // ============================================================================

  const removeDiscoveredCharacter = useCallback(async (characterKey) => {
    console.log('🗑️ Removing discovered character:', characterKey);
    
    // OPTIMISTIC UPDATE: Remove from state immediately
    const newList = discoveredCharacters.filter(c => c.character_key !== characterKey);
    setDiscoveredCharacters(newList);
    saveToLocalStorage(newList);

    // BACKGROUND SYNC: Remove from backend
    try {
      await api.delete(`/api/discovered-characters/${characterKey}`);
      console.log('✅ Character removed from backend:', characterKey);
    } catch (error) {
      console.warn('Failed to remove from backend:', error);
    }
  }, [discoveredCharacters, saveToLocalStorage]);

  // ============================================================================
  // VIEW SWITCHING
  // ============================================================================

  const switchView = useCallback((newView) => {
    console.log(`🔄 Switching view: ${currentView} → ${newView}`);
    setCurrentView(newView);
  }, [currentView]);

  // ============================================================================
  // MANUAL SYNC (for pull-to-refresh or settings)
  // ============================================================================

  const manualSync = useCallback(async () => {
    console.log('🔄 Manual sync triggered');
    return await syncWithBackend(false);
  }, [syncWithBackend]);

  const value = {
    // View state
    currentView,
    VIEW_STATES,
    switchView,
    
    // Discovered characters
    discoveredCharacters,
    addDiscoveredCharacter,
    removeDiscoveredCharacter,
    
    // Sync status
    isSyncing,
    lastSyncTime,
    manualSync
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