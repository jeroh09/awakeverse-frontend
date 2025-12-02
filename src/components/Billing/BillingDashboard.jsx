// src/components/Billing/BillingDashboard.jsx - PRODUCTION READY v1.1
// Complete billing & subscription management dashboard
// Includes: Provider selection, pagination, cancel flow, error handling, responsive design

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { 
  CreditCard, Calendar, TrendingUp, Download, 
  AlertCircle, CheckCircle, XCircle, 
  RefreshCw, Receipt, Shield, Zap,
  Clock, Crown, Sparkles, ArrowUpRight,
  ArrowLeft, X, ChevronDown, ExternalLink
} from 'lucide-react';

import useBilling from '../../hooks/useBilling';
import PaymentRouter from '../../services/PaymentRouter';
import './BillingDashboard.css';

// ============================================================================
// DEBUGGING UTILITIES (Production-safe)
// ============================================================================

const DEBUG_MODE = process.env.NODE_ENV === 'development';

const debugLog = (label, data) => {
  if (DEBUG_MODE) {
    console.log(`🔍 [BillingDashboard] ${label}:`, data);
  }
  // Always log errors to console.error for production debugging
  if (label.includes('ERROR') || label.includes('FAILED')) {
    console.error(`❌ [BillingDashboard] ${label}:`, data);
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const BillingDashboard = () => {
  debugLog('🎬 COMPONENT RENDERING START');
  
  const navigate = useNavigate();
  const { user } = useUser();
  const billing = useBilling();
  
  // Core state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [upgradeOptions, setUpgradeOptions] = useState([]);
  
  // Pagination state
  const [transactionLimit, setTransactionLimit] = useState(50);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Provider selection state
  const [selectedProvider, setSelectedProvider] = useState('stripe');
  
  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelFeedback, setCancelFeedback] = useState('');
  const [cancelImmediate, setCancelImmediate] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(null);
  
  // Update payment state
  const [updatingPayment, setUpdatingPayment] = useState(false);

  // ============================================================================
  // DATA LOADING
  // ============================================================================
  
  const loadBillingData = useCallback(async () => {
    debugLog('🔄 loadBillingData CALLED', { user: user?.id, loading });
    
    // DEFENSIVE: Prevent multiple simultaneous fetches
    if (loading && !DEBUG_MODE) {
      debugLog('⏸️ Already loading, skipping...', {});
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      debugLog('📡 Starting API requests', { user: user?.id });
      
      // Load subscription details and upgrade options
      const detailsResult = await billing.fetchBillingDetails();
      debugLog('📋 Subscription details result', { 
        success: detailsResult.success,
        hasSubscription: !!detailsResult.subscription,
        fallbackMode: detailsResult.fallback_mode 
      });
      
      if (detailsResult.success) {
        setSubscription(detailsResult.subscription);
        setUpgradeOptions(detailsResult.upgrade_options || []);
      } else if (!detailsResult.fallback_mode) {
        throw new Error(detailsResult.error || 'Failed to load subscription details');
      } else {
        // Fallback mode - show degraded UI
        setSubscription(detailsResult.subscription);
        debugLog('⚠️ Using fallback subscription data', detailsResult.subscription);
      }
      
      // Load transaction history
      const historyResult = await billing.fetchBillingHistory({ limit: transactionLimit });
      debugLog('📜 Transaction history result', { 
        success: historyResult.success,
        count: historyResult.count || 0,
        fallbackMode: historyResult.fallback_mode 
      });
      
      if (historyResult.success) {
        setTransactions(historyResult.history || []);
      } else {
        debugLog('⚠️ Failed to load transaction history', historyResult.error);
        // Continue without transaction history - non-critical
      }
      
      debugLog('✅ Data loading completed successfully', {
        subscriptionSet: !!subscription,
        transactionsCount: transactions.length,
        upgradeOptionsCount: upgradeOptions.length
      });
      
    } catch (err) {
      const errorMsg = err.message || 'Failed to load billing information';
      debugLog('❌ Error loading billing data', { error: errorMsg, stack: err.stack });
      setError(errorMsg);
      
      // Set minimal fallback data for UI
      const fallbackSubscription = {
        tier_name: 'free',
        tier_display: 'Free',
        status: 'active',
        messages_used: 0,
        message_limit: 150,
        unlimited: false,
        can_send_message: true,
        billing_cycle_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      debugLog('🔄 Setting fallback subscription', fallbackSubscription);
      setSubscription(fallbackSubscription);
      setTransactions([]);
      setUpgradeOptions([]);
      
    } finally {
      debugLog('🏁 Loading complete, setting loading to false');
      setLoading(false);
    }
  }, [user, billing, transactionLimit]); // Removed loading from dependencies

  // ============================================================================
  // USE EFFECT - INITIAL LOAD
  // ============================================================================
  
  useEffect(() => {
    debugLog('🚀 BillingDashboard MOUNTED - useEffect running', { 
      userId: user?.id,
      timestamp: new Date().toISOString() 
    });
    
    // Store debug info globally for troubleshooting
    window._billingDashboardDebug = {
      mountedAt: new Date().toISOString(),
      userId: user?.id,
      userEmail: user?.email,
      component: 'BillingDashboard',
      version: '1.1'
    };
    
    loadBillingData();
    
    // Cleanup function
    return () => {
      debugLog('🧹 BillingDashboard UNMOUNTING', {});
    };
  }, []); // Empty dependency array - run once on mount
  
  // ============================================================================
  // LOAD MORE TRANSACTIONS
  // ============================================================================
  
  const handleLoadMore = async () => {
    if (loadingMore || transactionLimit >= 200) return;
    
    try {
      setLoadingMore(true);
      debugLog('📥 Loading more transactions', { currentLimit: transactionLimit });
      
      const newLimit = Math.min(transactionLimit + 50, 200);
      const historyResult = await billing.fetchBillingHistory({ limit: newLimit });
      
      if (historyResult.success) {
        setTransactions(historyResult.history || []);
        setTransactionLimit(newLimit);
        debugLog('✅ Loaded more transactions', { newLimit, count: historyResult.history?.length });
      } else {
        debugLog('⚠️ Failed to load more transactions', historyResult.error);
      }
    } catch (err) {
      debugLog('❌ Error loading more transactions', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // ============================================================================
  // PAYMENT HANDLERS
  // ============================================================================

  const handleUpgrade = async (tierName) => {
    debugLog('⬆️ Upgrade initiated', { tier: tierName, provider: selectedProvider });
    
    try {
      await PaymentRouter.redirectToCheckout({
        tier: tierName,
        provider: selectedProvider,
        triggerSource: 'billing_dashboard_upgrade',
        metadata: {
          current_tier: subscription?.tier_name,
          upgrade_date: new Date().toISOString()
        }
      });
      debugLog('✅ Upgrade redirect successful', { tier: tierName });
    } catch (error) {
      debugLog('❌ Payment redirect failed', error);
      alert(`Unable to redirect to ${selectedProvider === 'stripe' ? 'Stripe' : 'PayPal'} payment page. Please try again or contact support.`);
    }
  };

  const handleUpdatePayment = async () => {
    if (updatingPayment) return;
    
    debugLog('💳 Update payment initiated', {});
    
    try {
      setUpdatingPayment(true);
      const result = await billing.getPaymentUpdateUrl();
      
      debugLog('💳 Update payment result', { 
        success: result.success,
        hasUrl: !!result.update_url,
        externalUpdate: result.external_update 
      });
      
      if (result.success) {
        if (result.external_update) {
          debugLog('🌐 Redirecting to external payment portal', { url: result.update_url });
          window.location.href = result.update_url;
        } else {
          debugLog('ℹ️ Internal payment update', { message: result.message });
          alert(result.message || 'Please use your payment provider\'s dashboard to update payment methods.');
        }
      } else {
        debugLog('❌ Update payment failed', result.error);
        alert(result.error || 'Unable to update payment method at this time.');
      }
    } catch (error) {
      debugLog('❌ Update payment error', error);
      alert('Unable to process payment update request. Please try again or contact support.');
    } finally {
      setUpdatingPayment(false);
    }
  };

  // ============================================================================
  // CANCEL SUBSCRIPTION HANDLERS
  // ============================================================================

  const handleOpenCancelModal = () => {
    debugLog('🗑️ Opening cancel modal', { subscriptionTier: subscription?.tier_name });
    setCancelReason('');
    setCancelFeedback('');
    setCancelImmediate(false);
    setCancelSuccess(null);
    setShowCancelModal(true);
  };

  const handleCloseCancelModal = () => {
    debugLog('❌ Closing cancel modal', {});
    setShowCancelModal(false);
    setCancelling(false);
    setCancelReason('');
    setCancelFeedback('');
    setCancelImmediate(false);
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason) {
      alert('Please select a reason for cancellation');
      return;
    }
    
    debugLog('✅ Confirm cancellation', { reason: cancelReason, immediate: cancelImmediate });
    
    try {
      setCancelling(true);
      
      const result = await billing.cancelSubscription({
        reason: cancelReason,
        feedback: cancelFeedback || null,
        immediate: cancelImmediate
      });
      
      debugLog('📊 Cancel subscription result', { 
        success: result.success,
        action: result.action,
        cancelledTier: result.cancelled_tier 
      });
      
      if (result.success) {
        setCancelSuccess(result);
        
        // Reload billing data after 2 seconds
        setTimeout(() => {
          debugLog('🔄 Reloading billing data after cancellation');
          handleCloseCancelModal();
          loadBillingData();
        }, 3000);
      } else {
        debugLog('❌ Cancel subscription failed', result.error);
        alert(result.error || 'Failed to cancel subscription. Please try again or contact support.');
        setCancelling(false);
      }
    } catch (error) {
      debugLog('❌ Cancel subscription error', error);
      alert('Unable to process cancellation request. Please try again or contact support.');
      setCancelling(false);
    }
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading) {
    debugLog('⏳ Rendering loading state', {});
    return (
      <div className="billing-container">
        <div className="billing-header">
          <button onClick={() => navigate(-1)} className="back-button">
            <ArrowLeft size={18} />
            Back
          </button>
        </div>
        <div className="billing-content">
          <div className="loading-state">
            <RefreshCw size={48} className="loading-spinner" />
            <p>Loading billing information...</p>
            <p className="loading-subtext">This may take a moment</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error && !subscription) {
    debugLog('🚨 Rendering error state', { error });
    return (
      <div className="billing-container">
        <div className="billing-header">
          <button onClick={() => navigate(-1)} className="back-button">
            <ArrowLeft size={18} />
            Back
          </button>
        </div>
        <div className="billing-content">
          <div className="error-state">
            <AlertCircle size={48} className="error-icon" />
            <h2>Unable to Load Billing Information</h2>
            <p>{error}</p>
            <button onClick={loadBillingData} className="btn btn-primary">
              <RefreshCw size={18} />
              Try Again
            </button>
            <p className="error-help">
              If this persists, please contact support@awakeverse.com
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  debugLog('🎨 Rendering main dashboard', {
    hasSubscription: !!subscription,
    isFree: subscription?.tier_name === 'free',
    transactionCount: transactions.length,
    upgradeOptionsCount: upgradeOptions.length
  });
  
  const isFree = subscription?.tier_name === 'free';
  const isActive = subscription?.status === 'active';
  const isCancelled = subscription?.status === 'cancelled';
  const hasUpgrades = upgradeOptions.length > 0;

  return (
    <div className="billing-container">
      {/* Header */}
      <div className="billing-header">
        <div className="header-content">
          <button onClick={() => navigate(-1)} className="back-button">
            <ArrowLeft size={18} />
            Back
          </button>
          <div className="header-title">
            <h1>Billing & Subscription</h1>
            <p>Manage your AwakeVerse subscription and payment history</p>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>Some information may be unavailable. </span>
          <button onClick={loadBillingData} className="error-retry">
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="billing-content">
        
        {/* Grid Layout */}
        <div className="billing-grid">
          
          {/* Current Subscription Card */}
          <div className="billing-card">
            <div className="card-header">
              <h2 className="card-title">
                <CreditCard size={24} />
                Current Plan
              </h2>
              <span className={`card-badge ${isCancelled ? 'cancelled' : 'active'}`}>
                {isCancelled ? 'Cancelled' : 'Active'}
              </span>
            </div>

            <div className="subscription-info">
              <div className="info-block">
                <div className="info-label">Your Plan</div>
                <div className="info-value large">
                  {subscription?.tier_display || 'Free'}
                </div>
                {!isFree && subscription?.price && (
                  <div className="info-subvalue">
                    £{subscription.price}/month
                  </div>
                )}
              </div>

              <div className="info-block">
                <div className="info-label">
                  {subscription?.unlimited ? 'Messages This Month' : 'Usage This Month'}
                </div>
                <div className="info-value">
                  {subscription?.messages_used || 0}
                  {!subscription?.unlimited && ` / ${subscription?.message_limit || 150}`}
                </div>
                {subscription?.unlimited && (
                  <div className="info-subvalue">Unlimited</div>
                )}
              </div>
            </div>

            {/* Usage Bar (only if not unlimited) */}
            {!subscription?.unlimited && subscription?.message_limit && (
              <div className="usage-bar">
                <div className="usage-label">
                  <span>Message Usage</span>
                  <strong>
                    {Math.round((subscription.messages_used / subscription.message_limit) * 100)}%
                  </strong>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${Math.min((subscription.messages_used / subscription.message_limit) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            )}

            {/* Next Billing Date */}
            {!isFree && subscription?.billing_cycle_end && (
              <div className="billing-info">
                <Calendar size={18} />
                <div>
                  <div className="billing-label">
                    {isCancelled ? 'Access Until' : 'Next Billing Date'}
                  </div>
                  <div className="billing-date">
                    {new Date(subscription.billing_cycle_end).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!isFree && isActive && (
              <div className="button-group">
                <button 
                  onClick={handleUpdatePayment}
                  className="btn btn-secondary"
                  disabled={updatingPayment}
                >
                  {updatingPayment ? (
                    <>
                      <RefreshCw size={18} className="spinning" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Update Payment
                    </>
                  )}
                </button>
                <button 
                  onClick={handleOpenCancelModal}
                  className="btn btn-danger"
                  disabled={cancelling}
                >
                  <XCircle size={18} />
                  Cancel Subscription
                </button>
              </div>
            )}

            {isCancelled && (
              <div className="cancelled-notice">
                <AlertCircle size={20} />
                <div>
                  <strong>Subscription Cancelled</strong>
                  <p>You'll have access until {new Date(subscription.billing_cycle_end).toLocaleDateString('en-GB')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Card */}
          {!isFree && subscription?.payment_provider && (
            <div className="billing-card">
              <div className="card-header">
                <h2 className="card-title">
                  <Shield size={24} />
                  Payment Method
                </h2>
              </div>

              <div className="info-block payment-provider">
                <div className="info-label">Provider</div>
                <div className="provider-display">
                  {subscription.payment_provider === 'stripe' ? (
                    <CreditCard size={24} className="provider-icon" />
                  ) : (
                    <div className="paypal-badge">PayPal</div>
                  )}
                  <span className="provider-name">
                    {subscription.payment_provider === 'stripe' ? 'Stripe' : 'PayPal'}
                  </span>
                </div>
              </div>

              {subscription.last_payment_date && (
                <div className="info-block">
                  <div className="info-label">Last Payment</div>
                  <div className="payment-detail">
                    {subscription.last_payment_amount && (
                      <div className="payment-amount">£{subscription.last_payment_amount}</div>
                    )}
                    <div className="info-subvalue">
                      {new Date(subscription.last_payment_date).toLocaleDateString('en-GB')} • Successful
                    </div>
                  </div>
                </div>
              )}

              <div className="button-group">
                <button 
                  onClick={handleUpdatePayment}
                  className="btn btn-secondary full-width"
                  disabled={updatingPayment}
                >
                  {updatingPayment ? 'Loading...' : 'Update Payment Method'}
                </button>
              </div>
            </div>
          )}

          {/* Upgrade Options (Full Width) */}
          {hasUpgrades && (
            <div className="billing-card full-width">
              <div className="card-header">
                <h2 className="card-title">
                  <TrendingUp size={24} />
                  {isFree ? 'Choose Your Plan' : 'Upgrade Your Plan'}
                </h2>
              </div>

              {/* Provider Selector */}
              <ProviderSelector 
                selectedProvider={selectedProvider}
                onSelectProvider={setSelectedProvider}
              />

              {/* Upgrade Cards */}
              <div className="upgrade-grid">
                {upgradeOptions.map(tier => (
                  <UpgradeCard 
                    key={tier.tier_name}
                    tier={tier}
                    onUpgrade={handleUpgrade}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Transaction History (Full Width) */}
          <div className="billing-card full-width">
            <div className="card-header">
              <h2 className="card-title">
                <Receipt size={24} />
                Transaction History
              </h2>
              {transactions.length > 0 && (
                <span className="transaction-count">
                  {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {transactions.length === 0 ? (
              <EmptyTransactions isFree={isFree} />
            ) : (
              <>
                <TransactionTable 
                  transactions={transactions}
                  onViewReceipt={billing.openReceipt}
                />
                
                {/* Load More Button */}
                {transactions.length >= transactionLimit && transactionLimit < 200 && (
                  <div className="load-more-section">
                    <button 
                      onClick={handleLoadMore}
                      className="btn btn-secondary"
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <RefreshCw size={18} className="spinning" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ChevronDown size={18} />
                          Load More Transactions
                        </>
                      )}
                    </button>
                    <p className="load-more-hint">
                      Showing {transactions.length} of up to 200 recent transactions
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <CancelModal
          subscription={subscription}
          cancelReason={cancelReason}
          setCancelReason={setCancelReason}
          cancelFeedback={cancelFeedback}
          setCancelFeedback={setCancelFeedback}
          cancelImmediate={cancelImmediate}
          setCancelImmediate={setCancelImmediate}
          cancelling={cancelling}
          cancelSuccess={cancelSuccess}
          onConfirm={handleConfirmCancel}
          onClose={handleCloseCancelModal}
        />
      )}
    </div>
  );
};

// ============================================================================
// PROVIDER SELECTOR COMPONENT
// ============================================================================

const ProviderSelector = ({ selectedProvider, onSelectProvider }) => (
  <div className="provider-selector">
    <div className="provider-selector-header">
      <Shield size={20} className="provider-icon" />
      <label>Select Payment Method</label>
    </div>
    <div className="provider-options">
      <button
        className={`provider-button ${selectedProvider === 'stripe' ? 'active' : ''}`}
        onClick={() => onSelectProvider('stripe')}
      >
        <CreditCard size={18} />
        <div className="provider-info">
          <span className="provider-name">Stripe</span>
          <span className="provider-desc">Credit/Debit Card</span>
        </div>
        {selectedProvider === 'stripe' && <CheckCircle size={18} className="check-icon" />}
      </button>
      
      <button
        className={`provider-button ${selectedProvider === 'paypal' ? 'active' : ''}`}
        onClick={() => onSelectProvider('paypal')}
      >
        <div className="paypal-icon">PP</div>
        <div className="provider-info">
          <span className="provider-name">PayPal</span>
          <span className="provider-desc">PayPal Account</span>
        </div>
        {selectedProvider === 'paypal' && <CheckCircle size={18} className="check-icon" />}
      </button>
    </div>
  </div>
);

// ============================================================================
// UPGRADE CARD COMPONENT
// ============================================================================

const UpgradeCard = ({ tier, onUpgrade }) => (
  <div className={`upgrade-card ${tier.recommended ? 'popular' : ''}`}>
    {tier.recommended && <div className="popular-badge">POPULAR</div>}
    
    <div className="tier-header">
      <div className="tier-icon">
        {tier.tier_name === 'unlimited' ? <Crown size={24} /> : <Sparkles size={24} />}
      </div>
      <div className="tier-name">{tier.tier_display}</div>
    </div>
    
    <div className="tier-price">
      <span className="price-amount">£{tier.price_gbp}</span>
      <span className="price-period">/month</span>
    </div>
    
    {tier.tagline && <div className="tier-tagline">{tier.tagline}</div>}
    
    <ul className="tier-features">
      {tier.features && tier.features.map((feature, index) => (
        <li key={index}>
          <CheckCircle size={16} />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    
    <button 
      onClick={() => onUpgrade(tier.tier_name)}
      className="btn btn-primary full-width"
    >
      Upgrade to {tier.tier_display}
      <ArrowUpRight size={18} />
    </button>
  </div>
);

// ============================================================================
// TRANSACTION TABLE COMPONENT
// ============================================================================

const TransactionTable = ({ transactions, onViewReceipt }) => (
  <>
    {/* Desktop Table */}
    <div className="transaction-table-container desktop-only">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Transaction ID</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Receipt</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(txn => (
            <tr key={txn.id}>
              <td>
                {new Date(txn.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </td>
              <td className="transaction-id">{txn.transaction_id}</td>
              <td>{txn.description || `${txn.tier_display} Subscription`}</td>
              <td className="amount">
                {txn.currency?.toUpperCase()} {txn.amount}
              </td>
              <td>
                <span className={`status-badge ${txn.status}`}>
                  {txn.status === 'completed' && <CheckCircle size={14} />}
                  {txn.status === 'failed' && <XCircle size={14} />}
                  {txn.status === 'pending' && <Clock size={14} />}
                  {txn.status}
                </span>
              </td>
              <td>
                <button 
                  onClick={() => onViewReceipt(txn.transaction_id)}
                  className="receipt-link"
                >
                  <Receipt size={16} />
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Mobile Cards */}
    <div className="transaction-cards mobile-only">
      {transactions.map(txn => (
        <div key={txn.id} className="transaction-card">
          <div className="transaction-card-header">
            <span className={`status-badge ${txn.status}`}>
              {txn.status === 'completed' && <CheckCircle size={14} />}
              {txn.status === 'failed' && <XCircle size={14} />}
              {txn.status === 'pending' && <Clock size={14} />}
              {txn.status}
            </span>
            <span className="transaction-date">
              {new Date(txn.created_at).toLocaleDateString('en-GB')}
            </span>
          </div>
          <div className="transaction-card-body">
            <div className="transaction-description">
              {txn.description || `${txn.tier_display} Subscription`}
            </div>
            <div className="transaction-amount">
              {txn.currency?.toUpperCase()} {txn.amount}
            </div>
          </div>
          <div className="transaction-card-footer">
            <span className="transaction-id-mobile">{txn.transaction_id}</span>
            <button 
              onClick={() => onViewReceipt(txn.transaction_id)}
              className="receipt-link"
            >
              <Receipt size={16} />
              Receipt
            </button>
          </div>
        </div>
      ))}
    </div>
  </>
);

// ============================================================================
// EMPTY TRANSACTIONS COMPONENT
// ============================================================================

const EmptyTransactions = ({ isFree }) => (
  <div className="empty-state">
    <Receipt size={64} className="empty-icon" />
    <h3>No Transactions Yet</h3>
    <p>
      {isFree 
        ? 'Upgrade to a paid plan to see your transaction history here.'
        : 'Your payment history will appear here once you make a transaction.'
      }
    </p>
  </div>
);

// ============================================================================
// CANCEL MODAL COMPONENT
// ============================================================================

const CancelModal = ({ 
  subscription,
  cancelReason, 
  setCancelReason,
  cancelFeedback,
  setCancelFeedback,
  cancelImmediate,
  setCancelImmediate,
  cancelling,
  cancelSuccess,
  onConfirm,
  onClose
}) => {
  if (cancelSuccess) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content success-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-icon success">
            <CheckCircle size={48} />
          </div>
          <h2>Subscription Cancelled</h2>
          <p className="success-message">
            Your {cancelSuccess.cancelled_tier_display} subscription has been cancelled successfully.
          </p>
          {cancelSuccess.access_until && (
            <p className="access-info">
              You'll continue to have access until{' '}
              <strong>
                {new Date(cancelSuccess.access_until).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </strong>
            </p>
          )}
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content cancel-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Cancel Subscription</h2>
          <button onClick={onClose} className="modal-close" disabled={cancelling}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <p className="cancel-warning">
            We're sorry to see you go. Before you cancel your{' '}
            <strong>{subscription?.tier_display}</strong> subscription, please let us know why.
          </p>

          {/* Reason Selection */}
          <div className="form-group">
            <label htmlFor="cancel-reason">Reason for cancellation *</label>
            <select 
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              disabled={cancelling}
              required
            >
              <option value="">Select a reason...</option>
              <option value="too_expensive">Too expensive</option>
              <option value="not_using">Not using enough</option>
              <option value="missing_features">Missing features</option>
              <option value="technical_issues">Technical issues</option>
              <option value="switching_service">Switching to another service</option>
              <option value="temporary_break">Taking a temporary break</option>
              <option value="other">Other reason</option>
            </select>
          </div>

          {/* Feedback Textarea */}
          <div className="form-group">
            <label htmlFor="cancel-feedback">
              Additional feedback (optional)
            </label>
            <textarea
              id="cancel-feedback"
              value={cancelFeedback}
              onChange={(e) => setCancelFeedback(e.target.value)}
              placeholder="Help us improve by sharing more details..."
              rows={4}
              disabled={cancelling}
            />
          </div>

          {/* Immediate Cancellation Checkbox */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={cancelImmediate}
                onChange={(e) => setCancelImmediate(e.target.checked)}
                disabled={cancelling}
              />
              <span>Cancel immediately (otherwise at end of billing cycle)</span>
            </label>
          </div>

          {!cancelImmediate && subscription?.billing_cycle_end && (
            <div className="cancel-info">
              <AlertCircle size={18} />
              <p>
                You'll retain access until{' '}
                <strong>
                  {new Date(subscription.billing_cycle_end).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </strong>
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            onClick={onClose} 
            className="btn btn-secondary"
            disabled={cancelling}
          >
            Keep Subscription
          </button>
          <button 
            onClick={onConfirm}
            className="btn btn-danger"
            disabled={cancelling || !cancelReason}
          >
            {cancelling ? (
              <>
                <RefreshCw size={18} className="spinning" />
                Cancelling...
              </>
            ) : (
              <>
                <XCircle size={18} />
                Confirm Cancellation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingDashboard;