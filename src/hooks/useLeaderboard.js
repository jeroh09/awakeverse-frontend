// src/hooks/useLeaderboard.js - FIXED VERSION
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

export const useLeaderboard = ({ 
  period = 'week', 
  limit = 10,
  enabled = true 
} = {}) => {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState({
    rankings: [],
    loading: true,
    error: null,
    period: period,
    totalEntries: 0,
    lastFetch: null
  });

  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map());

  // Create cache key
  const createCacheKey = useCallback((period, limit) => {
    return `${period}-${limit}`;
  }, []);

  // Defensive API call with retry logic
  const fetchLeaderboard = useCallback(async (period, limit, retryCount = 0) => {
    const MAX_RETRIES = 2;
    const cacheKey = createCacheKey(period, limit);

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Check cache first (2 minute cache for leaderboard)
      const cached = cacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 2 * 60 * 1000) {
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
        period: period,
        limit: limit.toString()
      });

      // Build headers - leaderboard might be available to anonymous users
      const response = await fetch(
        `${API_BASE}/api/market-hub/leaderboard?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: isAuthenticated ? 'include' : 'omit',
          signal: abortControllerRef.current.signal
        }
      );
      

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 404) {
          // Leaderboard not available (starter accounts, empty hub, etc.)
          const resultData = {
            rankings: [],
            period: period,
            totalEntries: 0,
            leaderboardNotAvailable: true
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

      // ✅ FIXED: Validate and transform response structure based on backend response
      const resultData = {
        // ✅ FIXED: Backend returns data.leaderboard.rankings array
        rankings: Array.isArray(data.leaderboard?.rankings) 
          ? data.leaderboard.rankings.map(rankEntry => ({
              // Map fields from database query results
              rank: rankEntry.rank,
              character_id: rankEntry.character_id,
              character_key: rankEntry.character_key,
              display_name: rankEntry.display_name,
              creator_level: rankEntry.creator_level,
              creator_name: rankEntry.creator_name,
              period_views: rankEntry.period_views || 0,
              period_likes: rankEntry.period_likes || 0,
              avg_engagement_rate: rankEntry.avg_engagement_rate || 0,
              avatar_url: rankEntry.avatar_url || `/images/${rankEntry.character_key}.jpg`,
              
              // Additional computed fields for frontend
              total_engagement: rankEntry.period_views + rankEntry.period_likes,
              engagement_display: `${rankEntry.period_views} views`
            }))
          : [],
        
        // ✅ FIXED: Map period and totalEntries from correct response structure  
        period: data.leaderboard?.period || period,
        totalEntries: data.leaderboard?.total_entries || 0,
        leaderboardNotAvailable: false
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
        console.warn(`Leaderboard fetch attempt ${retryCount + 1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchLeaderboard(period, limit, retryCount + 1);
      }

      const errorMessage = error.message === 'Authentication required' 
        ? 'Please sign in to view leaderboard'
        : error.message.includes('fetch') || error.message.includes('network')
        ? 'Unable to connect to leaderboard. Please check your internet connection.'
        : 'Unable to load leaderboard rankings';

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      console.error('Leaderboard fetch error:', error);
    }
  }, [isAuthenticated, createCacheKey]);

  // Refetch function for error recovery
  const refetch = useCallback(() => {
    fetchLeaderboard(period, limit);
  }, [fetchLeaderboard, period, limit]);

  // Clear cache function
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // Effect to fetch data when parameters change
  useEffect(() => {
    if (!enabled) return;

    fetchLeaderboard(period, limit);

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchLeaderboard, period, limit, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    rankings: state.rankings,
    loading: state.loading,
    error: state.error,
    period: state.period,
    totalEntries: state.totalEntries,
    leaderboardNotAvailable: state.leaderboardNotAvailable || false,
    lastFetch: state.lastFetch,
    refetch,
    clearCache
  };
};

export default useLeaderboard;