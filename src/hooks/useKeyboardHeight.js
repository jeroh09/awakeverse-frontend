// src/hooks/useKeyboardHeight.js
// Custom hook for detecting mobile keyboard and calculating height offset
// Uses Visual Viewport API for smooth, native keyboard handling

import { useState, useEffect } from 'react';

/**
 * useKeyboardHeight - Detects mobile keyboard and returns height offset
 * 
 * Returns:
 * - keyboardHeight: Number (px) - Current keyboard height
 * - isKeyboardVisible: Boolean - Whether keyboard is currently showing
 * 
 * Example:
 * const { keyboardHeight, isKeyboardVisible } = useKeyboardHeight();
 * 
 * @returns {Object} { keyboardHeight, isKeyboardVisible }
 */
export default function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // DEFENSIVE: Check if Visual Viewport API is available
    if (!window.visualViewport) {
      console.warn('⚠️ Visual Viewport API not available');
      return;
    }

    const viewport = window.visualViewport;

    /**
     * Calculate keyboard height based on viewport changes
     * When keyboard appears, viewport height shrinks
     */
    const handleViewportResize = () => {
      // DEFENSIVE: Ensure viewport still exists
      if (!viewport) return;

      // Calculate the difference between window and viewport height
      // This difference represents the keyboard height
      const windowHeight = window.innerHeight;
      const viewportHeight = viewport.height;
      const offset = viewport.offsetTop || 0;

      // Keyboard is visible when viewport is significantly smaller than window
      const heightDiff = windowHeight - viewportHeight - offset;
      
      // DEFENSIVE: Only consider it a keyboard if diff > 150px
      // (to avoid false positives from browser chrome)
      const threshold = 150;
      const actualKeyboardHeight = heightDiff > threshold ? heightDiff : 0;

      setKeyboardHeight(actualKeyboardHeight);
      setIsKeyboardVisible(actualKeyboardHeight > 0);

      console.log('⌨️ Keyboard detection:', {
        windowHeight,
        viewportHeight,
        offset,
        heightDiff,
        keyboardHeight: actualKeyboardHeight,
        visible: actualKeyboardHeight > 0
      });
    };

    /**
     * Handle viewport scroll (iOS specific)
     * iOS changes offsetTop when keyboard appears
     */
    const handleViewportScroll = () => {
      handleViewportResize(); // Recalculate on scroll
    };

    // Attach listeners
    viewport.addEventListener('resize', handleViewportResize);
    viewport.addEventListener('scroll', handleViewportScroll);

    // Initial check
    handleViewportResize();

    // Cleanup
    return () => {
      if (viewport) {
        viewport.removeEventListener('resize', handleViewportResize);
        viewport.removeEventListener('scroll', handleViewportScroll);
      }
    };
  }, []);

  return {
    keyboardHeight,
    isKeyboardVisible
  };
}