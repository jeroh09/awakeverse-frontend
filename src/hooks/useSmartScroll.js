// src/hooks/useSmartScroll.js
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

  // Debounced scroll position checker
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
      
      // Calculate distance from bottom
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      const nearBottom = distanceFromBottom <= NEAR_BOTTOM_THRESHOLD;
      
      // Detect if user manually scrolled up
      const scrolledUp = scrollTop < lastScrollTopRef.current - 5; // 5px tolerance
      
      log('Scroll position check', {
        scrollTop,
        scrollHeight,
        clientHeight,
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

  // Smart scroll to bottom function
  const scrollToBottom = useCallback((force = false) => {
    if (!listRef.current) {
      log('Cannot scroll - no listRef');
      return;
    }
    
    if (force || shouldAutoScroll) {
      log('Scrolling to bottom', { force, shouldAutoScroll });
      isAutoScrollingRef.current = true;
      
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        if (listRef.current) {
          listRef.current.resetAfterIndex(0);
          const lastIndex = Math.max(0, chatHistory.length - 1);
          
          listRef.current.scrollToItem(lastIndex, 'end');
          
          // Double-check scroll after a brief delay
          setTimeout(() => {
            if (listRef.current) {
              listRef.current.scrollToItem(lastIndex, 'end');
              isAutoScrollingRef.current = false;
              
              // Update state after autoscroll completes
              setTimeout(() => {
                setIsNearBottom(true);
                if (!force) setShouldAutoScroll(true);
                setHasNewMessages(false);
                log('Autoscroll completed');
              }, 50);
            }
          }, 100);
        }
      });
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