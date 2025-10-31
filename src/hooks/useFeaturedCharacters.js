// src/hooks/useFeaturedCharacters.js - FIXED VERSION
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

export const useFeaturedCharacters = ({ 
  publicView = false,
  enabled = true,
  refreshInterval = 5 * 60 * 1000 // 5 minutes default
} = {}) => {
  const { isAuthenticated } = useAuth();

  const [state, setState] = useState({
    featuredCharacters: [],
    loading: true,
    error: null,
    weekStart: null,
    totalFeatured: 0,
    lastFetch: null
  });

  const abortControllerRef = useRef(null);
  const cacheRef = useRef(null);
  const refreshTimeoutRef = useRef(null);

  // Defensive API call with retry logic
  const fetchFeaturedCharacters = useCallback(async (retryCount = 0) => {
    const MAX_RETRIES = 2;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Check cache first (for public view, cache longer since data changes less frequently)
      const cacheTime = publicView ? 10 * 60 * 1000 : 5 * 60 * 1000; // 10min public, 5min authenticated
      if (cacheRef.current && Date.now() - cacheRef.current.timestamp < cacheTime) {
        setState(prev => ({
          ...prev,
          ...cacheRef.current.data,
          loading: false,
          error: null
        }));
        return cacheRef.current.data;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      // Build headers - public view doesn't need auth
      const response = await fetch(`${API_BASE}/api/market-hub/featured`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: (!publicView && isAuthenticated) ? 'include' : 'omit',
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401 && !publicView) {
          throw new Error('Authentication required');
        }
        if (response.status === 404) {
          // Featured characters not available (starter accounts, empty hub, etc.)
          const resultData = {
            featuredCharacters: [],
            weekStart: new Date().toISOString().split('T')[0],
            totalFeatured: 0,
            featuredNotAvailable: true
          };
          
          setState(prev => ({
            ...prev,
            ...resultData,
            loading: false,
            error: null
          }));
          
          return resultData;
        }
        
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      // ✅ FIXED: Validate and transform response structure based on actual backend response
      const resultData = {
        featuredCharacters: Array.isArray(data.featured_creators) 
          ? data.featured_creators.map(creator => ({
              // ✅ FIXED: Map correct field names from database query results
              character_key: creator.character_key,
              character_id: creator.character_id,
              display_name: creator.display_name, // ✅ Already correct in backend
              short_description: creator.short_description || '',
              historical_period: creator.historical_period || '',
              personality_archetype: creator.personality_archetype || '',
              expertise_domain: creator.expertise_domain || '',
              avatar_url: creator.avatar_url || `/images/${creator.character_key}.jpg`,
              
              // ✅ FIXED: Parse engagement_30d JSON string from backend
              engagement_30d: typeof creator.engagement_30d === 'string' 
                ? JSON.parse(creator.engagement_30d)
                : creator.engagement_30d || {
                    total_views: 0,
                    total_likes: 0,
                    total_shares: 0,
                    total_chats: 0
                  },
              
              // ✅ FIXED: Map creator information correctly
              creator: {
                display_name: creator.creator_display_name || 'Creator',
                username: creator.creator_username, // Will be sanitized by backend decorator
                creator_level: creator.creator_level || 'newcomer'
              },
              
              // Additional fields
              feature_position: creator.feature_position || null,
              total_engagement: creator.total_engagement_score || 0,
              market_published_at: creator.market_published_at
            }))
          : [],
        weekStart: data.week_start || new Date().toISOString().split('T')[0],
        totalFeatured: data.total_featured || 0,
        featuredNotAvailable: false
      };

      // Cache the result
      cacheRef.current = {
        data: resultData,
        timestamp: Date.now()
      };

      setState(prev => ({
        ...prev,
        ...resultData,
        loading: false,
        error: null,
        lastFetch: Date.now()
      }));

      return resultData;

    } catch (error) {
      if (error.name === 'AbortError') {
        return; // Request was cancelled
      }

      // Retry logic for network errors
      if (retryCount < MAX_RETRIES && 
          (error.message.includes('fetch') || error.message.includes('network'))) {
        console.warn(`Featured characters fetch attempt ${retryCount + 1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchFeaturedCharacters(retryCount + 1);
      }

      const errorMessage = error.message === 'Authentication required' 
        ? 'Please sign in to view featured characters'
        : error.message.includes('fetch') || error.message.includes('network')
        ? 'Unable to connect to featured characters. Please check your internet connection.'
        : 'Unable to load featured characters';

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      console.error('Featured characters fetch error:', error);
    }
  }, [isAuthenticated, publicView]);

  // Refetch function for error recovery
  const refetch = useCallback(() => {
    fetchFeaturedCharacters();
  }, [fetchFeaturedCharacters]);

  // Clear cache function
  const clearCache = useCallback(() => {
    cacheRef.current = null;
  }, []);

  // Setup periodic refresh
  const setupRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    if (refreshInterval > 0) {
      refreshTimeoutRef.current = setTimeout(() => {
        fetchFeaturedCharacters();
        setupRefresh(); // Schedule next refresh
      }, refreshInterval);
    }
  }, [fetchFeaturedCharacters, refreshInterval]);

  // Effect to fetch data and setup refresh
  useEffect(() => {
    if (!enabled) return;

    fetchFeaturedCharacters();
    setupRefresh();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [fetchFeaturedCharacters, setupRefresh, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    featuredCharacters: state.featuredCharacters,
    loading: state.loading,
    error: state.error,
    weekStart: state.weekStart,
    totalFeatured: state.totalFeatured,
    featuredNotAvailable: state.featuredNotAvailable || false,
    lastFetch: state.lastFetch,
    refetch,
    clearCache
  };
};

// Hook for getting character engagement stats (public view)
export const useCharacterStats = (characterId, { enabled = true } = {}) => {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState({
    character: null,
    engagement: null,
    loading: true,
    error: null
  });

  const fetchCharacterStats = useCallback(async () => {
    if (!characterId) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(
        `${API_BASE}/api/market-hub/character/${characterId}/stats`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: isAuthenticated ? 'include' : 'omit'
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Character not found or not published');
        }
        throw new Error('Unable to load character stats');
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        character: data.character,
        engagement: data.engagement_stats,
        loading: false,
        error: null
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      console.error('Character stats fetch error:', error);
    }
  }, [characterId, isAuthenticated]);

  useEffect(() => {
    if (!enabled || !characterId) return;
    fetchCharacterStats();
  }, [fetchCharacterStats, enabled, characterId]);

  return {
    character: state.character,
    engagement: state.engagement,
    loading: state.loading,
    error: state.error,
    refetch: fetchCharacterStats
  };
};

export default useFeaturedCharacters;