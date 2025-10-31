// src/hooks/useMarketHub.js
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';

/**
 * MarketHub browse + engagement hook
 * All requests go through the shared axios client (withCredentials + CSRF)
 */
export default function useMarketHub(params = {}) {
  const {
    include_scenarios = true,
    page = 1,
    page_size = 20,
    q = '',
    category = '',
    sort = 'trending'
  } = params;

  const [state, setState] = useState({
    loading: false,
    error: null,
    characters: [],
    scenarios: [],
    pagination: { total: 0, pages: 0, page: 1, has_next: false, has_prev: false },
    hubNotAvailable: false,
    lastFetch: null
  });

  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map());

  // Stable cache key for current query
  const cacheKey = JSON.stringify({
    include_scenarios,
    page,
    page_size,
    q,
    category,
    sort
  });

  const load = useCallback(async () => {
    // Abort any in-flight request
    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort(); } catch {}
    }
    abortControllerRef.current = new AbortController();

    // Serve from cache if fresh (< 20s)
    const now = Date.now();
    const cached = cacheRef.current.get(cacheKey);
    if (cached && now - cached.timestamp < 20_000) {
      setState(s => ({
        ...s,
        loading: false,
        error: null,
        ...cached.data,
        lastFetch: cached.timestamp
      }));
      return cached.data;
    }

    setState(s => ({ ...s, loading: true, error: null }));

    // Build query params
    const params = {
      include_scenarios: include_scenarios ? 'true' : 'false',
      page,
      page_size,
      sort
    };
    if (q && q.trim()) params.q = q.trim();
    if (category && category.trim()) params.category = category.trim();

    let data;
    try {
      const res = await api.get('/market-hub/browse', {
        params,
        signal: abortControllerRef.current.signal
      });
      data = res.data;
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401) {
        setState(s => ({ ...s, loading: false, error: 'Authentication required' }));
        return null;
      }
      if (status === 403) {
        setState(s => ({ ...s, loading: false, error: 'Access denied - please check your subscription' }));
        return null;
      }
      if (status === 404) {
        const resultData = {
          characters: [],
          scenarios: [],
          pagination: { total: 0, pages: 0, page: 1, has_next: false, has_prev: false },
          hubNotAvailable: true
        };
        cacheRef.current.set(cacheKey, { data: resultData, timestamp: now });
        setState(s => ({
          ...s,
          loading: false,
          error: null,
          ...resultData,
          lastFetch: now
        }));
        return resultData;
      }

      // Network or server error
      const message = err?.message || 'Failed to load Market Hub';
      setState(s => ({ ...s, loading: false, error: message }));
      return null;
    }

    const resultData = {
      characters: Array.isArray(data?.characters) ? data.characters : [],
      scenarios: Array.isArray(data?.scenarios) ? data.scenarios : [],
      pagination: data?.pagination || { total: 0, pages: 0, page: 1, has_next: false, has_prev: false },
      hubNotAvailable: false
    };

    // Cache & trim LRU to 10 entries
    cacheRef.current.set(cacheKey, { data: resultData, timestamp: now });
    if (cacheRef.current.size > 10) {
      const entries = Array.from(cacheRef.current.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      cacheRef.current.clear();
      entries.slice(0, 10).forEach(([k, v]) => cacheRef.current.set(k, v));
    }

    setState(s => ({
      ...s,
      loading: false,
      error: null,
      ...resultData,
      lastFetch: now
    }));
    return resultData;
  }, [cacheKey, include_scenarios, page, page_size, q, category, sort]);

  useEffect(() => {
    load();
    return () => {
      if (abortControllerRef.current) {
        try { abortControllerRef.current.abort(); } catch {}
      }
    };
  }, [load]);

  // Engagement: characters
  const engageCharacter = useCallback(async (characterId, engagementType = 'view', metadata = {}) => {
    try {
      await api.post('/market-hub/engage', {
        character_id: characterId,
        engagement_type: engagementType,
        metadata
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  // Engagement: scenarios
  const engageScenario = useCallback(async (scenarioId, engagementType = 'view', metadata = {}) => {
    try {
      await api.post('/market-hub/engage-scenario', {
        scenario_id: scenarioId,
        engagement_type: engagementType,
        metadata
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    ...state,
    reload: load,
    engageCharacter,
    engageScenario
  };
}
