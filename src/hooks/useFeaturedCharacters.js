// src/hooks/useFeaturedCharacters.js - FIXED VERSION
// ✅ Fixed to match actual backend response structure
import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

export const useFeaturedCharacters = ({ 
  publicView = false,
  enabled = true,
  refreshInterval = 5 * 60 * 1000
} = {}) => {
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

  const fetchFeaturedCharacters = useCallback(async (retryCount = 0) => {
    const MAX_RETRIES = 2;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const cacheTime = 5 * 60 * 1000;
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

      const response = await fetch(`${API_BASE}/api/market-hub/featured`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        if (response.status === 404) {
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

      // ✅ FIXED: Use actual field names from backend response
      console.log('🔍 useFeaturedCharacters - Raw backend data:', data.featured_creators?.[0]);
      
      const resultData = {
        featuredCharacters: Array.isArray(data.featured_creators) 
          ? data.featured_creators.map(creator => {
              // ✅ CRITICAL: Use the field names backend ACTUALLY sends
              const transformed = {
                character_key: creator.character_key,
                character_id: creator.character_id,
                display_name: creator.display_name,  // ✅ Backend sends this
                short_description: creator.short_description || '',  // ✅ Backend sends this
                expertise_domain: creator.expertise_domain || '',  // ✅ Backend sends this
                avatar_url: creator.avatar_url || `/images/${creator.character_key}.jpg`,
                
                // ✅ Backend already sends engagement_30d as object
                engagement_30d: creator.engagement_30d || {
                  total_views: 0,
                  total_likes: 0,
                  total_shares: 0,
                  total_chats: 0,
                  total_bookmarks: 0
                },
                
                // ✅ Backend already sends creator as object
                creator: creator.creator || {
                  display_name: 'Creator',
                  creator_level: 'newcomer'
                },
                
                feature_position: creator.feature_position,
                total_engagement: creator.total_engagement || 0,
                
                // ✅ Include all other fields
                historical_period: creator.historical_period,
                personality_archetype: creator.personality_archetype,
                market_published_at: creator.market_published_at
              };
              
              console.log('✅ useFeaturedCharacters - Transformed:', transformed);
              return transformed;
            })
          : [],
        weekStart: data.week_start || new Date().toISOString().split('T')[0],
        totalFeatured: data.total_featured || 0,
        featuredNotAvailable: false
      };

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
        return;
      }

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
  }, []);

  const refetch = useCallback(() => {
    fetchFeaturedCharacters();
  }, [fetchFeaturedCharacters]);

  const clearCache = useCallback(() => {
    cacheRef.current = null;
  }, []);

  const setupRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    if (refreshInterval > 0) {
      refreshTimeoutRef.current = setTimeout(() => {
        fetchFeaturedCharacters();
        setupRefresh();
      }, refreshInterval);
    }
  }, [fetchFeaturedCharacters, refreshInterval]);

  useEffect(() => {
    if (!enabled) return;

    fetchFeaturedCharacters();
    setupRefresh();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [fetchFeaturedCharacters, setupRefresh, enabled]);

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

export const useCharacterStats = (characterId, { enabled = true } = {}) => {
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
          credentials: 'include'
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
  }, [characterId]);

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