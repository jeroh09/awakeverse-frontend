// src/contexts/UserContext.js - ENHANCED with Subscription Refresh
// DEFENSIVE: Adds subscription refresh for Stripe success handling

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import jwtDecode from 'jwt-decode';

// Add this constant at the top
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ============================================================================
  // STEP 4: SUBSCRIPTION REFRESH METHOD
  // ============================================================================

  /**
   * Refresh user data and subscription status from API
   * DEFENSIVE: Can be called after Stripe success or anytime
   * 
   * @param {boolean} silent - If true, don't show loading state
   * @returns {Promise<object|null>} Updated user data or null on error
   */
  const refreshSubscription = useCallback(async (silent = false) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('⚠️ No token available for refresh');
      return null;
    }

    try {
      if (!silent) {
        setRefreshing(true);
      }

      console.log('🔄 Refreshing user subscription data...');

      const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';
      const response = await fetch(`${API_BASE}/api/current_user`, {    
        headers: {
          Authorization: `Bearer ${token}`
        },
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
   * Get current subscription tier info
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
      display_name: user.subscription_tier_display || 'Free',
      is_active: ['active', 'trialing'].includes(user.subscription_status),
      expires_at: user.subscription_expires_at || null,
      message_limit: user.message_limit || 0,
      character_limit: user.character_limit || 0
    };
  }, [user]);

  // ============================================================================
  // INITIAL USER LOAD (existing logic)
  // ============================================================================

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn("⚠️ No token found, user is null");
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);

      if (typeof decoded.sub === 'string') {
        fetch(`${API_BASE}/api/current_user`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          credentials: 'include'
        })
          .then(res => {
            console.log("🌐 Response status:", res.status);
            return res.json();
          })
          .then(data => {
            if (!data.error) {
              setUser(data);
              
              // Log subscription info on initial load
              console.log('👤 User loaded:', data.username);
              console.log('💎 Subscription:', data.subscription_tier || 'free');
            } else {
              console.error('❌ current_user API error:', data.error);
              setUser(null);
            }
          })
          .catch(err => {
            console.error('❌ fetch failed:', err);
            setUser(null);
          })
          .finally(() => {
            setLoading(false);
          });

      } else {
        console.warn('❗ Invalid sub format in token');
        setUser(null);
        setLoading(false);
      }

    } catch (err) {
      console.error('❌ jwtDecode error:', err);
      setUser(null);
      setLoading(false);
    }
  }, []);

  const value = {
    user,
    setUser,
    loading,
    refreshing,
    
    // NEW: Subscription management methods
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

export function useUser() {
  return useContext(UserContext);
}
