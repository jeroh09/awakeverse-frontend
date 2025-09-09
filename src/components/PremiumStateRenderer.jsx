// src/components/PremiumStateRenderer.jsx - Smart component renderer
import React from 'react';
import { usePremiumCapabilitiesContext } from '../contexts/PremiumCapabilitiesContext';

const SUBSCRIPTION_STATES = {
  FREE: 'free',
  TRIAL_ACTIVE: 'trial_active', 
  TRIAL_EXPIRED: 'trial_expired',
  PREMIUM_ACTIVE: 'premium_active',
  PREMIUM_EXPIRED: 'premium_expired',
  PENDING_APPROVAL: 'pending_approval'
};

export const PremiumStateRenderer = ({ 
  freeComponent,
  trialActiveComponent,
  trialExpiredComponent,
  premiumActiveComponent,
  premiumExpiredComponent,
  pendingApprovalComponent,
  loadingComponent,
  errorComponent
}) => {
  const { subscriptionState, loading, error } = usePremiumCapabilitiesContext();

  if (loading) return loadingComponent || <div>Loading premium status...</div>;
  if (error) return errorComponent || <div>Error loading premium status</div>;

  switch (subscriptionState) {
    case SUBSCRIPTION_STATES.FREE:
      return freeComponent;
    case SUBSCRIPTION_STATES.TRIAL_ACTIVE:
      return trialActiveComponent;
    case SUBSCRIPTION_STATES.TRIAL_EXPIRED:
      return trialExpiredComponent;
    case SUBSCRIPTION_STATES.PREMIUM_ACTIVE:
      return premiumActiveComponent;
    case SUBSCRIPTION_STATES.PREMIUM_EXPIRED:
      return premiumExpiredComponent;
    case SUBSCRIPTION_STATES.PENDING_APPROVAL:
      return pendingApprovalComponent;
    default:
      return freeComponent; // Safe fallback
  }
};
