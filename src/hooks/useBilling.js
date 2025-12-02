// hooks/useBilling.js
// Custom React hook for billing & subscription management
// Integrates with AwakeVerse backend billing API

import { useState, useCallback, useEffect } from 'react';

// API base URL configuration (matches useStoryApi.js pattern)
const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

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
        }
      }

      const response = await fetch(endpoint, { ...defaultOptions, ...options });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
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
        setBillingHistory(data.history || []);
        return {
          success: true,
          history: data.history || [],
          count: data.count || 0,
        };
      } else {
        throw new Error(data.error || 'Failed to fetch billing history');
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch billing history';
      setError(errorMsg);
      console.error('fetchBillingHistory error:', err);
      
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
    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest(`${API_BASE}/api/billing/details`);
      
      if (data.success) {
        setSubscriptionDetails(data.subscription);
        return {
          success: true,
          subscription: data.subscription,
          upgrade_options: data.upgrade_options || [],
          has_upgrades: data.has_upgrades || false,
        };
      } else {
        throw new Error(data.error || 'Failed to fetch billing details');
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch billing details';
      setError(errorMsg);
      console.error('fetchBillingDetails error:', err);
      
      // DEFENSIVE: Return fallback subscription data
      const fallbackSubscription = {
        tier_name: 'free',
        tier_display: 'Free',
        status: 'active',
        messages_used: 0,
        message_limit: 150,
        unlimited: false,
        can_send_message: true,
      };
      
      setSubscriptionDetails(fallbackSubscription);
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
      
      if (data.success) {
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
        throw new Error(data.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to cancel subscription';
      setError(errorMsg);
      console.error('cancelSubscription error:', err);
      
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
    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest(`${API_BASE}/api/billing/update-payment`);
      
      if (data.success) {
        return {
          success: true,
          update_url: data.update_url,
          provider: data.provider,
          external_update: data.external_update,
          message: data.message,
        };
      } else {
        throw new Error(data.error || 'Failed to get payment update URL');
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to get payment update URL';
      setError(errorMsg);
      console.error('getPaymentUpdateUrl error:', err);
      
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
    return `${API_BASE}/api/billing/receipts/${transactionId}`;
  }, []);

  // ============================================================================
  // 6. OPEN RECEIPT IN NEW WINDOW
  // ============================================================================
  
  const openReceipt = useCallback((transactionId) => {
    const url = getReceiptUrl(transactionId);
    window.open(url, '_blank', 'width=800,height=600');
  }, [getReceiptUrl]);

  // ============================================================================
  // INITIALIZATION: Load billing details on mount
  // ============================================================================
  
  useEffect(() => {
    // Auto-fetch billing details when hook is used
    // Comment this out if you want manual control
    // fetchBillingDetails();
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
    
    // Utility
    clearError: () => setError(null),
  };
};

export default useBilling;


// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Billing Dashboard Component
 * 
 * import useBilling from './hooks/useBilling';
 * 
 * function BillingDashboard() {
 *   const { 
 *     loading, 
 *     error, 
 *     subscriptionDetails, 
 *     fetchBillingDetails 
 *   } = useBilling();
 * 
 *   useEffect(() => {
 *     fetchBillingDetails();
 *   }, [fetchBillingDetails]);
 * 
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 * 
 *   return (
 *     <div>
 *       <h2>Current Plan: {subscriptionDetails?.tier_display}</h2>
 *       <p>Status: {subscriptionDetails?.status}</p>
 *     </div>
 *   );
 * }
 */

/**
 * Example 2: Transaction History Component
 * 
 * import useBilling from './hooks/useBilling';
 * 
 * function TransactionHistory() {
 *   const { 
 *     loading, 
 *     billingHistory, 
 *     fetchBillingHistory,
 *     openReceipt 
 *   } = useBilling();
 * 
 *   useEffect(() => {
 *     fetchBillingHistory({ limit: 20 });
 *   }, [fetchBillingHistory]);
 * 
 *   return (
 *     <div>
 *       {billingHistory.map(txn => (
 *         <div key={txn.id}>
 *           <span>{txn.transaction_id}</span>
 *           <span>{txn.amount} {txn.currency}</span>
 *           <button onClick={() => openReceipt(txn.transaction_id)}>
 *             View Receipt
 *           </button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 */

/**
 * Example 3: Cancel Subscription Modal
 * 
 * import useBilling from './hooks/useBilling';
 * 
 * function CancelModal({ onClose }) {
 *   const { loading, cancelSubscription } = useBilling();
 *   const [reason, setReason] = useState('');
 *   const [feedback, setFeedback] = useState('');
 * 
 *   const handleCancel = async () => {
 *     const result = await cancelSubscription({ 
 *       reason, 
 *       feedback, 
 *       immediate: false 
 *     });
 *     
 *     if (result.success) {
 *       alert(`Cancelled! Access until: ${result.access_until}`);
 *       onClose();
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <select value={reason} onChange={(e) => setReason(e.target.value)}>
 *         <option value="too_expensive">Too Expensive</option>
 *         <option value="not_using">Not Using</option>
 *         <option value="other">Other</option>
 *       </select>
 *       <textarea 
 *         value={feedback} 
 *         onChange={(e) => setFeedback(e.target.value)}
 *         placeholder="Optional feedback"
 *       />
 *       <button onClick={handleCancel} disabled={loading}>
 *         {loading ? 'Cancelling...' : 'Confirm Cancel'}
 *       </button>
 *     </div>
 *   );
 * }
 */

/**
 * Example 4: Update Payment Button
 * 
 * import useBilling from './hooks/useBilling';
 * 
 * function UpdatePaymentButton() {
 *   const { loading, getPaymentUpdateUrl } = useBilling();
 * 
 *   const handleUpdate = async () => {
 *     const result = await getPaymentUpdateUrl();
 *     
 *     if (result.success) {
 *       // Redirect to PayPal/Stripe portal
 *       window.location.href = result.update_url;
 *     } else {
 *       alert(`Error: ${result.error}`);
 *     }
 *   };
 * 
 *   return (
 *     <button onClick={handleUpdate} disabled={loading}>
 *       {loading ? 'Loading...' : 'Update Payment Method'}
 *     </button>
 *   );
 * }
 */