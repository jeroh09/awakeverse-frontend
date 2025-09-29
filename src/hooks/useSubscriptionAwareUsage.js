// src/hooks/useSubscriptionAwareUsage.js
// Enhanced usage tracking hook with subscription integration
import { useState, useEffect, useCallback, useRef } from 'react';
import SubscriptionService from '../services/SubscriptionService';

export const useSubscriptionAwareUsage = (character, user_id) => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState([]);
  const [error, setError] = useState(null);
  
  // Track refresh attempts for defensive behavior
  const refreshAttempts = useRef(0);
  const maxRefreshAttempts = 3;

  // Test function - can be called anytime during development
  const runUsageTests = useCallback(async () => {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Tests only available in development mode');
      return [];
    }

    console.log('Running usage tracking tests...');
    const tests = [];

    try {
      // Test 1: Service integration
      const integrationTests = await SubscriptionService.runIntegrationTests(user_id);
      tests.push(...integrationTests);

      // Test 2: Character type detection (follows your convention)
      const isCustomCharacter = character && character.startsWith('user_');
      tests.push({
        name: 'Character Type Detection',
        passed: typeof isCustomCharacter === 'boolean',
        data: { character, isCustomCharacter },
        note: 'Custom characters start with user_'
      });

      // Test 3: Usage limit calculations
      if (subscriptionData?.subscription) {
        const usage = subscriptionData.subscription;
        const usagePercent = usage.message_limit > 0 ? 
          (usage.messages_used / usage.message_limit) * 100 : 0;
        
        tests.push({
          name: 'Usage Calculation Accuracy',
          passed: usagePercent >= 0 && usagePercent <= 100,
          data: { 
            usagePercent, 
            messages_used: usage.messages_used, 
            message_limit: usage.message_limit,
            can_send_message: usage.can_send_message
          }
        });

        // Test 4: Warning threshold logic
        const warningThreshold = 0.8;
        const shouldShowWarning = isCustomCharacter && usagePercent > (warningThreshold * 100);
        tests.push({
          name: 'Warning Threshold Logic',
          passed: typeof shouldShowWarning === 'boolean',
          data: { shouldShowWarning, threshold: warningThreshold, usagePercent }
        });
      }

      setTestResults(tests);
      console.log('Usage tests completed:', tests);
      
      return tests;
    } catch (error) {
      console.error('Usage tests failed:', error);
      const failedTest = { 
        name: 'Usage Test Suite', 
        passed: false, 
        error: error.message 
      };
      setTestResults([failedTest]);
      return [failedTest];
    }
  }, [character, user_id, subscriptionData]);

  // Load subscription data with defensive retry logic
  const refreshUsage = useCallback(async () => {
    // Prevent infinite retry loops
    if (refreshAttempts.current >= maxRefreshAttempts) {
      console.warn('Max refresh attempts reached, using fallback data');
      setSubscriptionData(SubscriptionService.getFallbackSubscriptionData());
      setLoading(false);
      return false;
    }

    setLoading(true);
    setError(null);
    refreshAttempts.current += 1;

    try {
      const data = await SubscriptionService.getUserSubscriptionStatus(user_id);
      
      if (data.status === 'success') {
        setSubscriptionData(data);
        refreshAttempts.current = 0; // Reset on success
        
        // Auto-test after successful refresh in development
        if (process.env.NODE_ENV === 'development') {
          setTimeout(() => runUsageTests(), 100);
        }
        
        return true;
      } else {
        throw new Error(data.error || 'Failed to load subscription data');
      }
    } catch (error) {
      console.error('Failed to refresh usage:', error);
      setError(error.message);
      
      // Use fallback data on error
      setSubscriptionData(SubscriptionService.getFallbackSubscriptionData());
      return false;
    } finally {
      setLoading(false);
    }
  }, [user_id, runUsageTests]);

  // Initialize subscription data when user_id changes
  useEffect(() => {
    if (user_id) {
      refreshUsage();
    }
  }, [user_id, refreshUsage]);

  // Calculated values following your existing patterns
  const isCustomCharacter = character && character.startsWith('user_');
  const subscription = subscriptionData?.subscription;
  
  // Usage state calculations
  const canSendMessage = subscription?.can_send_message ?? true;
  const messagesUsed = subscription?.messages_used ?? 0;
  const messageLimit = subscription?.message_limit ?? 150;
  const unlimited = subscription?.unlimited ?? false;
  
  // Warning logic (matches your existing useUsageTracking pattern)
  const usagePercentage = messageLimit > 0 ? (messagesUsed / messageLimit) * 100 : 0;
  const showWarning = isCustomCharacter && !unlimited && usagePercentage > 80;
  const atLimit = isCustomCharacter && !unlimited && !canSendMessage;

  // Get upgrade suggestions following subscription_service.py logic
  const getUpgradeSuggestion = useCallback(() => {
    if (!subscription || unlimited) return null;

    const currentTier = subscription.tier;
    const upgradePaths = {
      'free': { 
        suggestedTier: 'Starter', 
        suggestedLimit: '500 messages/month', 
        suggestedPrice: '$9.99' 
      },
      'starter': { 
        suggestedTier: 'Pro', 
        suggestedLimit: '2,000 messages/month', 
        suggestedPrice: '$19.99' 
      },
      'pro': { 
        suggestedTier: 'Unlimited', 
        suggestedLimit: 'Unlimited messages', 
        suggestedPrice: '$49.99' 
      }
    };

    return upgradePaths[currentTier] || null;
  }, [subscription, unlimited]);

  // Warning message logic
  const warningMessage = useMemo(() => {
    if (!showWarning && !atLimit) return null;
    
    if (atLimit) {
      return 'Monthly limit reached - upgrade to continue chatting';
    }
    
    if (showWarning) {
      const remaining = messageLimit - messagesUsed;
      return `Almost at your monthly limit (${remaining} messages remaining) - consider upgrading`;
    }
    
    return null;
  }, [showWarning, atLimit, messageLimit, messagesUsed]);

  return {
    // Core usage data (matches your existing useUsageTracking interface)
    usage: subscription,
    isCustomCharacter,
    canSendMessage,
    showWarning,
    warningMessage,
    loading,
    error,
    
    // Extended usage info
    messagesUsed,
    messageLimit,
    unlimited,
    usagePercentage,
    atLimit,
    
    // Actions
    refreshUsage,
    getUpgradeSuggestion,
    
    // Testing interface (development only)
    runTests: runUsageTests,
    testResults,
    
    // Test utilities for development
    simulateUsageIncrease: (amount = 1) => {
      if (process.env.NODE_ENV !== 'development') {
        console.warn('Simulation only available in development');
        return;
      }
      
      if (subscription) {
        setSubscriptionData(prev => ({
          ...prev,
          subscription: {
            ...prev.subscription,
            messages_used: Math.min(
              prev.subscription.messages_used + amount,
              prev.subscription.message_limit
            ),
            can_send_message: (prev.subscription.messages_used + amount) < prev.subscription.message_limit
          }
        }));
        console.log(`Simulated ${amount} message usage increase`);
      }
    },
    
    simulateUpgrade: (tierName) => {
      if (process.env.NODE_ENV !== 'development') {
        console.warn('Simulation only available in development');
        return;
      }
      
      const tierLimits = {
        'starter': { limit: 500, display: 'Starter' },
        'pro': { limit: 2000, display: 'Pro' },
        'unlimited': { limit: -1, display: 'Unlimited' }
      };
      
      const tier = tierLimits[tierName];
      if (tier && subscription) {
        setSubscriptionData(prev => ({
          ...prev,
          subscription: {
            ...prev.subscription,
            tier: tierName,
            tier_display: tier.display,
            message_limit: tier.limit,
            unlimited: tier.limit === -1,
            can_send_message: true
          }
        }));
        console.log(`Simulated upgrade to ${tierName}`);
      }
    }
  };
};