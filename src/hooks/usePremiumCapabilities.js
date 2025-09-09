// src/hooks/usePremiumCapabilities.js - New consolidated hook replacing usePremiumCharacters
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Subscription states from backend enum
const SUBSCRIPTION_STATES = {
  FREE: 'free',
  TRIAL_ACTIVE: 'trial_active', 
  TRIAL_EXPIRED: 'trial_expired',
  PREMIUM_ACTIVE: 'premium_active',
  PREMIUM_EXPIRED: 'premium_expired',
  PENDING_APPROVAL: 'pending_approval'
};

export default function usePremiumCapabilities() {
  const { token } = useAuth();
  const { user } = useUser();
  
  // Core state - single source of truth
  const [capabilities, setCapabilities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Performance tracking
  const [lastFetch, setLastFetch] = useState(null);
  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map()); // ETag cache
  
  // Computed flags for component consumption
  const subscriptionState = capabilities?.subscription_state;
  const isPremium = capabilities?.is_premium || false;
  const canCreateCharacter = capabilities?.can_create_character || false;
  const canChatWithCharacter = capabilities?.can_chat_with_character || false;
  const shouldShowUpgrade = capabilities?.should_show_upgrade || false;
  const shouldShowTrial = capabilities?.should_show_trial_prompt || false;
  const primaryAction = capabilities?.primary_cta_action || 'explore';
  
  // Business logic flags
  const isTrialActive = subscriptionState === SUBSCRIPTION_STATES.TRIAL_ACTIVE;
  const isTrialExpired = subscriptionState === SUBSCRIPTION_STATES.TRIAL_EXPIRED;
  const hasPendingCharacter = subscriptionState === SUBSCRIPTION_STATES.PENDING_APPROVAL;
  const daysRemaining = capabilities?.days_remaining;
  
  // Cache management
  const getCacheKey = useCallback(() => {
    return `capabilities:${user?.id}`;
  }, [user?.id]);
  
  const fetchCapabilities = useCallback(async (forceRefresh = false) => {
    if (!user?.id || !token) {
      setLoading(false);
      return;
    }

    // Prevent duplicate requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const cacheKey = getCacheKey();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Add ETag for client-side caching
      if (!forceRefresh && cacheRef.current.has(cacheKey)) {
        headers['If-None-Match'] = cacheRef.current.get(cacheKey);
      }

      const response = await fetch(`${API_BASE}/api/premium/capabilities/${user.id}`, {
        method: 'GET',
        headers,
        signal: abortControllerRef.current.signal
      });

      // Handle 304 Not Modified
      if (response.status === 304) {
        console.log('Capabilities unchanged - using cache');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Capabilities API failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Store ETag for future requests
      const etag = response.headers.get('ETag');
      if (etag) {
        cacheRef.current.set(cacheKey, etag);
      }

      setCapabilities(data.capabilities);
      setLastFetch(Date.now());
      
      console.log('🎯 Capabilities loaded:', {
        state: data.capabilities.subscription_state,
        canCreate: data.capabilities.can_create_character,
        performance: data._performance
      });

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Capabilities fetch aborted');
        return;
      }
      
      console.error('Capabilities fetch failed:', err);
      setError(err.message);
      
      // Set safe fallback capabilities
      setCapabilities({
        subscription_state: SUBSCRIPTION_STATES.FREE,
        is_premium: false,
        can_create_character: false,
        can_chat_with_character: false,
        can_access_templates: true,
        should_show_upgrade: false,
        should_show_trial_prompt: true,
        character_count: 0,
        character_limit: 1,
        primary_cta_action: 'start_trial'
      });
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [user?.id, token, getCacheKey]);

  // Auto-fetch on mount and user changes
  useEffect(() => {
    fetchCapabilities();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCapabilities]);

  // Invalidate cache and refresh
  const invalidateAndRefresh = useCallback(() => {
    const cacheKey = getCacheKey();
    cacheRef.current.delete(cacheKey);
    return fetchCapabilities(true);
  }, [getCacheKey, fetchCapabilities]);

  // Manual refresh with rate limiting
  const refresh = useCallback(() => {
    const now = Date.now();
    if (lastFetch && now - lastFetch < 5000) {
      console.log('Rate limiting capabilities refresh');
      return Promise.resolve();
    }
    return fetchCapabilities(true);
  }, [fetchCapabilities, lastFetch]);

  return {
    // Core data
    capabilities,
    loading,
    error,
    
    // Subscription state
    subscriptionState,
    isPremium,
    isTrialActive,
    isTrialExpired,
    hasPendingCharacter,
    daysRemaining,
    
    // Capabilities
    canCreateCharacter,
    canChatWithCharacter,
    
    // UI flags
    shouldShowUpgrade,
    shouldShowTrial,
    primaryAction,
    
    // Character info
    characterCount: capabilities?.character_count || 0,
    characterLimit: capabilities?.character_limit || 1,
    
    // Actions
    refresh,
    invalidateAndRefresh,
    
    // Meta
    isInitialized: !loading && capabilities !== null,
    lastFetch
  };
}