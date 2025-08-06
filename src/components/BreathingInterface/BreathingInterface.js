// src/components/BreathingInterface/BreathingInterface.js
import React, { createContext, useContext, useEffect, useRef } from 'react';
import useBreathingInterface, { INTERFACE_STATES } from '../../hooks/useBreathingInterface';
import './BreathingInterface.css';

const BreathingInterfaceContext = createContext(null);

export const useBreathingContext = () => {
  const context = useContext(BreathingInterfaceContext);
  if (!context) {
    throw new Error('useBreathingContext must be used within BreathingInterface');
  }
  return context;
};

export default function BreathingInterface({ 
  children, 
  enabled = true,
  className = ''
}) {
  const breathing = useBreathingInterface({ enabled });
  const containerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  // Handle scroll detection on container
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    let isScrolling = false;

    const handleScroll = () => {
      if (!isScrolling) {
        breathing.handlers.onScrollStart();
        isScrolling = true;
      }

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set new timeout for scroll end
      scrollTimeoutRef.current = setTimeout(() => {
        breathing.handlers.onScrollEnd();
        isScrolling = false;
      }, 150); // 150ms after scroll stops
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [enabled, breathing.handlers]);

  // Handle general user activity detection
  useEffect(() => {
    if (!enabled) return;

    const handleActivity = () => {
      breathing.handlers.onUserActivity();
    };

    // Listen for various user activities
    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, breathing.handlers]);

  const containerClasses = [
    'breathing-interface',
    `state-${breathing.interfaceState}`,
    breathing.utils.isIdle ? 'is-idle' : '',
    breathing.utils.isActive ? 'is-active' : '',
    breathing.utils.isScrolling ? 'is-scrolling' : '',
    breathing.utils.isFocused ? 'is-focused' : '',
    breathing.isUserTyping ? 'is-typing' : '',
    enabled ? 'breathing-enabled' : 'breathing-disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <BreathingInterfaceContext.Provider value={breathing}>
      <div 
        ref={containerRef}
        className={containerClasses}
        data-interface-state={breathing.interfaceState}
      >
        {children}
      </div>
    </BreathingInterfaceContext.Provider>
  );
}

// Helper components for common UI patterns
export const BreathingElement = ({ 
  children, 
  showOn = [INTERFACE_STATES.ACTIVE, INTERFACE_STATES.FOCUSED],
  hideOn = [],
  className = '',
  fade = true,
  ...props 
}) => {
  const breathing = useBreathingContext();
  
  // If no breathing context, always show (fallback behavior)
  if (!breathing) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }
  
  const shouldShow = showOn.includes(breathing.interfaceState) && !hideOn.includes(breathing.interfaceState);
  
  const elementClasses = [
    'breathing-element',
    shouldShow ? 'visible' : 'hidden',
    fade ? 'fade-transition' : 'instant-transition',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={elementClasses} {...props}>
      {children}
    </div>
  );
};

export const BreathingChrome = ({ 
  children, 
  fadeOnScroll = true,
  className = '',
  ...props 
}) => {
  const breathing = useBreathingContext();
  
  // If no breathing context, always show (fallback behavior)
  if (!breathing) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }
  
  const shouldFade = fadeOnScroll && breathing.interfaceState === INTERFACE_STATES.SCROLLING;
  
  const chromeClasses = [
    'breathing-chrome',
    shouldFade ? 'faded' : 'visible',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={chromeClasses} {...props}>
      {children}
    </div>
  );
};