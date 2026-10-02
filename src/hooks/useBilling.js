// hooks/useBilling.js - UPDATED with proper error handling & debugging
// Custom React hook for billing & subscription management

import { useState, useCallback, useEffect } from 'react';

// API base URL configuration (matches useStoryApi.js pattern)
const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

// Debug mode - can be enabled via URL or localStorage
const getDebugMode = () => {
  if (typeof window === 'undefined') return false;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('debug') || localStorage.getItem('billing_debug') === 'true';
};

const DEBUG_MODE = getDebugMode();

const debugLog = (label, data) => {
  if (DEBUG_MODE) {
    console.log(`🔍 [useBilling] ${label}:`, data);
  }
};

/**
 * Custom hook for billing operations
 * 
 * Features:
 * - Transaction history retrieval
 * - Subscription details & upgrade options
 * - Subscription cancellation
 * - Payment method updates
 * - Receipt generation
 * - Defensive error handling
 * - Loading states
 * - CSRF token management
 */
const useBilling = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);

  // ============================================================================
  // HELPER: Get CSRF Token from Cookie
  // ============================================================================
  
  const getCsrfToken = useCallback(() => {
    if (csrfToken) return csrfToken;
    
    // Get CSRF token from cookie
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'av_csrf') {
        const token = decodeURIComponent(value);
        setCsrfToken(token);
        return token;
      }
    }
    return null;
  }, [csrfToken]);

  // ============================================================================
  // HELPER: API Request with Error Handling
  // ============================================================================
  
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    debugLog('🌐 API Request', { endpoint, method: options.method });
    
    try {
      const defaultOptions = {
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      // Add CSRF token for unsafe methods
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase())) {
        const token = getCsrfToken();
        if (token) {
          defaultOptions.headers['X-CSRF-Token'] = token;
        } else {
          debugLog('⚠️ CSRF token missing for unsafe method', { method: options.method });
        }
      }

      const response = await fetch(endpoint, { ...defaultOptions, ...options });
      const data = await response.json();
      
      debugLog('📦 API Response', { 
        endpoint, 
        status: response.status,
        success: data.success,
        hasData: !!data 
      });

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (err) {
      debugLog('❌ API Error', { endpoint, error: err.message });
      throw err;
    }
  }, [getCsrfToken]);

  // ============================================================================
  // 1. GET BILLING HISTORY
  // ============================================================================
  
  const fetchBillingHistory = useCallback(async (options = {}) => {
    const {
      limit = 50,
      includeFailed = true,
      environment = null,
    } = options;

    debugLog('📜 Fetching billing history', { limit, includeFailed, environment });
    
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        include_failed: includeFailed.toString(),
      });
      
      if (environment) {
        params.append('environment', environment);
      }

      const data = await apiRequest(`${API_BASE}/api/billing/history?${params.toString()}`);
      
      if (data.success) {
        debugLog('✅ Billing history fetched', { count: data.history?.length || 0 });
        setBillingHistory(data.history || []);
        return {
          success: true,
          history: data.history || [],
          count: data.count || 0,
          user_id: data.user_id,
        };
      } else {
        debugLog('❌ Billing history failed', data.error);
        throw new Error(data.error || 'Failed to fetch billing history');
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch billing history';
      debugLog('🚨 Billing history error', errorMsg);
      setError(errorMsg);
      
      // DEFENSIVE: Return empty history on error
      setBillingHistory([]);
      return {
        success: false,
        error: errorMsg,
        history: [],
        count: 0,
        fallback_mode: true,
      };
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // ============================================================================
  // 2. GET BILLING DETAILS
  // ============================================================================
  
  const fetchBillingDetails = useCallback(async () => {
    debugLog('📋 Fetching billing details', {});
    
    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest(`${API_BASE}/api/billing/details`);
      
      debugLog('📋 Billing details response', { 
        success: data.success,
        hasSubscription: !!data.subscription,
        hasUpgrades: data.has_upgrades,
        subscription: data.subscription 
      });
      
      if (data.success) {
        // Handle both cases: with subscription data and without
        if (data.subscription) {
          setSubscriptionDetails(data.subscription);
          debugLog('✅ Billing details loaded', { 
            tier: data.subscription.tier_name,
            status: data.subscription.status 
          });
          
          return {
            success: true,
            subscription: data.subscription,
            upgrade_options: data.upgrade_options || [],
            has_upgrades: data.has_upgrades || false,
          };
        } else {
          // API succeeded but no subscription data (free tier user)
          const fallbackSubscription = {
            tier_name: 'free',
            tier_display: 'Free',
            status: 'active',
            messages_used: 0,
            message_limit: 150,
            unlimited: false,
            can_send_message: true,
            is_fallback: true,
          };
          
          setSubscriptionDetails(fallbackSubscription);
          debugLog('ℹ️ Using fallback subscription (free tier)', fallbackSubscription);
          
          return {
            success: true,
            subscription: fallbackSubscription,
            upgrade_options: data.upgrade_options || [],
            has_upgrades: data.has_upgrades || false,
            fallback_mode: true,
          };
        }
      } else {
        debugLog('❌ Billing details failed', data.error);
        throw new Error(data.error || 'Failed to fetch billing details');
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch billing details';
      debugLog('🚨 Billing details error', errorMsg);
      setError(errorMsg);
      
      // DEFENSIVE: Return fallback subscription data
      const fallbackSubscription = {
        tier_name: 'free',
        tier_display: 'Free',
        status: 'active',
        messages_used: 0,
        message_limit: 150,
        unlimited: false,
        can_send_message: true,
        is_fallback: true,
      };
      
      setSubscriptionDetails(fallbackSubscription);
      debugLog('🔄 Set fallback subscription due to error', fallbackSubscription);
      
      return {
        success: false,
        error: errorMsg,
        subscription: fallbackSubscription,
        upgrade_options: [],
        has_upgrades: false,
        fallback_mode: true,
      };
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // ============================================================================
  // 3. CANCEL SUBSCRIPTION
  // ============================================================================
  
  const cancelSubscription = useCallback(async (cancellationData = {}) => {
    const {
      reason = null,
      feedback = null,
      immediate = false,
    } = cancellationData;

    debugLog('🗑️ Cancelling subscription', { reason, immediate });
    
    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest(`${API_BASE}/api/billing/cancel`, {
        method: 'POST',
        body: JSON.stringify({
          reason,
          feedback,
          immediate,
        }),
      });
      
      debugLog('📊 Cancel subscription response', { 
        success: data.success,
        action: data.action,
        message: data.message 
      });
      
      if (data.success) {
        debugLog('✅ Subscription cancelled', {
          cancelled_tier: data.cancelled_tier,
          access_until: data.access_until
        });
        
        // Refresh subscription details after cancellation
        await fetchBillingDetails();
        
        return {
          success: true,
          action: data.action,
          message: data.message,
          cancelled_tier: data.cancelled_tier,
          cancelled_tier_display: data.cancelled_tier_display,
          access_until: data.access_until,
          immediate: data.immediate,
        };
      } else {
        debugLog('❌ Cancel subscription failed', data.error);
        throw new Error(data.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to cancel subscription';
      debugLog('🚨 Cancel subscription error', errorMsg);
      setError(errorMsg);
      
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  }, [apiRequest, fetchBillingDetails]);

  // ============================================================================
  // 4. GET PAYMENT UPDATE URL
  // ============================================================================
  
  const getPaymentUpdateUrl = useCallback(async () => {
    debugLog('💳 Getting payment update URL', {});
    
    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest(`${API_BASE}/api/billing/update-payment`);
      
      debugLog('🔗 Payment update URL response', { 
        success: data.success,
        hasUrl: !!data.update_url,
        provider: data.provider 
      });
      
      if (data.success) {
        return {
          success: true,
          update_url: data.update_url,
          provider: data.provider,
          external_update: data.external_update,
          message: data.message,
        };
      } else {
        debugLog('❌ Payment update URL failed', data.error);
        throw new Error(data.error || 'Failed to get payment update URL');
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to get payment update URL';
      debugLog('🚨 Payment update URL error', errorMsg);
      setError(errorMsg);
      
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // ============================================================================
  // 5. GET RECEIPT URL
  // ============================================================================
  
  const getReceiptUrl = useCallback((transactionId) => {
    // Returns URL for opening receipt in new tab/iframe
    const url = `${API_BASE}/api/billing/receipts/${transactionId}`;
    debugLog('🧾 Get receipt URL', { transactionId, url });
    return url;
  }, []);

  // ============================================================================
  // 6. OPEN RECEIPT IN NEW WINDOW
  // ============================================================================
  
  const openReceipt = useCallback((transactionId) => {
    debugLog('📄 Opening receipt', { transactionId });
    const url = getReceiptUrl(transactionId);
    window.open(url, '_blank', 'width=800,height=600');
  }, [getReceiptUrl]);

  // ============================================================================
  // 7. DEBUG UTILITIES
  // ============================================================================
  
  const runDiagnostics = useCallback(async () => {
    debugLog('🩺 Running diagnostics', {});
    
    const results = {
      timestamp: new Date().toISOString(),
      checks: [],
      errors: []
    };
    
    const addCheck = (label, success, details = {}) => {
      results.checks.push({ label, success, details });
    };
    
    try {
      // Check API health
      try {
        const healthRes = await fetch(`${API_BASE}/api/billing/health`, { credentials: 'include' });
        const healthData = await healthRes.json();
        addCheck('API Health', healthRes.ok, { status: healthData.status });
      } catch (e) {
        addCheck('API Health', false, { error: e.message });
      }
      
      // Check billing details
      try {
        const detailsResult = await fetchBillingDetails();
        addCheck('Billing Details', detailsResult.success, { 
          hasSubscription: !!detailsResult.subscription,
          tier: detailsResult.subscription?.tier_name 
        });
      } catch (e) {
        addCheck('Billing Details', false, { error: e.message });
      }
      
      // Check CSRF token
      const csrf = getCsrfToken();
      addCheck('CSRF Token', !!csrf, { hasToken: !!csrf });
      
      // Store results for debugging
      window._billingDiagnostics = results;
      
      return results;
    } catch (error) {
      debugLog('🚨 Diagnostics failed', error);
      return results;
    }
  }, [fetchBillingDetails, getCsrfToken]);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  useEffect(() => {
    if (DEBUG_MODE) {
      debugLog('🔧 useBilling hook initialized', { 
        apiBase: API_BASE,
        debugMode: true 
      });
      
      // Store hook instance for debugging
      window._useBillingHook = {
        version: '2.0',
        debug: true,
        endpoints: {
          health: `${API_BASE}/api/billing/health`,
          details: `${API_BASE}/api/billing/details`,
          history: `${API_BASE}/api/billing/history`,
          cancel: `${API_BASE}/api/billing/cancel`,
          update: `${API_BASE}/api/billing/update-payment`
        }
      };
    }
  }, []);

  // ============================================================================
  // RETURN HOOK API
  // ============================================================================
  
  return {
    // State
    loading,
    error,
    billingHistory,
    subscriptionDetails,
    
    // Methods
    fetchBillingHistory,
    fetchBillingDetails,
    cancelSubscription,
    getPaymentUpdateUrl,
    getReceiptUrl,
    openReceipt,
    
    // Debug Utilities
    runDiagnostics,
    getDebugInfo: () => ({
      loading,
      error,
      hasSubscription: !!subscriptionDetails,
      subscription: subscriptionDetails,
      debugMode: DEBUG_MODE,
      csrfToken: getCsrfToken()
    }),
    
    // Utility
    clearError: () => setError(null),
  };
};

export default useBilling;

// ============================================================================
// DEBUGGING INSTRUCTIONS
// ============================================================================

/*
To enable debugging:
1. Add ?debug=true to URL
2. OR run in console: localStorage.setItem('billing_debug', 'true')
3. Check console for 🔍 [useBilling] logs

To run diagnostics:
1. Enable debug mode
2. In console: hook.runDiagnostics()
3. Results will be in window._billingDiagnostics

Common issues to check:
1. CSRF token missing for POST requests
2. API returning success but empty subscription data
3. CORS issues between www.awakeverse.com and api.awakeverse.com
*/