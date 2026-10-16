// src/hooks/useMarketHubAuth.js - DEFENSIVE AUTH HOOK FOR MARKET HUB
// ✅ STEP 2: Extra safety layer for Market Hub components
// Prevents crashes from undefined user or context issues

import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Defensive hook for Market Hub components
 * 
 * Provides guaranteed non-undefined values for:
 * - user (null if not logged in, never undefined)
 * - isAuthenticated (boolean, never undefined)
 * - loading (boolean, never undefined)
 * 
 * Usage:
 *   const { user, isAuthenticated, loading } = useMarketHubAuth();
 * 
 * Safe patterns:
 *   ✅ if (!user) { ... }           // Safe - user is null or object
 *   ✅ if (isAuthenticated) { ... } // Safe - always boolean
 *   ✅ user?.id                     // Safe - optional chaining works
 *   ❌ user.id                      // Avoid - throws if user is null
 */
export function useMarketHubAuth() {
  // ✅ Get context with defensive fallbacks
  let userContext;
  let authContext;
  
  try {
    userContext = useUser();
  } catch (error) {
    console.error('❌ useUser() failed in Market Hub:', error);
    userContext = {
      user: null,
      loading: false,
      refreshing: false
    };
  }
  
  try {
    authContext = useAuth();
  } catch (error) {
    console.error('❌ useAuth() failed in Market Hub:', error);
    authContext = {
      isAuthenticated: false,
      authChecked: true
    };
  }
  
  // ✅ DEFENSIVE: Ensure we always have valid values
  const user = userContext?.user ?? null;
  const loading = userContext?.loading ?? false;
  const refreshing = userContext?.refreshing ?? false;
  const isAuthenticated = authContext?.isAuthenticated ?? !!user;
  const authChecked = authContext?.authChecked ?? true;
  
  // ✅ DEFENSIVE: Log if we're returning fallback values
  if (!userContext || !authContext) {
    console.warn('⚠️ Market Hub auth using fallback values:', {
      hasUserContext: !!userContext,
      hasAuthContext: !!authContext,
      user: user ? 'present' : 'null',
      isAuthenticated
    });
  }
  
  return {
    // Core values (guaranteed non-undefined)
    user,                    // null or user object
    isAuthenticated,         // boolean
    loading,                 // boolean
    refreshing,              // boolean
    authChecked,            // boolean
    
    // Helper methods (with safe fallbacks)
    hasSubscription: userContext?.hasSubscription ?? (() => false),
    getSubscriptionInfo: userContext?.getSubscriptionInfo ?? (() => ({
      tier: 'free',
      status: 'none',
      display_name: 'Free',
      is_active: false,
      expires_at: null
    })),
    refreshSubscription: userContext?.refreshSubscription ?? (async () => null),
    
    // Convenience computed values
    isReady: authChecked && !loading,    // Safe to render UI
    userId: user?.id ?? null,            // Quick access to user ID
    username: user?.username ?? null,    // Quick access to username
    displayName: user?.display_name ?? user?.username ?? 'User'
  };
}

/**
 * Hook variant specifically for components that REQUIRE authentication
 * Throws helpful error if user is not authenticated
 * 
 * Usage in protected Market Hub features:
 *   const { user, userId } = useMarketHubAuthRequired();
 */
export function useMarketHubAuthRequired() {
  const auth = useMarketHubAuth();
  
  if (!auth.isAuthenticated || !auth.user) {
    throw new Error(
      'useMarketHubAuthRequired: Component requires authentication but user is not logged in. ' +
      'This component should be wrapped in a ProtectedRoute or conditionally rendered.'
    );
  }
  
  return {
    ...auth,
    user: auth.user,      // TypeScript hint: user is definitely not null here
    userId: auth.user.id  // Safe access
  };
}

/**
 * Higher-order component that provides defensive auth to any component
 * 
 * Usage:
 *   export default withMarketHubAuth(MyComponent);
 * 
 * Component receives props:
 *   - user
 *   - isAuthenticated
 *   - loading
 *   - ... all other auth values
 */
export function withMarketHubAuth(Component) {
  return function MarketHubAuthWrapper(props) {
    const auth = useMarketHubAuth();
    
    return <Component {...props} {...auth} />;
  };
}

export default useMarketHubAuth;