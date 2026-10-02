// src/components/SoftUsageReminder.jsx - Contextual usage reminders above text input
import React from 'react';

const SoftUsageReminder = ({ 
  softReminder, 
  onUpgradeClick,
  className = '',
  style = {} 
}) => {
  if (!softReminder) {
    return null;
  }
  
  // Severity-based styling
  const getSeverityStyle = (severity) => {
    const baseStyle = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.5rem 1rem',
      borderRadius: '8px 8px 0 0', // Only top corners rounded to connect with input
      fontSize: '0.8rem',
      fontWeight: 500,
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(10px)',
      border: '1px solid',
      borderBottom: 'none' // Connect seamlessly with input
    };
    
    switch (severity) {
      case 'high':
        return {
          ...baseStyle,
          background: 'rgba(255, 107, 107, 0.15)',
          borderColor: 'rgba(255, 107, 107, 0.4)',
          color: '#ff6b6b'
        };
      case 'medium':
        return {
          ...baseStyle,
          background: 'rgba(255, 165, 0, 0.15)',
          borderColor: 'rgba(255, 165, 0, 0.4)',
          color: '#FFA500'
        };
      case 'low':
        return {
          ...baseStyle,
          background: 'rgba(255, 215, 0, 0.1)',
          borderColor: 'rgba(255, 215, 0, 0.3)',
          color: '#FFD700'
        };
      default:
        return {
          ...baseStyle,
          background: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          color: 'rgba(255, 255, 255, 0.8)'
        };
    }
  };
  
  const reminderStyle = {
    ...getSeverityStyle(softReminder.severity),
    ...style
  };
  
  const handleUpgradeClick = (e) => {
    e.preventDefault();
    if (onUpgradeClick) {
      onUpgradeClick(softReminder);
    } else {
      // Default behavior - could open upgrade modal
      console.log('Upgrade clicked:', softReminder.type);
    }
  };
  
  return (
    <div 
      className={`soft-usage-reminder ${className}`}
      style={reminderStyle}
    >
      {/* Message */}
      <span className="reminder-message">
        {softReminder.message}
      </span>
      
      {/* Action button */}
      <button
        onClick={handleUpgradeClick}
        style={{
          background: 'transparent',
          border: `1px solid ${reminderStyle.color}`,
          borderRadius: '4px',
          color: reminderStyle.color,
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '0.25rem 0.75rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          opacity: 0.9
        }}
        onMouseEnter={(e) => {
          e.target.style.background = `${reminderStyle.color}20`;
          e.target.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'transparent';
          e.target.style.opacity = '0.9';
        }}
      >
        {softReminder.actionText}
      </button>
    </div>
  );
};

// Usage examples for different reminder types:
/*
// Approaching limit (80%+)
<SoftUsageReminder 
  softReminder={{
    type: 'approaching',
    message: 'Close to your limit',
    actionText: 'Upgrade to continue',
    severity: 'low'
  }}
/>

// Very close to limit (90%+)  
<SoftUsageReminder
  softReminder={{
    type: 'very_close', 
    message: 'Almost at your limit',
    actionText: 'Upgrade to Pro',
    severity: 'medium'
  }}
/>

// Limit reached
<SoftUsageReminder
  softReminder={{
    type: 'limit_reached',
    message: 'Message limit reached', 
    actionText: 'See upgrade plans',
    severity: 'high'
  }}
/>
*/

export default SoftUsageReminder;