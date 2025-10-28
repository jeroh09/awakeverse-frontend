// src/hooks/useEngagementTracking.js
// UPDATED: Add function to load user's engagement history

import { useState, useCallback, useRef, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import api from '../api';

/**
 * Hook for tracking user engagement with Market Hub characters
 * Now includes loading existing engagement state
 */
export const useEngagementTracking = () => {
  const { use } = useUser();
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
      const response = await api.post('/market-hub/engage', {
        character_id: characterId,
        engagement_type: engagementType,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          source: 'market_hub_ui'
        }
      });

      if (response.data && response.data.status === 'success') {
        trackingCache.current.set(cacheKey, now);
        return true;
      } else {
        throw new Error(response.data?.error || 'Engagement tracking failed');
      }

    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
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
        // Call backend to get user's engagements for this character
        const response = await api.get(`/market-hub/character/${characterId}/user-engagement`);
        
        if (isMounted && response.data) {
          const { liked, bookmarked } = response.data;
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