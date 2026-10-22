// TestUsageComponents.jsx - Test the usage tracking components
import React, { useState } from 'react';
import useUsageTracking from '../hooks/useUsageTracking';
import UsageIndicator, { HeaderUsageIndicator, ChatUsageIndicator } from '../components/UsageIndicator';

const TestUsageComponents = () => {
  const [testCharacter, setTestCharacter] = useState('user_test_character');
  
  // Test the usage tracking hook
  const {
    usage,
    isCustomCharacter,
    canSendMessage,
    getUsageDisplayText,
    getUpgradeSuggestion,
    showWarning,
    warningMessage,
    refreshUsage,
    isLoading,
    hasError,
    isUnlimited,
    isAtLimit,
    needsUpgrade
  } = useUsageTracking(testCharacter);

  const handleUpgradeClick = () => {
    alert('Upgrade clicked! This would open subscription modal.');
  };

  return (
    <div style={{
      padding: '2rem',
      background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 25%, #2C1810 50%, #0F1A2E 75%, #0B1426 100%)',
      minHeight: '100vh',
      color: 'white',
      fontFamily: 'Georgia, serif'
    }}>
      <h1 style={{ color: '#FFD700', marginBottom: '2rem' }}>
        Usage Tracking Components Test
      </h1>

      {/* Character Selector */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#FFD700' }}>Test Character:</h3>
        <select 
          value={testCharacter} 
          onChange={(e) => setTestCharacter(e.target.value)}
          style={{
            padding: '0.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '4px'
          }}
        >
          <option value="sherlock">Sherlock (Static)</option>
          <option value="napoleon">Napoleon (Static)</option>
          <option value="user_test_character">User Test Character (Custom)</option>
          <option value="user_another_test">User Another Test (Custom)</option>
        </select>
      </div>

      {/* Hook Data Display */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h3 style={{ color: '#FFD700' }}>Hook Data:</h3>
        <pre style={{ 
          background: 'rgba(0, 0, 0, 0.3)', 
          padding: '1rem', 
          borderRadius: '4px',
          fontSize: '0.8rem',
          overflow: 'auto'
        }}>
          {JSON.stringify({
            isCustomCharacter,
            canSendMessage,
            isLoading,
            hasError,
            isUnlimited,
            isAtLimit,
            needsUpgrade,
            usage: {
              tier: usage.tier,
              tier_display: usage.tier_display,
              messages_used: usage.messages_used,
              message_limit: usage.message_limit,
              unlimited: usage.unlimited
            },
            displayText: getUsageDisplayText(),
            upgradeSuggestion: getUpgradeSuggestion(),
            showWarning,
            warningMessage
          }, null, 2)}
        </pre>
      </div>

      {/* Component Tests */}
      <div style={{ display: 'grid', gap: '2rem' }}>
        
        {/* Header Usage Indicator Test */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1rem',
          borderRadius: '8px'
        }}>
          <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>Header Usage Indicator:</h3>
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '1rem',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Character: {testCharacter}</span>
            <HeaderUsageIndicator 
              usage={usage}
              isCustomCharacter={isCustomCharacter}
              onUpgradeClick={handleUpgradeClick}
            />
          </div>
        </div>

        {/* Chat Usage Indicator Test */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1rem',
          borderRadius: '8px'
        }}>
          <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>Chat Usage Indicator:</h3>
          <ChatUsageIndicator 
            usage={usage}
            isCustomCharacter={isCustomCharacter}
            showWarning={showWarning}
            warningMessage={warningMessage}
            onUpgradeClick={handleUpgradeClick}
          />
        </div>

        {/* Test Actions */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1rem',
          borderRadius: '8px'
        }}>
          <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>Test Actions:</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={refreshUsage}
              style={{
                background: 'rgba(255, 215, 0, 0.2)',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                color: '#FFD700',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Refresh Usage
            </button>
            
            <button 
              onClick={handleUpgradeClick}
              style={{
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                border: 'none',
                color: '#000',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Test Upgrade Click
            </button>
          </div>
        </div>

        {/* Error/Loading States */}
        {isLoading && (
          <div style={{
            background: 'rgba(255, 165, 0, 0.1)',
            border: '1px solid rgba(255, 165, 0, 0.3)',
            color: '#FFA500',
            padding: '1rem',
            borderRadius: '8px'
          }}>
            Loading usage data...
          </div>
        )}

        {hasError && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            color: '#ff6b6b',
            padding: '1rem',
            borderRadius: '8px'
          }}>
            Error loading usage data: {usage.error}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestUsageComponents;