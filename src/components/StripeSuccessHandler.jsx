// src/components/StripeSuccessHandler.jsx - STEP 3
// DEFENSIVE: Handles Stripe redirect without page reload

import React, { useEffect, useState, useCallback } from 'react';
import { useAppView } from '../contexts/AppViewContext';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import './StripeSuccessHandler.css';

/**
 * StripeSuccessHandler Component
 * 
 * Detects Stripe success params in URL hash and handles subscription update
 * WITHOUT page reload - smooth UX with loading states
 * 
 * Usage: Add to ChatApp.js as a child component
 */
export default function StripeSuccessHandler() {
  const { parseHashFragment, cleanHashUrl, switchView, VIEW_STATES } = useAppView();
  const { refreshSubscription, getSubscriptionInfo } = useUser();
  const { token } = useAuth();

  const [state, setState] = useState({
    isProcessing: false,
    stage: null, // 'detecting' | 'validating' | 'refreshing' | 'success' | 'error'
    message: '',
    error: null,
    sessionId: null,
    newTier: null
  });

  // ============================================================================
  // STEP 3: STRIPE SUCCESS DETECTION & PROCESSING
  // ============================================================================

  const handleStripeSuccess = useCallback(async (sessionId) => {
    try {
      // STAGE 1: Detecting
      setState(prev => ({
        ...prev,
        isProcessing: true,
        stage: 'detecting',
        message: 'Payment detected...',
        sessionId
      }));

      console.log('💳 Stripe success detected! Session:', sessionId);

      // Small delay for UX (let webhook process in background)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // STAGE 2: Validating session
      setState(prev => ({
        ...prev,
        stage: 'validating',
        message: 'Validating payment...'
      }));

      console.log('🔍 Validating Stripe session...');

      // Optional: Validate session with backend (if you have this endpoint)
      try {
        const validation = await api.get(`/stripe/session-status/${sessionId}`);
        
        if (validation.data?.status === 'success') {
          console.log('✅ Session validated:', validation.data);
          
          const tierName = validation.data.tier_name;
          setState(prev => ({
            ...prev,
            newTier: tierName
          }));
        }
      } catch (validationError) {
        // DEFENSIVE: Continue even if validation endpoint doesn't exist
        console.warn('Session validation skipped:', validationError.message);
      }

      // STAGE 3: Refreshing subscription
      setState(prev => ({
        ...prev,
        stage: 'refreshing',
        message: 'Updating your subscription...'
      }));

      console.log('🔄 Refreshing user subscription...');

      // Wait a bit more for webhook to complete (defensive timing)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh user subscription data from API
      const updatedUser = await refreshSubscription(true);

      if (!updatedUser) {
        throw new Error('Failed to refresh subscription data');
      }

      // STAGE 4: Success!
      setState(prev => ({
        ...prev,
        stage: 'success',
        message: 'Payment successful! Welcome to your new tier!',
        newTier: updatedUser.subscription_tier || prev.newTier
      }));

      console.log('✅ Subscription updated successfully!');
      console.log('📊 New tier:', updatedUser.subscription_tier);

      // Clean URL (remove query params) - NO RELOAD
      cleanHashUrl(true);

      // Wait for success message to show
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Navigate to chat view
      switchView(VIEW_STATES.CHAT, { replace: true });

      // Clear processing state
      setState(prev => ({
        ...prev,
        isProcessing: false,
        stage: null
      }));

    } catch (error) {
      console.error('❌ Stripe success handling error:', error);

      setState(prev => ({
        ...prev,
        stage: 'error',
        message: 'Payment successful, but subscription update failed',
        error: error.message,
        isProcessing: true // Keep showing so user can see error
      }));

      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          stage: null
        }));
      }, 5000);
    }
  }, [refreshSubscription, cleanHashUrl, switchView, VIEW_STATES]);

  // ============================================================================
  // DETECT STRIPE SUCCESS ON MOUNT
  // ============================================================================

  useEffect(() => {
    if (!token) return;

    // Parse current URL hash for Stripe params
    const { view, params } = parseHashFragment(window.location.hash);

    const stripeSuccess = params.stripe_success;
    const sessionId = params.session_id;

    // DEFENSIVE: Check for Stripe success params
    if (stripeSuccess === 'true' && sessionId) {
      console.log('🎯 Stripe success params detected in URL');
      handleStripeSuccess(sessionId);
    }
  }, [token, parseHashFragment, handleStripeSuccess]);

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