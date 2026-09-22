// src/components/StripeSuccessHandler.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAppView } from '../contexts/AppViewContext';
import { useUser } from '../contexts/UserContext';
import api from '../api'; // axios instance (withCredentials true)
import './StripeSuccessHandler.css';

export default function StripeSuccessHandler() {
  const { parseHashFragment, cleanHashUrl, switchView, VIEW_STATES } = useAppView();
  const { user, refreshSubscription, getSubscriptionInfo } = useUser();

  const [state, setState] = useState({
    isProcessing: false,
    stage: null,
    message: '',
    error: null,
    sessionId: null,
    newTier: null
  });

  const handleStripeSuccess = useCallback(async (sessionId) => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, stage: 'detecting', message: 'Payment detected...', sessionId }));
      await new Promise(r => setTimeout(r, 1500));

      setState(prev => ({ ...prev, stage: 'validating', message: 'Validating payment...' }));

      // Optional validation (will send cookies automatically)
      try {
        const validation = await api.get(`/stripe/session-status/${sessionId}`);
        if (validation.data?.status === 'success') {
          setState(prev => ({ ...prev, newTier: validation.data.tier_name }));
        }
      } catch (e) {
        console.warn('Session validation skipped:', e?.message);
      }

      setState(prev => ({ ...prev, stage: 'refreshing', message: 'Updating your subscription...' }));
      await new Promise(r => setTimeout(r, 1000));

      const updatedUser = await refreshSubscription(true);
      if (!updatedUser) throw new Error('Failed to refresh subscription data');

      setState(prev => ({
        ...prev,
        stage: 'success',
        message: 'Payment successful! Welcome to your new tier!',
        newTier: updatedUser.subscription_tier || prev.newTier
      }));

      cleanHashUrl(true);
      // (anything else you already do after success)

    } catch (error) {
      setState(prev => ({ ...prev, stage: 'error', error: error.message || 'Stripe update failed' }));
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [refreshSubscription, cleanHashUrl]);

  // (rest of your component unchanged

  // ============================================================================
  // DETECT STRIPE SUCCESS ON MOUNT
  // ============================================================================

  useEffect(() => {
    if (!user) return;


    // Parse current URL hash for Stripe params
    const { view, params } = parseHashFragment(window.location.hash);

    const stripeSuccess = params.stripe_success;
    const sessionId = params.session_id;

    // DEFENSIVE: Check for Stripe success params
    if (stripeSuccess === 'true' && sessionId) {
      console.log('🎯 Stripe success params detected in URL');
      handleStripeSuccess(sessionId);
    }
  }, [user, parseHashFragment, handleStripeSuccess]);

  // ============================================================================
  // RENDER PROCESSING OVERLAY
  // ============================================================================

  if (!state.isProcessing) {
    return null; // Don't render anything when not processing
  }

  return (
    <div className="stripe-success-overlay">
      <div className="stripe-success-card">
        {/* Icon based on stage */}
        <div className="stripe-success-icon">
          {state.stage === 'error' ? (
            <div className="icon-error">❌</div>
          ) : state.stage === 'success' ? (
            <div className="icon-success">✅</div>
          ) : (
            <div className="icon-spinner">
              <div className="spinner" />
            </div>
          )}
        </div>

        {/* Stage indicator */}
        <div className="stripe-success-stage">
          {state.stage === 'detecting' && '1/3'}
          {state.stage === 'validating' && '2/3'}
          {state.stage === 'refreshing' && '3/3'}
          {state.stage === 'success' && '✓'}
          {state.stage === 'error' && '!'}
        </div>

        {/* Message */}
        <h2 className={`stripe-success-title ${state.stage}`}>
          {state.stage === 'success' ? '🎉 Welcome!' : 'Processing Payment'}
        </h2>

        <p className="stripe-success-message">
          {state.message}
        </p>

        {/* New tier badge */}
        {state.newTier && state.stage === 'success' && (
          <div className="stripe-success-tier">
            <div className="tier-badge">
              {state.newTier.toUpperCase()}
            </div>
            <p className="tier-text">
              You now have access to all {state.newTier} features!
            </p>
          </div>
        )}

        {/* Error details */}
        {state.error && state.stage === 'error' && (
          <div className="stripe-success-error">
            <p className="error-note">
              Your payment was processed successfully. If your subscription
              doesn't appear, try refreshing the page or contact support.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="retry-button"
            >
              Refresh Page
            </button>
          </div>
        )}

        {/* Progress bar */}
        {state.stage !== 'error' && state.stage !== 'success' && (
          <div className="stripe-success-progress">
            <div 
              className="progress-bar"
              style={{
                width: state.stage === 'detecting' ? '33%' :
                       state.stage === 'validating' ? '66%' :
                       state.stage === 'refreshing' ? '100%' : '0%'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}