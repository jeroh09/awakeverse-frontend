// src/hooks/useMarketHub.js
import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const useMarketHub = ({ 
  page = 1, 
  search = '', 
  filters = {}, 
  perPage = 20,
  enabled = true,
  includeScenarios = false  // 🆕 ADD THIS PARAMETER
} = {}) => {
  const [state, setState] = useState({
    characters: [],
    scenarios: [],  // 🆕 ADD scenarios to state
    loading: true,
    error: null,
    pagination: null,
    lastFetch: null
  });

  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map());

  // 🆕 UPDATE: Modify createCacheKey to include includeScenarios
  const createCacheKey = useCallback((page, search, filters, perPage, includeScenarios) => {
    return `${page}-${search}-${JSON.stringify(filters)}-${perPage}-${includeScenarios}`;
  }, []);

  // 🆕 UPDATE: Modify fetchMarketHub signature and params
  const fetchMarketHub = useCallback(async (page, search, filters, perPage, includeScenarios, retryCount = 0) => {
    const MAX_RETRIES = 2;
    const cacheKey = createCacheKey(page, search, filters, perPage, includeScenarios);

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Check cache first (5 minute cache)
      const cached = cacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
        setState(prev => ({
          ...prev,
          ...cached.data,
          loading: false,
          error: null
        }));
        return cached.data;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString()
      });

      if (search.trim()) {
        params.set('search', search.trim());
      }

      if (filters.archetype) {
        params.set('archetype', filters.archetype);
      }

      if (filters.domain) {
        params.set('domain', filters.domain);
      }

      if (filters.sort) {
        params.set('sort', filters.sort);
      }

      // 🆕 ADD: Include scenarios parameter
      if (includeScenarios) {
        params.set('include_scenarios', 'true');
      }

      const response = await fetch(
        `${API_BASE}/api/market-hub/browse?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          signal: abortControllerRef.current.signal
        }
      );

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        if (response.status === 403) {
          throw new Error('Access denied - please check your subscription');
        }
        if (response.status === 404) {
          // For starter accounts or when hub is not available
          const resultData = {
            characters: [],
            scenarios: [],  // 🆕 ADD scenarios
            pagination: { total: 0, pages: 0, page: 1, has_next: false, has_prev: false },
            hubNotAvailable: true
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

      // 🆕 UPDATE: Validate response structure to include scenarios
      const resultData = {
        characters: Array.isArray(data.characters) ? data.characters : [],
        scenarios: Array.isArray(data.scenarios) ? data.scenarios : [],  // 🆕 ADD scenarios
        pagination: data.pagination || { 
          total: 0, 
          pages: 0, 
          page: 1, 
          has_next: false, 
          has_prev: false 
        },
        hubNotAvailable: false
      };

      // Cache the result
      cacheRef.current.set(cacheKey, {
        data: resultData,
        timestamp: Date.now()
      });

      // Clean old cache entries (keep last 10)
      if (cacheRef.current.size > 10) {
        const entries = Array.from(cacheRef.current.entries());
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        cacheRef.current.clear();
        entries.slice(0, 10).forEach(([key, value]) => {
          cacheRef.current.set(key, value);
        });
      }

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
        console.warn(`Market hub fetch attempt ${retryCount + 1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchMarketHub(page, search, filters, perPage, includeScenarios, retryCount + 1);
      }

      const errorMessage = error.message === 'Authentication required' 
        ? 'Please sign in to access Market Hub'
        : error.message === 'Access denied - please check your subscription'
        ? 'Market Hub access requires authentication'
        : error.message.includes('fetch') || error.message.includes('network')
        ? 'Unable to connect to Market Hub. Please check your internet connection.'
        : 'Unable to load content from Market Hub';

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      console.error('Market hub fetch error:', error);
    }
  }, [createCacheKey]);

  // 🆕 UPDATE: Modify refetch to include includeScenarios
  const refetch = useCallback(() => {
    fetchMarketHub(page, search, filters, perPage, includeScenarios);
  }, [fetchMarketHub, page, search, filters, perPage, includeScenarios]);

  // Clear cache function
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // 🆕 UPDATE: Effect to fetch data when parameters change
  useEffect(() => {
    if (!enabled) return;

    fetchMarketHub(page, search, filters, perPage, includeScenarios);

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchMarketHub, page, search, filters, perPage, includeScenarios, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 🆕 UPDATE: Return scenarios in the hook result
  return {
    characters: state.characters,
    scenarios: state.scenarios,  // 🆕 ADD scenarios to return
    loading: state.loading,
    error: state.error,
    pagination: state.pagination,
    hubNotAvailable: state.hubNotAvailable || false,
    lastFetch: state.lastFetch,
    refetch,
    clearCache
  };
};

// Hook for character engagement actions
export const useCharacterEngagement = () => {
  const [loading, setLoading] = useState(false);

  const engageWithCharacter = useCallback(async (characterId, engagementType, metadata = {}) => {
    setLoading(true);
    const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';

    
    try {
      const response = await fetch(`${API_BASE}/api/market-hub/engage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf
        },
        credentials: 'include',
        body: JSON.stringify({
          character_id: characterId,
          engagement_type: engagementType,
          metadata
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to engage with characters');
        }
        if (response.status === 404) {
          throw new Error('Character not found');
        }
        throw new Error('Failed to record engagement');
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Character engagement error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    engageWithCharacter,
    loading
  };
};

// 🆕 NEW: Add Scenario Engagement Hook (after useCharacterEngagement)
export const useScenarioEngagement = () => {
  const [loading, setLoading] = useState(false);

  const engageWithScenario = useCallback(async (scenarioId, engagementType, metadata = {}) => {
    setLoading(true);
    const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';

    
    try {
      const response = await fetch(`${API_BASE}/api/market-hub/engage-scenario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf
        },
        body: JSON.stringify({
          scenario_id: scenarioId,
          engagement_type: engagementType,
          metadata
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to engage with scenarios');
        }
        if (response.status === 404) {
          throw new Error('Scenario not found');
        }
        throw new Error('Failed to record engagement');
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Scenario engagement error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    engageWithScenario,
    loading
  };
};

export default useMarketHub;