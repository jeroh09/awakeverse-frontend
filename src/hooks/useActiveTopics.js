// src/hooks/useActiveTopics.js
//
// Fetches active trending topics for the MarketHub ticker strip.
// Pattern: matches useMarketHub.js exactly — uses api instance.
// Public endpoint — no auth required.
// Refreshes every 10 minutes (topics change slowly).

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';

const CACHE_TTL_MS    = 10 * 60 * 1000;  // 10 minutes
const REFRESH_INTERVAL = 10 * 60 * 1000;

export const useActiveTopics = ({ enabled = true } = {}) => {
  const [topics,  setTopics]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const cacheRef    = useRef(null);
  const intervalRef = useRef(null);

  const fetchTopics = useCallback(async () => {
    // Cache hit
    if (cacheRef.current && Date.now() - cacheRef.current.timestamp < CACHE_TTL_MS) {
      setTopics(cacheRef.current.data);
      setLoading(false);
      return;
    }

    try {
      const res  = await api.get('/social/topics?limit=20');
      const data = res.data;

      if (data.status === 'success' && Array.isArray(data.topics)) {
        cacheRef.current = { data: data.topics, timestamp: Date.now() };
        setTopics(data.topics);
        setError(null);
      }
    } catch (err) {
      // Silent — ticker is cosmetic, never block the page
      console.warn('useActiveTopics: fetch failed', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    fetchTopics();

    // Refresh on interval
    intervalRef.current = setInterval(fetchTopics, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, fetchTopics]);

  return { topics, loading, error, refetch: fetchTopics };
};

export default useActiveTopics;