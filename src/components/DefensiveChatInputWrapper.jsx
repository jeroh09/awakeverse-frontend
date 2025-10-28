// src/components/DefensiveChatInputWrapper.jsx
import React, { useState, useEffect } from 'react';

const DefensiveChatInputWrapper = ({ 
  children, 
  character, 
  user_id, 
  onUpgradePrompt 
}) => {
  const [blockState, setBlockState] = useState({
    shouldBlock: false,
    reason: null,
    loading: false
  });

  // Defensive check - isolated, no dependencies
  useEffect(() => {
    const checkChatLimits = async () => {
      // CRITICAL: Only block custom characters
      if (!character?.startsWith('user_')) {
        setBlockState({ shouldBlock: false, reason: null, loading: false });
        return;
      }

      if (!user_id) {
        // Fail safe - allow chat if no user context
        setBlockState({ shouldBlock: false, reason: null, loading: false });
        return;
      }

      try {
        setBlockState(prev => ({ ...prev, loading: true }));

        const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

        // Direct API call - no hook dependencies
        const response = await fetch(`${API_BASE}/api/premium/user_subscription/${user_id}`, {
          credentials: 'include',
          timeout: 5000 // Quick timeout
        });

        if (!response.ok) {
          throw new Error('API unavailable');
        }

        const data = await response.json();
        const subscription = data.subscription;

        // Defensive limit checking
        const messagesUsed = subscription?.messages_used || 0;
        const messageLimit = subscription?.message_limit || 150;
        const unlimited = subscription?.unlimited || false;

        const shouldBlock = !unlimited && messagesUsed >= messageLimit;

        setBlockState({
          shouldBlock,
          reason: shouldBlock ? `Message limit reached (${messagesUsed}/${messageLimit})` : null,
          loading: false
        });

      } catch (error) {
        console.warn('Chat limit check failed - allowing chat:', error);
        // CRITICAL FAILSAFE: Always allow chat on error
        setBlockState({ shouldBlock: false, reason: null, loading: false });
      }
    };

    checkChatLimits();
    
    // Refresh check every 30 seconds
    const interval = setInterval(checkChatLimits, 30000);
    return () => clearInterval(interval);
    
  }, [character, user_id]);

  // Render children with blocking overlay if needed
  if (blockState.shouldBlock) {
    return (
      <div style={{ position: 'relative' }}>
        {/* Render children but greyed out */}
        <div style={{ opacity: 0.4, pointerEvents: 'none' }}>
          {children}
        </div>
        
        {/* Upgrade prompt overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          zIndex: 10
        }}>
          <div style={{
            background: '#1a1a2e',
            border: '2px solid #FFD700',
            borderRadius: '8px',
            padding: '1rem',
            textAlign: 'center',
            color: '#FFD700'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Message limit reached</h4>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
              Upgrade to continue chatting with custom characters
            </p>
            <button
              onClick={() => onUpgradePrompt?.()}
              style={{
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                border: 'none',
                borderRadius: '6px',
                color: '#000',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              See Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal state - render children unchanged
  return children;
};

export default DefensiveChatInputWrapper;