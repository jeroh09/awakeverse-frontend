// src/components/CapabilityGate.jsx - Permission-based component wrapper
import React from 'react';
import { usePremiumCapabilitiesContext } from '../contexts/PremiumCapabilitiesContext';

export const CapabilityGate = ({ 
  capability, 
  children, 
  fallback = null,
  showUpgrade = false 
}) => {
  const capabilities = usePremiumCapabilitiesContext();
  
  const hasCapability = capabilities[capability];
  
  if (hasCapability) {
    return children;
  }
  
  if (showUpgrade && capabilities.shouldShowUpgrade) {
    return (
      <div className="capability-upgrade-prompt">
        <p>Upgrade to premium to access this feature</p>
        <button onClick={() => window.location.href = '/upgrade'}>
          Upgrade Now
        </button>
      </div>
    );
  }
  
  return fallback;
};

// Usage examples:
// <CapabilityGate capability="canCreateCharacter" showUpgrade>
//   <CharacterCreationForm />
// </CapabilityGate>
//
// <CapabilityGate capability="canChatWithCharacter" fallback={<LockedChatMessage />}>
//   <ChatInterface />
// </CapabilityGate>