// src/components/DefensiveCharacterCreationWrapper.jsx  
import React, { useState, useEffect } from 'react';

const DefensiveCharacterCreationWrapper = ({ 
  children, 
  user_id, 
  onUpgradePrompt,
  blockingMessage = "Character limit reached" 
}) => {
  const [blockState, setBlockState] = useState({
    shouldBlock: false,
    reason: null,
    currentCount: 0,
    limit: 1
  });

  useEffect(() => {
    const checkCharacterLimits = async () => {
      if (!user_id) {
        // Fail safe - allow creation if no user context
        setBlockState({ shouldBlock: false, reason: null, currentCount: 0, limit: 1 });
        return;
      }

      try {
        const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');

        // Get subscription data
        const subResponse = await fetch(`${API_BASE}/api/premium/user_subscription/${user_id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 5000
        });

        if (!subResponse.ok) throw new Error('Subscription API unavailable');

        const subData = await subResponse.json();
        const subscription = subData.subscription;

        // Get current character count
        const charResponse = await fetch(`${API_BASE}/api/premium/characters`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!charResponse.ok) throw new Error('Characters API unavailable');

        const charData = await charResponse.json();
        const currentCount = charData.characters?.length || 0;

        // Check limits
        const characterLimit = subscription?.character_limit || 1;
        const unlimited = subscription?.unlimited || false;

        const shouldBlock = !unlimited && currentCount >= characterLimit;

        setBlockState({
          shouldBlock,
          reason: shouldBlock ? `Character limit reached (${currentCount}/${characterLimit})` : null,
          currentCount,
          limit: characterLimit
        });

      } catch (error) {
        console.warn('Character limit check failed - allowing creation:', error);
        // CRITICAL FAILSAFE: Always allow creation on error
        setBlockState({ shouldBlock: false, reason: null, currentCount: 0, limit: 1 });
      }
    };

    checkCharacterLimits();
  }, [user_id]);

  // Render with blocking if needed
  if (blockState.shouldBlock) {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Greyed out children */}
        <div style={{ opacity: 0.4, pointerEvents: 'none' }}>
          {children}
        </div>
        
        {/* Blocking overlay for buttons */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          cursor: 'pointer',
          zIndex: 999
        }}
        onClick={() => onUpgradePrompt?.()}
        >
          <span style={{
            color: '#FFD700',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '0.5rem'
          }}>
            {blockingMessage}<br />
            <small style={{ color: '#FFA500' }}>Click to upgrade</small>
          </span>
        </div>
      </div>
    );
  }

  return children;
};

export default DefensiveCharacterCreationWrapper;