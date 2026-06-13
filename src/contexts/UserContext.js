// src/contexts/UserContext.js
// PERSISTENT LOGIN: Silent refresh on 401 - stays logged in for 30 days
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

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

  // ============================================================================
  // HELPER: Read CSRF token from cookie (needed for refresh POST)
  // ============================================================================
  const getCsrfToken = () => {
    try {
      return document.cookie
        .split('; ')
        .find(row => row.startsWith('av_csrf='))
        ?.split('=')[1] || '';
    } catch {
      return '';
    }
  };

  // ============================================================================
  // HELPER: Attempt silent token refresh
  // Returns true if refresh succeeded, false otherwise
  // DEFENSIVE: Never throws - always returns bool
  // ============================================================================
  const attemptSilentRefresh = useCallback(async () => {
    try {
      const csrfToken = getCsrfToken();

      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        }
      });

      if (res.ok) {
        console.log('🔄 Silent refresh succeeded - session extended 30 days');
        return true;
      }

      console.log('🔒 Silent refresh failed - session truly expired');
      return false;
    } catch (err) {
      console.warn('⚠️ Silent refresh network error:', err.message);
      return false;
    }
  }, []);

  // ============================================================================
  // HELPER: Fetch /api/auth/me and set user state
  // Returns user data on success, null on failure
  // ============================================================================
  const fetchMe = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      credentials: 'include'
    });

    if (!res.ok) return { ok: false, status: res.status };

    const data = await res.json().catch(() => ({}));
    if (data && !data.error) {
      return { ok: true, data };
    }
    return { ok: false, status: res.status };
  }, []);

  // ============================================================================
  // INITIAL LOAD: Try /me → if 401 try refresh → retry /me → else logged out
  // ============================================================================
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Attempt 1: normal /me
        let result = await fetchMe();

        if (!result.ok && result.status === 401) {
          // Access token expired — try silent refresh using av_rid
          console.log('🔄 Access token expired, attempting silent refresh...');
          const refreshed = await attemptSilentRefresh();

          if (refreshed) {
            // Retry /me with new access token
            result = await fetchMe();
          }
        }

        if (result.ok) {
          setUser(result.data);
          console.log('👤 User loaded:', result.data.username);
          console.log('💎 Subscription:', result.data.subscription_tier || 'free');
        } else {
          // Both /me and refresh failed - genuinely logged out
          setUser(null);
          console.log('👤 No authenticated user');
        }
      } catch (err) {
        console.error('❌ Auth load failed:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [fetchMe, attemptSilentRefresh]);

  // ============================================================================
  // REFRESH SUBSCRIPTION: Manual refresh (e.g. after Stripe success)
  // Same silent-refresh pattern - does not log user out on transient failures
  // ============================================================================
  const refreshSubscription = useCallback(async (silent = false) => {
    try {
      if (!silent) setRefreshing(true);

      console.log('🔄 Refreshing user subscription data...');

      let result = await fetchMe();

      if (!result.ok && result.status === 401) {
        const refreshed = await attemptSilentRefresh();
        if (refreshed) {
          result = await fetchMe();
        }
      }

      if (result.ok) {
        setUser(result.data);
        console.log('✅ Subscription refreshed:', result.data.subscription_tier || 'free');
        return result.data;
      }

      // DEFENSIVE: Don't clear user on refresh failure
      console.error('❌ Refresh failed - keeping existing user state');
      return null;

    } catch (error) {
      console.error('❌ Subscription refresh error:', error);
      return null;
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, [fetchMe, attemptSilentRefresh]);

  // ============================================================================
  // SUBSCRIPTION HELPERS (unchanged)
  // ============================================================================
  const hasSubscription = useCallback((tierName = null) => {
    if (!user) return false;
    const tier = user.subscription_tier || 'free';
    const status = user.subscription_status || 'none';
    const isActive = ['active', 'trialing'].includes(status);
    if (!tierName) return isActive && tier !== 'free';
    return isActive && tier === tierName;
  }, [user]);

  const getTierDisplayName = useCallback((tier) => {
    const tierMap = {
      'free': 'Free',
      'starter': 'Starter',
      'pro': 'PROFESSIONAL',
      'unlimited': 'Unlimited'
    };
    return tierMap[tier?.toLowerCase()] || 'Free';
  }, []);

  const getSubscriptionInfo = useCallback(() => {
    if (!user) {
      return { tier: 'free', status: 'none', display_name: 'Free', is_active: false, expires_at: null };
    }
    return {
      tier: user.subscription_tier || 'free',
      status: user.subscription_status || 'none',
      display_name: getTierDisplayName(user.subscription_tier),
      is_active: ['active', 'trialing'].includes(user.subscription_status),
      expires_at: user.subscription_expires_at || null,
      message_limit: user.message_limit || 0,
      character_limit: user.character_limit || 0,
      messages_used: user.messages_used || 0,
      characters_created: user.custom_character_count || 0
    };
  }, [user, getTierDisplayName]);

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

export function useUser() {
  const context = useContext(UserContext);

  if (context === undefined) {
    console.error('❌ useUser() called outside UserProvider!');
    return {
      user: null,
      setUser: () => console.warn('⚠️ setUser called outside UserProvider'),
      loading: false,
      refreshing: false,
      refreshSubscription: async () => null,
      hasSubscription: () => false,
      getSubscriptionInfo: () => ({
        tier: 'free', status: 'none', display_name: 'Free', is_active: false, expires_at: null
      })
    };
  }

  return context;
}