// src/hooks/usePremiumCapabilities.js - Backend-compatible capabilities hook
import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '../contexts/UserContext';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

// Subscription states computed from backend data
const SUBSCRIPTION_STATES = {
  FREE: 'free',
  TRIAL_ACTIVE: 'trial_active', 
  TRIAL_EXPIRED: 'trial_expired',
  PREMIUM_ACTIVE: 'premium_active',
  PREMIUM_EXPIRED: 'premium_expired',
  PENDING_APPROVAL: 'pending_approval'
};

// Primary CTA action for UI
const CTA_ACTIONS = {
  EXPLORE: 'explore',
  START_TRIAL: 'start_trial',
  CREATE_CHARACTER: 'create_character',
  UPGRADE: 'upgrade',
  MANAGE_SUBSCRIPTION: 'manage_subscription'
};

export default function usePremiumCapabilities() {
  const { user } = useUser();
  
  // Core state - single source of truth
  const [capabilities, setCapabilities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Performance tracking
  const [lastFetch, setLastFetch] = useState(null);
  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map()); // Simple cache for rate limiting
  
  // Transform backend premium_status into frontend capabilities
  const transformStatusToCapabilities = useCallback((premiumStatus) => {
    if (!premiumStatus) {
      return {
        subscription_state: SUBSCRIPTION_STATES.FREE,
        is_premium: false,
        can_create_character: false,
        can_chat_with_character: false,
        can_access_templates: true,
        should_show_upgrade: false,
        should_show_trial_prompt: true,
        character_count: 0,
        character_limit: 1,
        primary_cta_action: CTA_ACTIONS.START_TRIAL,
        days_remaining: null
      };
    }

    // Compute subscription state from backend data
    const computeSubscriptionState = () => {
      const now = new Date();
      const isTrialActive = premiumStatus.trial_ends_at && new Date(premiumStatus.trial_ends_at) > now;
      const isPremiumActive = premiumStatus.premium_expires_at && new Date(premiumStatus.premium_expires_at) > now;
      
      // Check for pending character approval state
      if (premiumStatus.custom_character_count > 0 && !premiumStatus.is_premium && !isTrialActive) {
        // User has characters but no active subscription - likely pending approval or expired trial
        return SUBSCRIPTION_STATES.PENDING_APPROVAL;
      }
      
      if (isTrialActive) {
        return SUBSCRIPTION_STATES.TRIAL_ACTIVE;
      }
      
      if (premiumStatus.trial_ends_at && !isTrialActive && !isPremiumActive) {
        return SUBSCRIPTION_STATES.TRIAL_EXPIRED;
      }
      
      if (isPremiumActive) {
        return SUBSCRIPTION_STATES.PREMIUM_ACTIVE;
      }
      
      if (premiumStatus.premium_expires_at && !isPremiumActive) {
        return SUBSCRIPTION_STATES.PREMIUM_EXPIRED;
      }
      
      return SUBSCRIPTION_STATES.FREE;
    };

    const subscriptionState = computeSubscriptionState();
    const isActive = subscriptionState === SUBSCRIPTION_STATES.TRIAL_ACTIVE || 
                     subscriptionState === SUBSCRIPTION_STATES.PREMIUM_ACTIVE;

    // Compute days remaining
    const computeDaysRemaining = () => {
      const now = new Date();
      if (premiumStatus.trial_ends_at) {
        const trialEnd = new Date(premiumStatus.trial_ends_at);
        if (trialEnd > now) {
          return Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
        }
      }
      if (premiumStatus.premium_expires_at) {
        const premiumEnd = new Date(premiumStatus.premium_expires_at);
        if (premiumEnd > now) {
          return Math.ceil((premiumEnd - now) / (1000 * 60 * 60 * 24));
        }
      }
      return null;
    };

    // Compute primary CTA based on state
    const computePrimaryCTA = () => {
      switch (subscriptionState) {
        case SUBSCRIPTION_STATES.FREE:
          return CTA_ACTIONS.START_TRIAL;
        case SUBSCRIPTION_STATES.TRIAL_ACTIVE:
        case SUBSCRIPTION_STATES.PREMIUM_ACTIVE:
          return premiumStatus.can_create_character ? CTA_ACTIONS.CREATE_CHARACTER : CTA_ACTIONS.EXPLORE;
        case SUBSCRIPTION_STATES.TRIAL_EXPIRED:
        case SUBSCRIPTION_STATES.PREMIUM_EXPIRED:
          return CTA_ACTIONS.UPGRADE;
        case SUBSCRIPTION_STATES.PENDING_APPROVAL:
          return CTA_ACTIONS.EXPLORE;
        default:
          return CTA_ACTIONS.EXPLORE;
      }
    };

    return {
      // Core subscription info
      subscription_state: subscriptionState,
      is_premium: premiumStatus.is_premium || false,
      is_trial: subscriptionState === SUBSCRIPTION_STATES.TRIAL_ACTIVE,
      days_remaining: computeDaysRemaining(),
      
      // Capabilities from backend
      can_create_character: premiumStatus.can_create_character || false,
      can_chat_with_character: isActive,
      can_access_templates: true, // Templates are always accessible for browsing
      
      // UI flags computed from state
      should_show_upgrade: !isActive && subscriptionState !== SUBSCRIPTION_STATES.FREE,
      should_show_trial_prompt: subscriptionState === SUBSCRIPTION_STATES.FREE,
      
      // Character info
      character_count: premiumStatus.custom_character_count || 0,
      character_limit: 1, // Business rule: 1 character per user
      
      // UI guidance
      primary_cta_action: computePrimaryCTA(),
      
      // Raw backend data for advanced use cases
      _raw: premiumStatus
    };
  }, []);
  
  // Cache management
  const getCacheKey = useCallback(() => {
    return `capabilities:${user?.id}`;
  }, [user?.id]);
  
  const fetchCapabilities = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Simple rate limiting - prevent requests within 3 seconds
    const cacheKey = getCacheKey();
    const cached = cacheRef.current.get(cacheKey);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < 3000) {
      console.log('Rate limiting capabilities fetch');
      setCapabilities(cached.data);
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

      const response = await fetch(`${API_BASE}/api/premium/status/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Premium status API failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform backend status into frontend capabilities
      const transformedCapabilities = transformStatusToCapabilities(data.premium_status);
      
      setCapabilities(transformedCapabilities);
      setLastFetch(Date.now());
      
      // Cache the result
      cacheRef.current.set(cacheKey, {
        data: transformedCapabilities,
        timestamp: Date.now()
      });
      
      console.log('🎯 Capabilities loaded:', {
        state: transformedCapabilities.subscription_state,
        canCreate: transformedCapabilities.can_create_character,
        primaryCTA: transformedCapabilities.primary_cta_action,
        daysRemaining: transformedCapabilities.days_remaining
      });

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Capabilities fetch aborted');
        return;
      }
      
      console.error('Capabilities fetch failed:', err);
      setError(err.message);
      
      // Set safe fallback capabilities for free user
      const fallbackCapabilities = transformStatusToCapabilities(null);
      setCapabilities(fallbackCapabilities);
      
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [user?.id, getCacheKey, transformStatusToCapabilities]);

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

  // Computed flags for component consumption
  const subscriptionState = capabilities?.subscription_state;
  const isPremium = capabilities?.is_premium || false;
  const canCreateCharacter = capabilities?.can_create_character || false;
  const canChatWithCharacter = capabilities?.can_chat_with_character || false;
  const shouldShowUpgrade = capabilities?.should_show_upgrade || false;
  const shouldShowTrial = capabilities?.should_show_trial_prompt || false;
  const primaryAction = capabilities?.primary_cta_action || CTA_ACTIONS.EXPLORE;
  
  // Business logic flags
  const isTrialActive = subscriptionState === SUBSCRIPTION_STATES.TRIAL_ACTIVE;
  const isTrialExpired = subscriptionState === SUBSCRIPTION_STATES.TRIAL_EXPIRED;
  const hasPendingCharacter = subscriptionState === SUBSCRIPTION_STATES.PENDING_APPROVAL;
  const daysRemaining = capabilities?.days_remaining;

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
    lastFetch,
    
    // Constants for components
    SUBSCRIPTION_STATES,
    CTA_ACTIONS
  };
}