// src/components/Billing/BillingDashboard.jsx - UPDATED
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../contexts/UserContext';
import api from '../../api';
import { 
  CreditCard, Calendar, TrendingUp, Download, 
  AlertCircle, CheckCircle, XCircle, 
  RefreshCw, Receipt, Shield, Zap,
  ChevronRight, Eye, DollarSign, Clock,
  Crown, Sparkles, ArrowUpRight
} from 'lucide-react';

// Custom hook from your provided useBilling.js
import useBilling from '../../hooks/useBilling';
import PaymentRouter from '../../services/PaymentRouter'; // <-- ADD THIS
import './BillingDashboard.css';

const BillingDashboard = () => {
  const { user } = useUser();
  const billing = useBilling();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [upgradeOptions, setUpgradeOptions] = useState([]);
  
  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelFeedback, setCancelFeedback] = useState('');
  const [cancelImmediate, setCancelImmediate] = useState(false);
  
  // Load all billing data
  const loadBillingData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load subscription details
      const detailsResult = await billing.fetchBillingDetails();
      if (detailsResult.success) {
        setSubscription(detailsResult.subscription);
        setUpgradeOptions(detailsResult.upgrade_options || []);
      } else {
        throw new Error(detailsResult.error || 'Failed to load subscription details');
      }
      
      // Load transaction history
      const historyResult = await billing.fetchBillingHistory({ limit: 20 });
      if (historyResult.success) {
        setTransactions(historyResult.history || []);
      } else {
        console.warn('Failed to load transaction history:', historyResult.error);
        // Continue without transaction history
      }
      
    } catch (err) {
      console.error('Error loading billing data:', err);
      setError(err.message || 'Failed to load billing information');
      
      // Set fallback data
      setSubscription({
        tier_name: 'free',
        tier_display: 'Free',
        status: 'active',
        messages_used: 0,
        message_limit: 150,
        unlimited: false,
        can_send_message: true,
        billing_cycle_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      
    } finally {
      setLoading(false);
    }
  }, [user, billing]);

  // Initial load
  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  // ============================================================================
  // PAYMENT HANDLERS USING PAYMENTROUTER
  // ============================================================================

  const handleUpgradeWithStripe = async (tierName) => {
    try {
      await PaymentRouter.redirectToCheckout({
        tier: tierName,
        provider: 'stripe',
        triggerSource: 'billing_dashboard_upgrade'
      });
    } catch (error) {
      console.error('Stripe payment redirect failed:', error);
      alert('Unable to redirect to Stripe payment page. Please try again or contact support.');
    }
  };

  const handleUpgradeWithPayPal = async (tierName) => {
    try {
      await PaymentRouter.redirectToCheckout({
        tier: tierName,
        provider: 'paypal',
        triggerSource: 'billing_dashboard_upgrade'
      });
    } catch (error) {
      console.error('PayPal payment redirect failed:', error);
      alert('Unable to redirect to PayPal payment page. Please try again or contact support.');
    }
  };

  // Other handlers remain the same
  const handleUpdatePayment = async () => {
    try {
      const result = await billing.getPaymentUpdateUrl();
      if (result.success && result.update_url) {
        window.location.href = result.update_url;
      } else {
        throw new Error(result.error || 'Failed to get payment update URL');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleViewReceipt = (transactionId) => {
    billing.openReceipt(transactionId);
  };

  const handleCancelSubscription = async () => {
    if (!cancelReason) {
      alert('Please select a cancellation reason');
      return;
    }
    
    try {
      setCancelling(true);
      const result = await billing.cancelSubscription({
        reason: cancelReason,
        feedback: cancelFeedback,
        immediate: cancelImmediate
      });
      
      if (result.success) {
        alert(`Subscription cancelled successfully. You have access until: ${result.access_until || 'end of billing cycle'}`);
        setShowCancelModal(false);
        loadBillingData(); // Refresh data
      } else {
        throw new Error(result.error || 'Cancellation failed');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  // Get tier icon
  const getTierIcon = (tierName) => {
    switch (tierName) {
      case 'free': return '🆓';
      case 'starter': return '🚀';
      case 'pro': return '⭐';
      case 'unlimited': return '💎';
      default: return '💳';
    }
  };

  // Get tier color
  const getTierColor = (tierName) => {
    switch (tierName) {
      case 'free': return '#94A3B8';
      case 'starter': return '#3B82F6';
      case 'pro': return '#8B5CF6';
      case 'unlimited': return '#10B981';
      default: return '#6366F1';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="billing-dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <p>Loading your billing information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !subscription) {
    return (
      <div className="billing-dashboard">
        <div className="dashboard-error">
          <AlertCircle size={48} />
          <h2>Unable to Load Billing</h2>
          <p>{error}</p>
          <button onClick={loadBillingData} className="retry-button">
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Get current tier info
  const currentTier = subscription?.tier_name || 'free';
  const tierDisplay = subscription?.tier_display || 'Free';
  const isActive = subscription?.status === 'active';
  const isUnlimited = subscription?.unlimited === true;

  return (
    <div className="billing-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Billing Dashboard</h1>
          <p>Manage your subscription, payment methods, and view transaction history</p>
        </div>
        <div className="header-actions">
          <button onClick={loadBillingData} className="refresh-button">
            <RefreshCw size={16} />
            Refresh Data
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Left Column */}
        <main className="main-content">
          {/* Current Subscription */}
          <section className="dashboard-card">
            <div className="card-header">
              <h2>Current Subscription</h2>
              <span 
                className="tier-badge" 
                style={{ 
                  background: `linear-gradient(135deg, ${getTierColor(currentTier)}, ${getTierColor(currentTier)}80)`,
                  color: 'white'
                }}
              >
                {tierDisplay.toUpperCase()}
              </span>
            </div>
            
            <div className="subscription-tier">
              <div 
                className="tier-icon"
                style={{ 
                  background: `linear-gradient(135deg, ${getTierColor(currentTier)}, ${getTierColor(currentTier)}80)`,
                  color: 'white'
                }}
              >
                {getTierIcon(currentTier)}
              </div>
              <div className="tier-details">
                <div className="tier-name">
                  {tierDisplay} Plan
                  {isActive && (
                    <span className="status-badge active">
                      <CheckCircle size={12} />
                      Active
                    </span>
                  )}
                </div>
                <div className="tier-description">
                  {currentTier === 'free' && 'Try AwakeVerse with basic access'}
                  {currentTier === 'starter' && 'Basic chat access with rate limits'}
                  {currentTier === 'pro' && 'Create characters and earn revenue'}
                  {currentTier === 'unlimited' && 'Advanced tools for professional creators'}
                </div>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="usage-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <DollarSign size={20} />
                </div>
                <div className="stat-value">
                  {currentTier === 'free' ? '£0' :
                   currentTier === 'starter' ? '£3.99' :
                   currentTier === 'pro' ? '£6.99' : '£11.99'}
                </div>
                <div className="stat-label">Monthly Price</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <TrendingUp size={20} />
                </div>
                <div className="stat-value">
                  {subscription?.messages_used?.toLocaleString() || '0'}
                </div>
                <div className="stat-label">Messages Used</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <Eye size={20} />
                </div>
                <div className="stat-value">
                  {isUnlimited ? 'Unlimited' : 
                   subscription?.message_limit?.toLocaleString() || '150'}
                </div>
                <div className="stat-label">Message Limit</div>
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section className="dashboard-card">
            <div className="card-header">
              <h2>Payment Method</h2>
              <button 
                onClick={handleUpdatePayment}
                className="action-button secondary"
              >
                <CreditCard size={16} />
                Update
              </button>
            </div>
            
            <div className="payment-method">
              <div className="payment-icon">
                <Shield size={24} />
              </div>
              <div className="payment-details">
                <div className="payment-type">PayPal</div>
                <div className="payment-description">
                  Connected via PayPal Billing Agreement
                  <div className="payment-status">
                    <CheckCircle size={14} />
                    Primary payment method
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Available Plans (Upgrade Options) */}
          {upgradeOptions.length > 0 && (
            <section className="dashboard-card">
              <div className="card-header">
                <h2>Available Plans</h2>
                <span className="section-subtitle">Upgrade for more features</span>
              </div>
              
              <div className="upgrade-grid">
                {upgradeOptions.map((plan) => (
                  <div 
                    key={plan.tier_name} 
                    className={`upgrade-card ${plan.popular ? 'popular' : ''}`}
                  >
                    {plan.popular && (
                      <div className="popular-badge">Most Popular</div>
                    )}
                    
                    <h3 className="upgrade-name">
                      {plan.tier_display} 
                      {plan.tier_name === 'pro' && <Crown size={18} style={{ marginLeft: '8px' }} />}
                      {plan.tier_name === 'unlimited' && <Sparkles size={18} style={{ marginLeft: '8px' }} />}
                    </h3>
                    <div className="upgrade-tagline">{plan.tagline}</div>
                    
                    <div className="upgrade-price">
                      £{plan.price_gbp?.toFixed(2) || '0.00'}
                      <span className="upgrade-period">/month</span>
                    </div>
                    
                    <ul className="upgrade-features">
                      {plan.features?.slice(0, 5).map((feature, idx) => (
                        <li key={idx}>
                          <CheckCircle size={14} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    {/* Payment Options */}
                    <div className="payment-options">
                      <button
                        onClick={() => handleUpgradeWithStripe(plan.tier_name)}
                        className="upgrade-button"
                      >
                        <CreditCard size={16} />
                        Pay with Stripe
                      </button>
                      
                      <button
                        onClick={() => handleUpgradeWithPayPal(plan.tier_name)}
                        className="upgrade-button secondary"
                      >
                        <Shield size={16} />
                        Pay with PayPal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Transaction History */}
          <section className="dashboard-card">
            <div className="card-header">
              <h2>Transaction History</h2>
              <span className="section-subtitle">Last {transactions.length} transactions</span>
            </div>
            
            {transactions.length === 0 ? (
              <div className="empty-state">
                <Receipt size={48} />
                <p>No transactions found</p>
                <p className="empty-subtitle">
                  Your transaction history will appear here once you make a payment
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="transaction-table-container">
                  <table className="transaction-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Transaction ID</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Method</th>
                        <th>Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((txn) => (
                        <tr key={txn.id || txn.transaction_id}>
                          <td>
                            {new Date(txn.transaction_date || txn.created_at).toLocaleDateString()}
                          </td>
                          <td className="transaction-id">
                            {txn.transaction_id}
                          </td>
                          <td className="amount">
                            {txn.currency} {txn.amount}
                          </td>
                          <td>
                            <span className={`status-badge ${txn.status}`}>
                              {txn.status === 'completed' && <CheckCircle size={12} />}
                              {txn.status === 'failed' && <XCircle size={12} />}
                              {txn.status}
                            </span>
                          </td>
                          <td>
                            <span className="payment-provider">
                              {txn.payment_provider?.toUpperCase() || 'Unknown'}
                            </span>
                          </td>
                          <td>
                            {txn.is_successful && (
                              <button
                                onClick={() => handleViewReceipt(txn.transaction_id)}
                                className="receipt-button"
                              >
                                <Eye size={14} />
                                View
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile Card View (hidden on desktop) */}
                <div className="transaction-cards">
                  {transactions.map((txn) => (
                    <div key={txn.id || txn.transaction_id} className="transaction-card">
                      <div className="card-header-row">
                        <span className="date">
                          {new Date(txn.transaction_date || txn.created_at).toLocaleDateString()}
                        </span>
                        <span className={`status-badge ${txn.status}`}>
                          {txn.status}
                        </span>
                      </div>
                      <div className="card-details">
                        <div className="detail-row">
                          <span className="label">ID:</span>
                          <span className="value">{txn.transaction_id}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Amount:</span>
                          <span className="value">{txn.currency} {txn.amount}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Method:</span>
                          <span className="value">{txn.payment_provider}</span>
                        </div>
                      </div>
                      {txn.is_successful && (
                        <button
                          onClick={() => handleViewReceipt(txn.transaction_id)}
                          className="receipt-button mobile"
                        >
                          <Download size={14} />
                          View Receipt
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </main>

        {/* Right Sidebar */}
        <aside className="sidebar-content">
          {/* Quick Actions */}
          <section className="dashboard-card">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              {upgradeOptions.length > 0 ? (
                <>
                  <button 
                    className="action-button primary"
                    onClick={() => handleUpgradeWithStripe(upgradeOptions[0].tier_name)}
                  >
                    <ArrowUpRight size={16} />
                    Upgrade Plan
                  </button>
                  
                  <button 
                    className="action-button secondary"
                    onClick={handleUpdatePayment}
                  >
                    <CreditCard size={16} />
                    Update Payment
                  </button>
                </>
              ) : (
                <button 
                  className="action-button primary"
                  onClick={() => window.location.href = '/pricing'}
                >
                  <Crown size={16} />
                  View All Plans
                </button>
              )}
              
              <button 
                className="action-button secondary"
                onClick={() => billing.fetchBillingHistory({ limit: 100 })}
              >
                <Receipt size={16} />
                View All Transactions
              </button>
              
              <button 
                className="action-button danger"
                onClick={() => setShowCancelModal(true)}
                disabled={!isActive || currentTier === 'free'}
              >
                <XCircle size={16} />
                Cancel Subscription
              </button>
            </div>
          </section>

          {/* Billing Cycle */}
          <section className="dashboard-card">
            <h3>Billing Cycle</h3>
            <div className="cycle-info">
              <div className="cycle-dates">
                <div className="cycle-date">
                  <div className="cycle-label">Current Cycle</div>
                  <div className="cycle-value">
                    {new Date().toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
                <div className="cycle-arrow">→</div>
                <div className="cycle-date">
                  <div className="cycle-label">Renews On</div>
                  <div className="cycle-value">
                    {subscription?.billing_cycle_end ? 
                      new Date(subscription.billing_cycle_end).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      }) :
                      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })
                    }
                  </div>
                </div>
              </div>
              <div className="cycle-remaining">
                <Clock size={16} />
                <span>
                  {subscription?.billing_cycle_end ? 
                    Math.max(0, Math.ceil((new Date(subscription.billing_cycle_end) - new Date()) / (1000 * 60 * 60 * 24))) :
                    30
                  } days remaining
                </span>
              </div>
            </div>
          </section>

          {/* Payment Summary */}
          <section className="dashboard-card">
            <h3>Payment Summary</h3>
            <div className="payment-summary">
              <div className="summary-row">
                <span>Monthly Plan</span>
                <span>
                  {currentTier === 'free' ? '£0.00' :
                   currentTier === 'starter' ? '£3.99' :
                   currentTier === 'pro' ? '£6.99' : '£11.99'}
                </span>
              </div>
              <div className="summary-row">
                <span>Tax (20% VAT)</span>
                <span>
                  {currentTier === 'free' ? '£0.00' :
                   currentTier === 'starter' ? '£0.80' :
                   currentTier === 'pro' ? '£1.40' : '£2.40'}
                </span>
              </div>
              <div className="summary-divider" />
              <div className="summary-row total">
                <span>Total Due</span>
                <span>
                  {currentTier === 'free' ? '£0.00' :
                   currentTier === 'starter' ? '£4.79' :
                   currentTier === 'pro' ? '£8.39' : '£14.39'}
                </span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setShowCancelModal(false)}
            >
              ×
            </button>
            
            <div className="modal-header">
              <h2>Cancel Subscription</h2>
              <p>
                We're sorry to see you go. Your subscription will remain active until 
                {cancelImmediate ? ' today.' : ' the end of your billing cycle.'}
              </p>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="cancelReason">Reason for cancellation</label>
                <select
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="form-select"
                >
                  <option value="">Select a reason...</option>
                  <option value="too_expensive">Too expensive</option>
                  <option value="not_using">Not using enough</option>
                  <option value="missing_features">Missing features</option>
                  <option value="switching_service">Switching to another service</option>
                  <option value="technical_issues">Technical issues</option>
                  <option value="other">Other reason</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="cancelFeedback">
                  Optional feedback (what could we improve?)
                </label>
                <textarea
                  id="cancelFeedback"
                  value={cancelFeedback}
                  onChange={(e) => setCancelFeedback(e.target.value)}
                  rows="3"
                  placeholder="Your feedback helps us improve..."
                  className="form-textarea"
                />
              </div>
              
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="cancelImmediate"
                  checked={cancelImmediate}
                  onChange={(e) => setCancelImmediate(e.target.checked)}
                  className="form-checkbox"
                />
                <label htmlFor="cancelImmediate">
                  Cancel immediately instead of at the end of billing cycle
                </label>
              </div>
            </div>
            
            <div className="modal-actions">
              <button
                className="action-button secondary"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Cancel
              </button>
              <button
                className="action-button danger"
                onClick={handleCancelSubscription}
                disabled={cancelling || !cancelReason}
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingDashboard;