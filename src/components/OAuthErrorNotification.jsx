// src/components/OAuthErrorNotification.jsx
// OAuth Error Notification - Matches AwakeVerse Design System

import React from 'react';
import './OAuthErrorNotification.css';

export function OAuthErrorNotification({ error, onDismiss }) {
  if (!error) return null;

  // Map severity to design system semantic colors
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'var(--semantic-error)';
      case 'warning': return 'var(--semantic-warning)';
      case 'info': return 'var(--semantic-info)';
      default: return 'var(--accent-primary)';
    }
  };

  // Icon selection - clean minimal symbols
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error': return '⊖';        // Circle with dash
      case 'warning': return '⚠';      // Warning triangle (we'll replace with circuit in CSS)
      case 'info': return '+';         // Plus icon
      default: return '+';             // Plus icon for default
    }
  };
  
  // Add special class for circuit icon styling
  const getIconClass = (severity) => {
    return severity === 'warning' ? 'circuit-icon' : '';
  };

  return (
    <div 
      className="oauth-error-notification"
      style={{ 
        '--notification-accent': getSeverityColor(error.severity)
      }}
    >
      <div className="oauth-error-content">
        <div className={`oauth-error-icon ${getIconClass(error.severity)}`}>
          {error.severity === 'warning' ? (
            <span className="circuit-symbol">
              <span className="circuit-left">─┤</span>
              <span className="circuit-gap"></span>
              <span className="circuit-right">├─</span>
            </span>
          ) : (
            getSeverityIcon(error.severity)
          )}
        </div>
        
        <div className="oauth-error-text">
          <div className="oauth-error-title">
            {error.title}
          </div>
          <div className="oauth-error-message">
            {error.message}
          </div>
        </div>
        
        <button 
          className="oauth-error-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}