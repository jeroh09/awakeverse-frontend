// components/UsageIndicator.jsx - Display usage for custom characters only
import React from 'react';

const UsageIndicator = ({ 
  usage, 
  isCustomCharacter,
  showWarning,
  warningMessage,
  onUpgradeClick,
  compact = false 
}) => {
  // Don't render for static characters
  if (!isCustomCharacter) {
    return null;
  }

  // Don't render if loading or error
  if (usage.loading || usage.error) {
    return null;
  }

  // Don't render for unlimited plans
  if (usage.unlimited) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: compact ? '0.25rem 0.5rem' : '0.5rem 0.75rem',
        background: 'rgba(0, 255, 136, 0.1)',
        border: '1px solid rgba(0, 255, 136, 0.3)',
        borderRadius: '8px',
        fontSize: compact ? '0.7rem' : '0.8rem',
        color: '#00FF88',
        fontWeight: 500
      }}>
        <span style={{ fontSize: compact ? '0.6rem' : '0.7rem' }}>∞</span>
        Unlimited
      </div>
    );
  }

  // Calculate usage percentage for visual indicator
  const usagePercentage = Math.min(100, (usage.messages_used / usage.message_limit) * 100);
  
  // Determine color based on usage
  const getUsageColor = () => {
    if (usagePercentage >= 90) return '#ff6b6b'; // Red
    if (usagePercentage >= 75) return '#FFA500'; // Orange
    return '#FFD700'; // Gold
  };

  const usageColor = getUsageColor();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: compact ? '0.25rem' : '0.5rem'
    }}>
      {/* Usage Counter */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: compact ? '0.25rem 0.5rem' : '0.5rem 0.75rem',
        background: 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${usageColor}40`,
        borderRadius: '8px',
        fontSize: compact ? '0.7rem' : '0.8rem',
        color: usageColor,
        fontWeight: 500
      }}>
        {/* Usage Progress Bar */}
        <div style={{
          width: compact ? '40px' : '60px',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${usagePercentage}%`,
            height: '100%',
            background: usageColor,
            borderRadius: '2px',
            transition: 'width 0.3s ease'
          }} />
        </div>
        
        {/* Usage Text */}
        <span>
          {usage.messages_used}/{usage.message_limit} messages
        </span>
        
        {/* Tier Badge */}
        <span style={{
          background: `${usageColor}20`,
          color: usageColor,
          padding: '0.1rem 0.4rem',
          borderRadius: '4px',
          fontSize: compact ? '0.6rem' : '0.65rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {usage.tier_display}
        </span>
      </div>

      {/* Friendly Warning Message */}
      {showWarning && warningMessage && (
        <div style={{
          padding: compact ? '0.4rem 0.6rem' : '0.6rem 0.8rem',
          background: usagePercentage >= 100 
            ? 'rgba(255, 107, 107, 0.1)' 
            : 'rgba(255, 165, 0, 0.1)',
          border: `1px solid ${usagePercentage >= 100 ? '#ff6b6b' : '#FFA500'}40`,
          borderRadius: '8px',
          fontSize: compact ? '0.7rem' : '0.8rem',
          color: usagePercentage >= 100 ? '#ff6b6b' : '#FFA500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}>
          <span style={{ flex: 1 }}>
            {warningMessage}
          </span>
          
          {/* Upgrade Button */}
          {onUpgradeClick && (
            <button
              onClick={onUpgradeClick}
              style={{
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                border: 'none',
                borderRadius: '6px',
                color: '#000',
                fontSize: compact ? '0.65rem' : '0.7rem',
                fontWeight: 600,
                padding: compact ? '0.2rem 0.5rem' : '0.3rem 0.6rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(255, 215, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Upgrade
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Compact version for header use
const HeaderUsageIndicator = ({ usage, isCustomCharacter, onUpgradeClick }) => {
  return (
    <UsageIndicator 
      usage={usage}
      isCustomCharacter={isCustomCharacter}
      showWarning={false} // No warnings in header, keep it clean
      onUpgradeClick={onUpgradeClick}
      compact={true}
    />
  );
};

// Full version for chat input area
const ChatUsageIndicator = ({ 
  usage, 
  isCustomCharacter, 
  showWarning, 
  warningMessage, 
  onUpgradeClick 
}) => {
  return (
    <UsageIndicator 
      usage={usage}
      isCustomCharacter={isCustomCharacter}
      showWarning={showWarning}
      warningMessage={warningMessage}
      onUpgradeClick={onUpgradeClick}
      compact={false}
    />
  );
};

// Single export statement
export { HeaderUsageIndicator, ChatUsageIndicator };

// Named exports for better import clarity
export { HeaderUsageIndicator, ChatUsageIndicator };
export default UsageIndicator;