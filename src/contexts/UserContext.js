// src/contexts/UserContext.js - FIXED: Step 1-2 Subscription Display
// ✅ CHANGES:
// 1. Added getTierDisplayName helper function (NEW - line 132-142)
// 2. Updated getSubscriptionInfo to use helper instead of non-existent field (line 160)

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

// ✅ STEP 1: Create context with DEFAULT VALUE to prevent undefined returns
const UserContext = createContext({
  user: null,
  setUser: () => {},
  loading: true,
  refreshing: false,
  refreshSubscription: async () => null,
  hasSubscription: () => false,
  getSubscriptionInfo: () => ({
    tier: 'free',
    status: 'none',
    display_name: 'Free',
    is_active: false,
    expires_at: null
  })
});

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Refresh user data and subscription status from API
   * DEFENSIVE: Can be called after Stripe success or anytime
   */
  const refreshSubscription = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setRefreshing(true);
      }

      console.log('🔄 Refreshing user subscription data...');

      const response = await fetch(`${API_BASE}/api/auth/me`, {
        credentials: 'include'
      });

      console.log('🌐 Refresh response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.error) {
        // DEFENSIVE: Update user state with fresh data
        setUser(data);
        
        console.log('✅ Subscription refreshed successfully');
        console.log('📊 Current tier:', data.subscription_tier || 'free');
        console.log('💳 Subscription status:', data.subscription_status || 'none');
        
        return data;
      } else {
        console.error('❌ Refresh API error:', data.error);
        return null;
      }

    } catch (error) {
      console.error('❌ Subscription refresh failed:', error);
      // DEFENSIVE: Don't clear user on refresh failure
      return null;
    } finally {
      if (!silent) {
        setRefreshing(false);
      }
    }
  }, []);

  /**
   * Check if user has a specific subscription tier
   * DEFENSIVE: Returns false if no subscription data
   */
  const hasSubscription = useCallback((tierName = null) => {
    if (!user) return false;
    
    const tier = user.subscription_tier || 'free';
    const status = user.subscription_status || 'none';
    
    // Check if subscription is active
    const isActive = ['active', 'trialing'].includes(status);
    
    if (!tierName) {
      // Check if has any paid subscription
      return isActive && tier !== 'free';
    }
    
    // Check for specific tier
    return isActive && tier === tierName;
  }, [user]);

  /**
   * ✅ STEP 1: NEW HELPER - Map tier name to display name
   * DEFENSIVE: Always returns valid display name
   */
  const getTierDisplayName = useCallback((tier) => {
    const tierMap = {
      'free': 'Free',
      'starter': 'Starter',
      'pro': 'Pro',
      'unlimited': 'Unlimited'
    };
    return tierMap[tier?.toLowerCase()] || 'Free';
  }, []);

  /**
   * ✅ STEP 2: FIXED - Get current subscription tier info with proper display name mapping
   * DEFENSIVE: Always returns valid object
   */
  const getSubscriptionInfo = useCallback(() => {
    if (!user) {
      return {
        tier: 'free',
        status: 'none',
        display_name: 'Free',
        is_active: false,
        expires_at: null
      };
    }

    return {
      tier: user.subscription_tier || 'free',
      status: user.subscription_status || 'none',
      // ✅ FIXED: Use helper instead of non-existent user.subscription_tier_display
      display_name: getTierDisplayName(user.subscription_tier),
      is_active: ['active', 'trialing'].includes(user.subscription_status),
      expires_at: user.subscription_expires_at || null,
      message_limit: user.message_limit || 0,
      character_limit: user.character_limit || 0,
      // ✅ BONUS: Add usage stats if available
      messages_used: user.messages_used || 0,
      characters_created: user.custom_character_count || 0
    };
  }, [user, getTierDisplayName]);

  // ✅ Initial user load with error handling
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: 'include'
        });
        
        console.log('🌐 auth/me status:', response.status);
        
        const data = await response.json().catch(() => ({}));
        
        if (data && !data.error) {
          setUser(data);
          console.log('👤 User loaded:', data.username);
          console.log('💎 Subscription:', data.subscription_tier || 'free');
          console.log('📊 Message limit:', data.message_limit || 150);
        } else {
          setUser(null);
          console.log('👤 No authenticated user');
        }
      } catch (err) {
        console.error('❌ auth/me fetch failed:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const value = {
    user,
    setUser,
    loading,
    refreshing,
    refreshSubscription,
    hasSubscription,
    getSubscriptionInfo
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// ✅ DEFENSIVE useUser hook with guard and helpful error
export function useUser() {
  const context = useContext(UserContext);
  
  // ✅ CRITICAL FIX: Guard against undefined context
  if (context === undefined) {
    console.error('❌ useUser() called outside UserProvider!');
    console.error('📍 Stack trace:', new Error().stack);
    
    // ✅ Return safe fallback instead of undefined
    return {
      user: null,
      setUser: () => {
        console.warn('⚠️ setUser called outside UserProvider - no-op');
      },
      loading: false,
      refreshing: false,
      refreshSubscription: async () => {
        console.warn('⚠️ refreshSubscription called outside UserProvider');
        return null;
      },
      hasSubscription: () => false,
      getSubscriptionInfo: () => ({
        tier: 'free',
        status: 'none',
        display_name: 'Free',
        is_active: false,
        expires_at: null
      })
    };
  }
  
  return context;
}