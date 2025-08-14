// src/hooks/useSmartScroll.js - COMPLETE FIXED VERSION
import { useState, useRef, useCallback, useEffect } from 'react';

const NEAR_BOTTOM_THRESHOLD = 150; // pixels from bottom to consider "near bottom"
const SCROLL_DEBOUNCE_MS = 100;

export const useSmartScroll = (listRef, chatHistory) => {
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  
  const scrollTimeoutRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  const lastMessageCountRef = useRef(0);
  const userScrolledRef = useRef(false);
  const isAutoScrollingRef = useRef(false);

  // Debug logging for testing
  const log = useCallback((message, data = {}) => {
    console.log(`[SmartScroll] ${message}`, data);
  }, []);

  // Error boundary check
  useEffect(() => {
    console.log('🚀 useSmartScroll hook initialized', {
      hasListRef: !!listRef,
      chatHistoryLength: chatHistory?.length,
      timestamp: new Date().toISOString()
    });
  }, []);

  // Check if chatHistory is valid
  if (!Array.isArray(chatHistory)) {
    console.error('❌ useSmartScroll: chatHistory is not an array:', chatHistory);
    return {
      isNearBottom: true,
      shouldAutoScroll: true,
      hasNewMessages: false,
      scrollToBottom: () => {},
      handleScroll: () => {},
      enableAutoScroll: () => {},
      disableAutoScroll: () => {}
    };
  }

  // FIXED: Scroll position checker with correct distance calculation
  const checkScrollPosition = useCallback(() => {
    if (!listRef.current || isAutoScrollingRef.current) return;

    try {
      // For react-window, we need to access scroll info differently
      const list = listRef.current;
      const scrollElement = list._outerRef;
      
      if (!scrollElement) {
        log('No scroll element found');
        return;
      }

      const scrollTop = scrollElement.scrollTop;
      const scrollHeight = scrollElement.scrollHeight;
      const clientHeight = scrollElement.clientHeight;
      
      // FIXED: Calculate distance from bottom correctly
      const maxScrollTop = scrollHeight - clientHeight;
      const distanceFromBottom = maxScrollTop - scrollTop;
      const nearBottom = distanceFromBottom <= NEAR_BOTTOM_THRESHOLD;
      
      // Detect if user manually scrolled up
      const scrolledUp = scrollTop < lastScrollTopRef.current - 5; // 5px tolerance
      
      log('Scroll position check (FIXED)', {
        scrollTop,
        scrollHeight,
        clientHeight,
        maxScrollTop,
        distanceFromBottom,
        nearBottom,
        scrolledUp,
        shouldAutoScroll
      });
      
      if (scrolledUp && !isAutoScrollingRef.current) {
        userScrolledRef.current = true;
        setShouldAutoScroll(false);
        log('User scrolled up - disabling autoscroll');
      }
      
      // If user scrolled back near bottom, re-enable autoscroll
      if (nearBottom && userScrolledRef.current) {
        userScrolledRef.current = false;
        setShouldAutoScroll(true);
        setHasNewMessages(false);
        log('User scrolled back to bottom - enabling autoscroll');
      }
      
      setIsNearBottom(nearBottom);
      lastScrollTopRef.current = scrollTop;
    } catch (error) {
      console.error('[SmartScroll] Error in checkScrollPosition:', error);
    }
  }, [listRef, log, shouldAutoScroll]);

  // Debounced scroll handler
  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      checkScrollPosition();
    }, SCROLL_DEBOUNCE_MS);
  }, [checkScrollPosition]);

  // FIXED: Smart scroll to bottom function with detailed debugging
  const scrollToBottom = useCallback((force = false) => {
    if (!listRef.current) {
      log('Cannot scroll - no listRef');
      return;
    }
    
    if (force || shouldAutoScroll) {
      log('Scrolling to bottom (DEBUG method)', { force, shouldAutoScroll });
      isAutoScrollingRef.current = true;
      
      // Get the scroll container
      const scrollElement = listRef.current._outerRef;
      if (!scrollElement) {
        log('No scroll element found');
        return;
      }
      
      // DEBUG: Log initial state
      log('BEFORE scroll attempt', {
        scrollTop: scrollElement.scrollTop,
        scrollHeight: scrollElement.scrollHeight,
        clientHeight: scrollElement.clientHeight,
        maxScroll: scrollElement.scrollHeight - scrollElement.clientHeight
      });
      
      // Calculate the correct scroll position
      const targetScrollTop = scrollElement.scrollHeight - scrollElement.clientHeight;
      
      // Method 1: Set scrollTop directly
      scrollElement.scrollTop = targetScrollTop;
      
      log('AFTER direct scroll', {
        scrollTop: scrollElement.scrollTop,
        targetScrollTop: targetScrollTop,
        success: scrollElement.scrollTop === targetScrollTop
      });
      
      // Method 2: Use scrollTo as backup
      if (scrollElement.scrollTop !== targetScrollTop) {
        scrollElement.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
        
        log('Tried scrollTo method');
      }
      
      // Method 3: Force with timeout
      setTimeout(() => {
        const finalScrollTop = scrollElement.scrollHeight - scrollElement.clientHeight;
        scrollElement.scrollTop = finalScrollTop;
        
        log('FINAL scroll check', {
          scrollTop: scrollElement.scrollTop,
          scrollHeight: scrollElement.scrollHeight,
          clientHeight: scrollElement.clientHeight,
          actualDistance: scrollElement.scrollHeight - (scrollElement.scrollTop + scrollElement.clientHeight),
          targetScrollTop: finalScrollTop
        });
        
        isAutoScrollingRef.current = false;
        
        // Update state
        setTimeout(() => {
          setIsNearBottom(true);
          if (!force) setShouldAutoScroll(true);
          setHasNewMessages(false);
          log('Debug autoscroll completed');
        }, 50);
      }, 100);
      
    } else {
      log('Skipping autoscroll - user has scrolled up');
    }
  }, [shouldAutoScroll, chatHistory.length, listRef, log]);

  // Detect new messages
  useEffect(() => {
    const newMessageCount = chatHistory.length;
    const hasNewMsg = newMessageCount > lastMessageCountRef.current;
    
    if (hasNewMsg) {
      log('New message detected', { 
        newCount: newMessageCount, 
        oldCount: lastMessageCountRef.current,
        shouldAutoScroll,
        isNearBottom 
      });
      
      if (!shouldAutoScroll && !isNearBottom) {
        setHasNewMessages(true);
        log('Setting hasNewMessages = true');
      } else {
        // Auto scroll for new messages if we should
        scrollToBottom();
      }
    }
    
    lastMessageCountRef.current = newMessageCount;
  }, [chatHistory.length, shouldAutoScroll, isNearBottom, scrollToBottom, log]);

  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Debug effect
  useEffect(() => {
    log('State update', {
      isNearBottom,
      shouldAutoScroll,
      hasNewMessages,
      messageCount: chatHistory.length
    });
  }, [isNearBottom, shouldAutoScroll, hasNewMessages, chatHistory.length, log]);

  return {
    isNearBottom,
    shouldAutoScroll,
    hasNewMessages,
    scrollToBottom,
    handleScroll,
    // Utility functions for external use
    enableAutoScroll: () => {
      log('Manually enabling autoscroll');
      setShouldAutoScroll(true);
      userScrolledRef.current = false;
    },
    disableAutoScroll: () => {
      log('Manually disabling autoscroll');
      setShouldAutoScroll(false);
      userScrolledRef.current = true;
    }
  };
};