// src/hooks/useUsageTracking.js - Enhanced with defensive patterns and soft messaging
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Enhanced usage tracking hook following PDF defensive-first patterns
 * - Backend counting, frontend soft reminders only
 * - Character-scoped isolation 
 * - Defensive fallbacks always
 * - Never blocks chat experience
 */
const useUsageTracking = (character) => {
  const { token } = useAuth();
  const { user } = useUser();
  
  // Core usage state
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Cache and performance
  const cacheRef = useRef(new Map());
  const lastFetchRef = useRef(0);
  const CACHE_DURATION = 30000; // 30 seconds
  
  // Character classification following your patterns
  const isCustomCharacter = character && character.startsWith('user_');
  
  // Defensive data fetching with caching
  const fetchUsageData = useCallback(async () => {
    if (!isCustomCharacter || !token || !user?.id) {
      return;
    }
    
    // Check cache first
    const cacheKey = `${user.id}_${character}`;
    const cached = cacheRef.current.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      setUsage(cached.data);
      return;
    }
    
    // Rate limiting - don't fetch too frequently
    if (now - lastFetchRef.current < 5000) {
      return;
    }
    
    setLoading(true);
    setError(null);
    lastFetchRef.current = now;
    
    try {
      // Fetch from your existing subscription endpoint
      const response = await fetch(`${API_BASE}/api/premium/user_subscription/${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10s timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.status === 'success' && result.subscription) {
        const subscriptionData = result.subscription;
        
        // Cache the result
        cacheRef.current.set(cacheKey, {
          data: subscriptionData,
          timestamp: now
        });
        
        setUsage(subscriptionData);
        
        console.log('Usage data refreshed for', character, subscriptionData);
      } else {
        throw new Error(result.error || 'Invalid subscription data');
      }
      
    } catch (error) {
      console.warn('Usage fetch failed (using fallback):', error);
      setError(error.message);
      
      // Defensive fallback - always works
      const fallbackUsage = getFallbackUsageData();
      setUsage(fallbackUsage);
    } finally {
      setLoading(false);
    }
  }, [isCustomCharacter, character, token, user?.id]);
  
  // Defensive fallback data matching your backend patterns
  const getFallbackUsageData = useCallback(() => {
    return {
      tier: 'free',
      tier_display: 'Free',
      message_limit: 150,
      messages_used: 0,
      messages_remaining: 150,
      unlimited: false,
      can_send_message: true,
      data_source: 'fallback'
    };
  }, []);
  
  // Auto-refresh usage data when character changes
  useEffect(() => {
    if (isCustomCharacter) {
      fetchUsageData();
    } else {
      // Clear usage data for non-custom characters
      setUsage(null);
      setError(null);
    }
  }, [isCustomCharacter, fetchUsageData]);
  
  // Soft reminder logic - contextual messaging
  const getSoftReminder = useCallback(() => {
    if (!isCustomCharacter || !usage) {
      return null;
    }
    
    if (usage.unlimited) {
      return null; // No reminders for unlimited users
    }
    
    const { messages_used, message_limit, can_send_message } = usage;
    const usagePercent = message_limit > 0 ? (messages_used / message_limit) * 100 : 0;
    
    // Limit reached
    if (!can_send_message || messages_used >= message_limit) {
      return {
        type: 'limit_reached',
        message: 'Message limit reached',
        actionText: 'See upgrade plans',
        severity: 'high'
      };
    }
    
    // Close to limit (90%+)
    if (usagePercent >= 90) {
      return {
        type: 'very_close',
        message: 'Almost at your limit',
        actionText: 'Upgrade to Pro',
        severity: 'medium'
      };
    }
    
    // Approaching limit (80%+)
    if (usagePercent >= 80) {
      return {
        type: 'approaching',
        message: 'Close to your limit',
        actionText: 'Upgrade to continue',
        severity: 'low'
      };
    }
    
    return null;
  }, [isCustomCharacter, usage]);
  
  // Manual refresh function for post-message updates
  const refreshUsage = useCallback(async () => {
    if (!isCustomCharacter) {
      return true;
    }
    
    // Clear cache to force fresh fetch
    const cacheKey = `${user?.id}_${character}`;
    cacheRef.current.delete(cacheKey);
    
    try {
      await fetchUsageData();
      return true;
    } catch (error) {
      console.error('Manual usage refresh failed:', error);
      return false;
    }
  }, [isCustomCharacter, character, user?.id, fetchUsageData]);
  
  // Upgrade suggestion logic
  const getUpgradeSuggestion = useCallback(() => {
    if (!usage || usage.unlimited) {
      return null;
    }
    
    const currentTier = usage.tier;
    
    // Upgrade path suggestions
    const upgradePaths = {
      'free': {
        suggestedTier: 'Starter',
        suggestedLimit: '500 messages/month',
        suggestedPrice: '£3.99'
      },
      'starter': {
        suggestedTier: 'Pro', 
        suggestedLimit: '2,000 messages/month',
        suggestedPrice: '£6.99'
      },
      'pro': {
        suggestedTier: 'Unlimited',
        suggestedLimit: 'Unlimited messages',
        suggestedPrice: '£111.99'
      }
    };
    
    return upgradePaths[currentTier] || null;
  }, [usage]);
  
  // Check if user can send messages (for chat input state)
  const canSendMessage = usage?.can_send_message ?? true;
  
  // Show warning state for UI components
  const showWarning = !canSendMessage || getSoftReminder()?.severity === 'high';
  
  // Warning message for UI display
  const warningMessage = getSoftReminder()?.message || null;
  
  return {
    // Core usage data
    usage,
    isCustomCharacter,
    canSendMessage,
    
    // UI state helpers
    showSoftReminder: getSoftReminder() !== null,
    softReminder: getSoftReminder(),
    showWarning,
    warningMessage,
    
    // Loading states
    loading,
    error,
    
    // Actions
    refreshUsage,
    getUpgradeSuggestion,
    
    // Compatibility with existing components (if needed)
    messages_used: usage?.messages_used || 0,
    message_limit: usage?.message_limit || 150,
    unlimited: usage?.unlimited || false,
    
    // Debug info (development only)
    ...(process.env.NODE_ENV === 'development' && {
      debug: {
        cacheSize: cacheRef.current.size,
        lastFetch: lastFetchRef.current,
        fallbackActive: usage?.data_source === 'fallback'
      }
    })
  };
};

export default useUsageTracking;