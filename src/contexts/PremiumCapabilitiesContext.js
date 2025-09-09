// src/contexts/PremiumCapabilitiesContext.js - Global state management
import React, { createContext, useContext, useEffect, useState } from 'react';
import usePremiumCapabilities from '../hooks/usePremiumCapabilities';

const PremiumCapabilitiesContext = createContext();

export const PremiumCapabilitiesProvider = ({ children }) => {
  const capabilities = usePremiumCapabilities();
  const [globalError, setGlobalError] = useState(null);

  // Global error handling
  useEffect(() => {
    if (capabilities.error) {
      setGlobalError(capabilities.error);
      
      // Clear error after 10 seconds
      const timer = setTimeout(() => {
        setGlobalError(null);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [capabilities.error]);

  // Performance monitoring
  useEffect(() => {
    if (capabilities.isInitialized) {
      console.log('🎯 Premium capabilities initialized:', {
        state: capabilities.subscriptionState,
        canCreate: capabilities.canCreateCharacter,
        characters: capabilities.characterCount
      });
    }
  }, [capabilities.isInitialized, capabilities.subscriptionState, capabilities.canCreateCharacter, capabilities.characterCount]);

  const contextValue = {
    ...capabilities,
    globalError,
    clearGlobalError: () => setGlobalError(null)
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
