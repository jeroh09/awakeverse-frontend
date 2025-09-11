// src/contexts/PremiumCapabilitiesContext.js - Decentralized: Remove all blocking logic
import React, { createContext, useContext } from 'react';

const PremiumCapabilitiesContext = createContext();

export const PremiumCapabilitiesProvider = ({ children }) => {
  // DECENTRALIZED APPROACH: Everyone can use core features
  // Usage limits are discovered through usage, not blocked upfront
  const contextValue = {
    // Core permissions - Always allow
    canCreateCharacter: true,        // Character creation always works
    canChatWithCharacter: true,      // Chat always works
    
    // Subscription state - Honest but non-blocking
    subscriptionState: 'free',       // Most users start free
    isPremium: false,               // Honest about status
    isTrialActive: false,           // No trial complexity
    isTrialExpired: false,          // No trial complexity
    hasPendingCharacter: false,     // Handled separately
    
    // UI flags - Non-blocking educational approach
    shouldShowUpgrade: false,       // No preemptive blocking
    shouldShowTrial: false,         // No trial prompts
    primaryAction: 'create',        // Default to creation
    
    // Character info - Display only
    characterCount: 0,              // Will be tracked separately
    characterLimit: 1,              // For educational display
    daysRemaining: null,           // No countdown pressure
    
    // System state - Always ready
    loading: false,                 // No loading gates
    error: null,                   // No error blocking
    isInitialized: true,           // Always ready
    lastFetch: Date.now(),
    
    // Actions - Simplified
    refresh: () => Promise.resolve(),
    invalidateAndRefresh: () => Promise.resolve(),
    
    // Global error handling - Simplified
    globalError: null,
    clearGlobalError: () => {}
  };

  return (
    <PremiumCapabilitiesContext.Provider value={contextValue}>
      {children}
    </PremiumCapabilitiesContext.Provider>
  );
};

export const usePremiumCapabilitiesContext = () => {
  const context = useContext(PremiumCapabilitiesContext);
  if (!context) {
    throw new Error('usePremiumCapabilitiesContext must be used within PremiumCapabilitiesProvider');
  }
  return context;
};