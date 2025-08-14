// src/components/FloatingScrollButton.js
import React from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';

const FloatingScrollButton = ({ 
  visible, 
  hasNewMessages, 
  messageCount = 0,
  onClick,
  position = 'bottom-right' 
}) => {
  if (!visible) return null;

  const positionStyles = {
    'bottom-right': {
      position: 'fixed',
      bottom: '100px',
      right: '20px',
    },
    'bottom-center': {
      position: 'fixed',
      bottom: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
    }
  };

  const buttonStyle = {
    ...positionStyles[position],
    zIndex: 1000,
    borderRadius: '50%',
    width: '48px',
    height: '48px',
    backgroundColor: hasNewMessages ? '#3b82f6' : '#6b7280',
    border: 'none',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: `${position === 'bottom-center' ? 'translateX(-50%) ' : ''}translateY(${visible ? '0' : '20px'})`,
    opacity: visible ? 1 : 0,
    pointerEvents: visible ? 'auto' : 'none',
    // Breathing animation when new messages
    animation: hasNewMessages ? 'pulse 2s infinite' : 'none'
  };

  const iconStyle = {
    transition: 'transform 0.2s ease'
  };

  const badgeStyle = {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    backgroundColor: '#ef4444',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    transform: hasNewMessages && messageCount > 0 ? 'scale(1)' : 'scale(0)',
    transition: 'transform 0.2s ease'
  };

  return (
    <>
      {/* CSS for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { 
            transform: ${position === 'bottom-center' ? 'translateX(-50%) ' : ''}scale(1); 
          }
          50% { 
            transform: ${position === 'bottom-center' ? 'translateX(-50%) ' : ''}scale(1.05); 
          }
        }
        
        .floating-scroll-button:hover {
          transform: ${position === 'bottom-center' ? 'translateX(-50%) ' : ''}scale(1.1) !important;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25) !important;
        }
        
        .floating-scroll-button:active {
          transform: ${position === 'bottom-center' ? 'translateX(-50%) ' : ''}scale(0.95) !important;
        }
      `}</style>
      
      <button
        className="floating-scroll-button"
        style={buttonStyle}
        onClick={onClick}
        title={hasNewMessages ? `${messageCount} new message${messageCount !== 1 ? 's' : ''}` : 'Scroll to bottom'}
        aria-label="Scroll to bottom"
      >
        {hasNewMessages ? (
          <MessageCircle size={20} style={iconStyle} />
        ) : (
          <ChevronDown size={20} style={iconStyle} />
        )}
        
        {/* Message count badge */}
        {hasNewMessages && messageCount > 0 && (
          <span style={badgeStyle}>
            {messageCount > 9 ? '9+' : messageCount}
          </span>
        )}
      </button>
    </>
  );
};

export default FloatingScrollButton;