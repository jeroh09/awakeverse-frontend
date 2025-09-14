// hooks/useUsageTracking.js - Track usage for custom characters only
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

const useUsageTracking = (characterKey) => {
  const { token } = useAuth();
  const { user } = useUser();
  
  // State for usage tracking
  const [usage, setUsage] = useState({
    messages_used: 0,
    message_limit: 150,
    tier: 'free',
    tier_display: 'Free',
    subscription_active: false,
    unlimited: false,
    loading: true,
    error: null
  });

  // Friendly enforcement states
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  // Only track custom characters (user_xxx format)
  const isCustomCharacter = characterKey?.startsWith('user_');

  // Fetch usage data from backend
  const fetchUsageData = useCallback(async () => {
    // Skip tracking for static characters
    if (!isCustomCharacter || !user?.id || !token) {
      setUsage(prev => ({
        ...prev,
        loading: false,
        unlimited: true, // Static characters are unlimited
        error: null
      }));
      return;
    }

    try {
      setUsage(prev => ({ ...prev, loading: true, error: null }));

      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/premium/subscription/${user.id}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const subscription = data.subscription;

        const newUsage = {
          messages_used: subscription.total_usage_this_month || 0,
          message_limit: subscription.message_limit,
          tier: subscription.tier,
          tier_display: subscription.tier_display,
          subscription_active: subscription.subscription_active,
          unlimited: subscription.message_limit === -1,
          loading: false,
          error: null
        };

        setUsage(newUsage);

        // Calculate friendly enforcement messages
        calculateWarningState(newUsage);

      } else {
        // Defensive fallback
        setUsage({
          messages_used: 0,
          message_limit: 150,
          tier: 'free',
          tier_display: 'Free',
          subscription_active: false,
          unlimited: false,
          loading: false,
          error: 'usage_fetch_failed'
        });
      }

    } catch (error) {
      console.warn('Usage tracking failed (non-critical):', error);
      // Defensive fallback - never block functionality
      setUsage({
        messages_used: 0,
        message_limit: 150,
        tier: 'free',
        tier_display: 'Free',
        subscription_active: false,
        unlimited: false,
        loading: false,
        error: 'usage_service_unavailable'
      });
    }
  }, [isCustomCharacter, user?.id, token]);

  // Calculate friendly warning states (no countdown, just friendly messages)
  const calculateWarningState = useCallback((usageData) => {
    if (usageData.unlimited || !isCustomCharacter) {
      setShowWarning(false);
      setWarningMessage('');
      return;
    }

    const { messages_used, message_limit } = usageData;
    const percentage = (messages_used / message_limit) * 100;

    if (percentage >= 100) {
      setShowWarning(true);
      setWarningMessage('Monthly limit reached - upgrade to continue chatting');
    } else if (percentage >= 90) {
      setShowWarning(true);
      setWarningMessage('Almost at your monthly limit - consider upgrading');
    } else if (percentage >= 75) {
      setShowWarning(true);
      setWarningMessage('You\'re using most of your monthly messages');
    } else {
      setShowWarning(false);
      setWarningMessage('');
    }
  }, [isCustomCharacter]);

  // Load usage data on mount and character change
  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  // Refresh usage data (call after sending messages)
  const refreshUsage = useCallback(() => {
    if (isCustomCharacter) {
      fetchUsageData();
    }
  }, [fetchUsageData, isCustomCharacter]);

  // Get display text for usage indicator
  const getUsageDisplayText = useCallback(() => {
    if (!isCustomCharacter) {
      return null; // No display for static characters
    }

    if (usage.loading) {
      return 'Loading...';
    }

    if (usage.unlimited) {
      return 'Unlimited';
    }

    return `${usage.messages_used}/${usage.message_limit} messages`;
  }, [isCustomCharacter, usage]);

  // Check if user can send messages
  const canSendMessage = !isCustomCharacter || usage.unlimited || usage.messages_used < usage.message_limit;

  // Get upgrade suggestion based on current tier
  const getUpgradeSuggestion = useCallback(() => {
    if (!isCustomCharacter || usage.unlimited) {
      return null;
    }

    switch (usage.tier) {
      case 'free':
        return {
          suggestedTier: 'starter',
          suggestedPrice: '$9.99',
          suggestedLimit: '500 messages/month'
        };
      case 'starter':
        return {
          suggestedTier: 'pro',
          suggestedPrice: '$19.99',
          suggestedLimit: '2000 messages/month'
        };
      case 'pro':
        return {
          suggestedTier: 'unlimited',
          suggestedPrice: '$49.99',
          suggestedLimit: 'unlimited messages'
        };
      default:
        return null;
    }
  }, [isCustomCharacter, usage.tier, usage.unlimited]);

  return {
    // Usage data
    usage,
    isCustomCharacter,
    canSendMessage,
    
    // Display helpers
    getUsageDisplayText,
    getUpgradeSuggestion,
    
    // Warning states (friendly, non-blocking)
    showWarning,
    warningMessage,
    
    // Actions
    refreshUsage,
    
    // States for UI
    isLoading: usage.loading,
    hasError: !!usage.error,
    isUnlimited: usage.unlimited,
    isAtLimit: usage.messages_used >= usage.message_limit && !usage.unlimited,
    needsUpgrade: (usage.messages_used / usage.message_limit) >= 0.9 && !usage.unlimited
  };
};

export default useUsageTracking;