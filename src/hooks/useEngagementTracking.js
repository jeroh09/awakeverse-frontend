// src/hooks/useEngagementTracking.js
// UPDATED: Add function to load user's engagement history

import { useState, useCallback, useRef, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

// ✅ CHANGED: Use production API as default
const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

/**
 * Hook for tracking user engagement with Market Hub characters
 * Now includes loading existing engagement state
 */
export const useEngagementTracking = () => {
  const { user } = useUser(); // ✅ FIXED: Changed "use" to "user"
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  
  const trackingCache = useRef(new Map());
  const DEBOUNCE_TIME = 2000;

  const trackEngagement = useCallback(async (characterId, engagementType, metadata = {}) => {
    if (!user) {
      return false;
    }

    if (!characterId) {
      return false;
    }

    const validTypes = ['view', 'like', 'bookmark', 'share'];
    if (!validTypes.includes(engagementType)) {
      return false;
    }

    const cacheKey = `${characterId}-${engagementType}`;
    const lastTracked = trackingCache.current.get(cacheKey);
    const now = Date.now();

    if (lastTracked && (now - lastTracked) < DEBOUNCE_TIME) {
      return false;
    }

    setIsTracking(true);
    setError(null);

    try {
      // ✅ CHANGED: Use manual fetch with CSRF token (like your working files)
      const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';
      
      const response = await fetch(`${API_BASE}/api/market-hub/engage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf  // ✅ ADD CSRF TOKEN
        },
        credentials: 'include',
        body: JSON.stringify({
          character_id: characterId,
          engagement_type: engagementType,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            source: 'market_hub_ui'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data && data.status === 'success') {
        trackingCache.current.set(cacheKey, now);
        return true;
      } else {
        throw new Error(data?.error || 'Engagement tracking failed');
      }

    } catch (err) {
      const errorMessage = err.message || 'Unknown error';
      setError(errorMessage);
      return false;

    } finally {
      setIsTracking(false);
    }
  }, [user]);

  const trackView = useCallback((characterId, metadata = {}) => {
    return trackEngagement(characterId, 'view', {
      ...metadata,
      action: 'character_viewed'
    });
  }, [trackEngagement]);

  const trackLike = useCallback((characterId, metadata = {}) => {
    return trackEngagement(characterId, 'like', {
      ...metadata,
      action: 'character_liked'
    });
  }, [trackEngagement]);

  const trackBookmark = useCallback((characterId, metadata = {}) => {
    return trackEngagement(characterId, 'bookmark', {
      ...metadata,
      action: 'character_bookmarked'
    });
  }, [trackEngagement]);

  const trackShare = useCallback((characterId, shareMethod = 'unknown', metadata = {}) => {
    return trackEngagement(characterId, 'share', {
      ...metadata,
      share_method: shareMethod,
      action: 'character_shared'
    });
  }, [trackEngagement]);

  const clearCache = useCallback(() => {
    trackingCache.current.clear();
  }, []);

  return {
    trackView,
    trackLike,
    trackBookmark,
    trackShare,
    trackEngagement,
    isTracking,
    error,
    clearCache
  };
};

/**
 * NEW: Hook to load and manage user's engagement state for a character
 * Loads liked/bookmarked status from backend on mount
 */
export const useEngagementState = (characterId) => {
  const { user } = useUser();
  const [engagementState, setEngagementState] = useState({
    liked: false,
    bookmarked: false,
    loaded: false,
    loading: true
  });

  const { trackLike, trackBookmark } = useEngagementTracking();

  // Load user's existing engagement state on mount
  useEffect(() => {
    let isMounted = true;

    const loadEngagementState = async () => {
      if (!user || !characterId) {
        setEngagementState(prev => ({ ...prev, loading: false, loaded: true }));
        return;
      }

      try {
        // ✅ CHANGED: Use manual fetch with CSRF token
        const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';
        
        const response = await fetch(`${API_BASE}/api/market-hub/character/${characterId}/user-engagement`, {
          method: 'GET',
          headers: {
            'X-CSRF-Token': csrf  // ✅ ADD CSRF TOKEN
          },
          credentials: 'include'
        });
        
        if (isMounted && response.ok) {
          const data = await response.json();
          const { liked, bookmarked } = data;
          setEngagementState({
            liked: liked || false,
            bookmarked: bookmarked || false,
            loaded: true,
            loading: false
          });
        }
      } catch (err) {
        // If endpoint doesn't exist yet, fall back to default state
        if (isMounted) {
          setEngagementState({
            liked: false,
            bookmarked: false,
            loaded: true,
            loading: false
          });
        }
      }
    };

    loadEngagementState();

    return () => {
      isMounted = false;
    };
  }, [characterId, user]);

  const toggleLike = useCallback(async () => {
    const newState = !engagementState.liked;
    
    // Optimistic UI update
    setEngagementState(prev => ({ ...prev, liked: newState }));

    if (newState) {
      const success = await trackLike(characterId, {
        character_context: 'toggle_like'
      });
      if (!success) {
        // Rollback on failure
        setEngagementState(prev => ({ ...prev, liked: !newState }));
      }
    }
  }, [characterId, engagementState.liked, trackLike]);

  const toggleBookmark = useCallback(async () => {
    const newState = !engagementState.bookmarked;
    
    // Optimistic UI update
    setEngagementState(prev => ({ ...prev, bookmarked: newState }));

    if (newState) {
      const success = await trackBookmark(characterId, {
        character_context: 'toggle_bookmark'
      });
      if (!success) {
        // Rollback on failure
        setEngagementState(prev => ({ ...prev, bookmarked: !newState }));
      }
    }
  }, [characterId, engagementState.bookmarked, trackBookmark]);

  return {
    liked: engagementState.liked,
    bookmarked: engagementState.bookmarked,
    loaded: engagementState.loaded,
    loading: engagementState.loading,
    toggleLike,
    toggleBookmark
  };
};

export default useEngagementTracking;