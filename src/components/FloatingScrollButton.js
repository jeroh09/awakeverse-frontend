// FloatingScrollButton.js - INDIGO THEME
// Replace the buttonStyle and CSS sections with these updated versions

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

  const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const positionStyles = {
    'bottom-right': {
      position: 'fixed',
      bottom: isMobile ? '220px' : '200px',
      right: isMobile ? '16px' : '20px',
      paddingBottom: 'env(safe-area-inset-bottom)',
    },
    'bottom-center': {
      position: 'fixed',
      bottom: isMobile ? '220px' : '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }
  };

  const buttonStyle = {
    ...positionStyles[position],
    zIndex: 1001,
    borderRadius: '50%',
    width: isMobile ? '44px' : '48px',
    height: isMobile ? '44px' : '48px',
    // 🎨 INDIGO THEME (changed from gold)
    backgroundColor: hasNewMessages 
      ? 'rgba(99, 102, 241, 0.15)'  // Indigo with transparency
      : 'rgba(99, 102, 241, 0.1)',   // More transparent when no new messages
    border: '2px solid #6366F1',     // Indigo border
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)', // Indigo shadow
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6366F1', // Indigo icon color
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: `${position === 'bottom-center' ? 'translateX(-50%) ' : ''}translateY(${visible ? '0' : '20px'})`,
    opacity: visible ? 1 : 0,
    pointerEvents: visible ? 'auto' : 'none',
    animation: hasNewMessages ? 'indigoPulse 2s infinite' : 'none',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  };

  const iconStyle = {
    transition: 'transform 0.2s ease',
    filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
  };

  const badgeStyle = {
    position: 'absolute',
    top: '-3px',
    right: '-3px',
    backgroundColor: '#FF4444', // Keep red for visibility
    color: 'white',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    fontSize: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    transform: hasNewMessages && messageCount > 0 ? 'scale(1)' : 'scale(0)',
    transition: 'transform 0.2s ease',
    border: '1px solid #6366F1', // Indigo border on badge
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
  };

  return (
    <>
      <style>{`
        @keyframes indigoPulse {
          0%, 100% { 
            transform: ${position === 'bottom-center' ? 'translateX(-50%) ' : ''}scale(1);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          }
          50% { 
            transform: ${position === 'bottom-center' ? 'translateX(-50%) ' : ''}scale(1.05);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
          }
        }
        
        .floating-scroll-button:hover {
          transform: ${position === 'bottom-center' ? 'translateX(-50%) ' : ''}scale(1.1) !important;
          background-color: rgba(99, 102, 241, 0.25) !important;
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4) !important;
        }
        
        .floating-scroll-button:active {
          transform: ${position === 'bottom-center' ? 'translateX(-50%) ' : ''}scale(0.95) !important;
          background-color: rgba(99, 102, 241, 0.3) !important;
        }

        @media (max-width: 768px) {
          .floating-scroll-button {
            bottom: calc(220px + env(safe-area-inset-bottom)) !important;
          }
        }

        @supports (-webkit-touch-callout: none) {
          .floating-scroll-button {
            bottom: calc(230px + env(safe-area-inset-bottom)) !important;
          }
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
          <MessageCircle size={isMobile ? 18 : 20} style={iconStyle} />
        ) : (
          <ChevronDown size={isMobile ? 18 : 20} style={iconStyle} />
        )}
        
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