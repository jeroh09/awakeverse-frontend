// src/hooks/useBreathingInterface.js
import { useState, useEffect, useRef, useCallback } from 'react';

export const INTERFACE_STATES = {
  IDLE: 'idle',           // No user activity - minimal UI
  ACTIVE: 'active',       // User typing/interacting - full UI
  SCROLLING: 'scrolling', // User browsing history - faded chrome
  FOCUSED: 'focused'      // Input focused - enhanced UI
};

export default function useBreathingInterface({
  enabled = true,
  idleTimeout = 3000,     // 3 seconds of inactivity = idle
  scrollTimeout = 1000    // 1 second after scroll = return to previous state
}) {
  const [interfaceState, setInterfaceState] = useState(INTERFACE_STATES.IDLE);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const idleTimerRef = useRef(null);
  const scrollTimerRef = useRef(null);
  const activityRef = useRef(Date.now());

  // Clear existing timers
  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = null;
    }
  }, []);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    const now = Date.now();
    activityRef.current = now;
    setLastActivity(now);
  }, []);

  // Set interface state with activity tracking
  const setStateWithActivity = useCallback((newState) => {
    if (!enabled) return;
    
    setInterfaceState(newState);
    if (newState !== INTERFACE_STATES.IDLE) {
      updateActivity();
    }
  }, [enabled, updateActivity]);

  // Handle user typing
  const handleTypingStart = useCallback(() => {
    if (!enabled) return;
    
    setIsUserTyping(true);
    setStateWithActivity(INTERFACE_STATES.ACTIVE);
    clearTimers();
  }, [enabled, setStateWithActivity, clearTimers]);

  const handleTypingEnd = useCallback(() => {
    if (!enabled) return;
    
    setIsUserTyping(false);
    clearTimers();
    
    // Set idle timer
    idleTimerRef.current = setTimeout(() => {
      setInterfaceState(INTERFACE_STATES.IDLE);
    }, idleTimeout);
  }, [enabled, idleTimeout, clearTimers]);

  // Handle scrolling
  const handleScrollStart = useCallback(() => {
    if (!enabled) return;
    
    setIsScrolling(true);
    setStateWithActivity(INTERFACE_STATES.SCROLLING);
    clearTimers();
  }, [enabled, setStateWithActivity, clearTimers]);

  const handleScrollEnd = useCallback(() => {
    if (!enabled) return;
    
    setIsScrolling(false);
    clearTimers();
    
    // Return to previous state after scroll timeout
    scrollTimerRef.current = setTimeout(() => {
      if (isUserTyping) {
        setInterfaceState(INTERFACE_STATES.ACTIVE);
      } else {
        // Set idle timer
        idleTimerRef.current = setTimeout(() => {
          setInterfaceState(INTERFACE_STATES.IDLE);
        }, idleTimeout);
      }
    }, scrollTimeout);
  }, [enabled, isUserTyping, idleTimeout, scrollTimeout, clearTimers]);

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    if (!enabled) return;
    
    setStateWithActivity(INTERFACE_STATES.FOCUSED);
    clearTimers();
  }, [enabled, setStateWithActivity, clearTimers]);

  const handleInputBlur = useCallback(() => {
    if (!enabled) return;
    
    if (isUserTyping) {
      setStateWithActivity(INTERFACE_STATES.ACTIVE);
    } else {
      clearTimers();
      idleTimerRef.current = setTimeout(() => {
        setInterfaceState(INTERFACE_STATES.IDLE);
      }, idleTimeout);
    }
  }, [enabled, isUserTyping, idleTimeout, setStateWithActivity, clearTimers]);

  // Handle general user activity
  const handleUserActivity = useCallback(() => {
    if (!enabled) return;
    
    updateActivity();
    if (interfaceState === INTERFACE_STATES.IDLE && !isScrolling) {
      setInterfaceState(INTERFACE_STATES.ACTIVE);
    }
  }, [enabled, updateActivity, interfaceState, isScrolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  // Disable functionality when not enabled
  if (!enabled) {
    return {
      interfaceState: INTERFACE_STATES.ACTIVE,
      isUserTyping: false,
      isScrolling: false,
      handlers: {
        onTypingStart: () => {},
        onTypingEnd: () => {},
        onScrollStart: () => {},
        onScrollEnd: () => {},
        onInputFocus: () => {},
        onInputBlur: () => {},
        onUserActivity: () => {}
      },
      utils: {
        isIdle: false,
        isActive: true,
        isScrolling: false,
        isFocused: false,
        timeSinceActivity: 0
      }
    };
  }

  // Calculate utilities
  const utils = {
    isIdle: interfaceState === INTERFACE_STATES.IDLE,
    isActive: interfaceState === INTERFACE_STATES.ACTIVE,
    isScrolling: interfaceState === INTERFACE_STATES.SCROLLING,
    isFocused: interfaceState === INTERFACE_STATES.FOCUSED,
    timeSinceActivity: Date.now() - lastActivity
  };

  return {
    interfaceState,
    isUserTyping,
    isScrolling,
    handlers: {
      onTypingStart: handleTypingStart,
      onTypingEnd: handleTypingEnd,
      onScrollStart: handleScrollStart,
      onScrollEnd: handleScrollEnd,
      onInputFocus: handleInputFocus,
      onInputBlur: handleInputBlur,
      onUserActivity: handleUserActivity
    },
    utils
  };
}