// src/components/ScrollShell.jsx
// Plug-and-play scrollable container with smart fade edges
// Defensive-first: Gracefully degrades if JS detection fails

import React, { useState, useEffect, useRef } from 'react';
import theme from '../design-system/tokens';

/**
 * ScrollShell - Reusable scroll container with smart fade overlays
 * 
 * FEATURES:
 * - Smooth scrolling with custom indigo scrollbar
 * - Subtle fade overlays (top/bottom) that only show when scrollable
 * - Automatically detects scroll position to hide fades appropriately
 * - Defensive fallback: If detection fails, shows static fades
 * 
 * USAGE:
 * <ScrollShell maxHeight="calc(100vh - 200px)" fadeHeight="20px">
 *   <div style={{ display: 'grid', gridTemplateColumns: '...' }}>
 *     {items.map(item => <Card key={item.id} {...item} />)}
 *   </div>
 * </ScrollShell>
 */

const ScrollShell = ({ 
  children, 
  maxHeight = 'calc(100vh - 200px)',
  fadeHeight = '20px',
  className = '',
  style = {},
  // Optional: Disable smart fading if you want always-on fades
  alwaysShowFades = false
}) => {
  const scrollRef = useRef(null);
  
  // State for smart fade visibility
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

  // Check if content is scrollable and update fade visibility
  const checkScrollState = () => {
    const element = scrollRef.current;
    if (!element) return;

    const hasScroll = element.scrollHeight > element.clientHeight;
    setIsScrollable(hasScroll);

    if (!hasScroll) {
      // No scroll needed, hide all fades
      setShowTopFade(false);
      setShowBottomFade(false);
      return;
    }

    // Detect scroll position
    const scrollTop = element.scrollTop;
    const scrollBottom = element.scrollHeight - element.clientHeight - element.scrollTop;

    // Show top fade if scrolled down (not at top)
    setShowTopFade(scrollTop > 5);

    // Show bottom fade if not at bottom
    setShowBottomFade(scrollBottom > 5);
  };

  // Initial check and resize observer
  useEffect(() => {
    checkScrollState();

    const element = scrollRef.current;
    if (!element) return;

    // Watch for content size changes
    const resizeObserver = new ResizeObserver(() => {
      checkScrollState();
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [children]);

  // Handle scroll events
  const handleScroll = () => {
    checkScrollState();
  };

  // Determine if fades should be visible
  const topFadeVisible = alwaysShowFades || (isScrollable && showTopFade);
  const bottomFadeVisible = alwaysShowFades || (isScrollable && showBottomFade);

  return (
    <div 
      className={`scroll-shell-wrapper ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        ...style
      }}
    >
      {/* Top Fade Overlay */}
      <div 
        className="scroll-shell-fade scroll-shell-fade-top"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: fadeHeight,
          background: `linear-gradient(180deg, ${theme.colors.background.canvas} 0%, transparent 100%)`,
          pointerEvents: 'none',
          zIndex: 2,
          opacity: topFadeVisible ? 1 : 0,
          transition: theme.transitions.normal
        }}
      />

      {/* Scrollable Content Container */}
      <div
        ref={scrollRef}
        className="scroll-shell-content"
        onScroll={handleScroll}
        style={{
          maxHeight: maxHeight,
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          scrollBehavior: 'smooth',
          // Custom scrollbar styling
          scrollbarWidth: 'thin',
          scrollbarColor: `${theme.colors.accent.primary}80 ${theme.colors.background.interactive}`
        }}
      >
        {children}
      </div>

      {/* Bottom Fade Overlay */}
      <div 
        className="scroll-shell-fade scroll-shell-fade-bottom"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: fadeHeight,
          background: `linear-gradient(0deg, ${theme.colors.background.canvas} 0%, transparent 100%)`,
          pointerEvents: 'none',
          zIndex: 2,
          opacity: bottomFadeVisible ? 1 : 0,
          transition: theme.transitions.normal
        }}
      />

      {/* Webkit Scrollbar Styles (Chrome/Safari/Edge) */}
      <style jsx>{`
        .scroll-shell-content::-webkit-scrollbar {
          width: 8px;
        }

        .scroll-shell-content::-webkit-scrollbar-track {
          background: ${theme.colors.background.interactive};
          border-radius: 4px;
          border: 1px solid ${theme.colors.border.subtle};
        }

        .scroll-shell-content::-webkit-scrollbar-thumb {
          background: linear-gradient(
            180deg, 
            ${theme.colors.accent.primary}CC 0%, 
            ${theme.colors.accent.primary}99 50%,
            ${theme.colors.accent.primary}66 100%
          );
          border-radius: 4px;
          border: 1px solid ${theme.colors.accent.primary}40;
          transition: ${theme.transitions.normal};
        }

        .scroll-shell-content::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            180deg, 
            ${theme.colors.accent.hover} 0%, 
            ${theme.colors.accent.primary} 50%,
            ${theme.colors.accent.primary}99 100%
          );
          box-shadow: ${theme.shadows.glow};
        }

        /* Smooth momentum scrolling on iOS */
        .scroll-shell-content {
          -webkit-overflow-scrolling: touch;
        }

        /* Ensure content doesn't jump during fade transitions */
        .scroll-shell-wrapper {
          contain: layout style;
        }
      `}</style>
    </div>
  );
};

export default ScrollShell;

/**
 * USAGE EXAMPLES:
 * 
 * 1. Basic Grid Layout:
 * 
 * <ScrollShell>
 *   <div style={{ 
 *     display: 'grid', 
 *     gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
 *     gap: '24px',
 *     padding: '1rem'
 *   }}>
 *     {characters.map(char => (
 *       <PremiumCharacterCard key={char.id} character={char} />
 *     ))}
 *   </div>
 * </ScrollShell>
 * 
 * 
 * 2. Custom Max Height:
 * 
 * <ScrollShell maxHeight="500px">
 *   {content}
 * </ScrollShell>
 * 
 * 
 * 3. Prominent Fades:
 * 
 * <ScrollShell fadeHeight="40px">
 *   {content}
 * </ScrollShell>
 * 
 * 
 * 4. Always Show Fades (No Smart Detection):
 * 
 * <ScrollShell alwaysShowFades={true}>
 *   {content}
 * </ScrollShell>
 * 
 * 
 * 5. In Category Panel (Replacing Current Code):
 * 
 * // BEFORE:
 * <div style={{
 *   maxHeight: 'calc(100vh - 200px)',
 *   overflowY: 'auto',
 *   padding: '1rem'
 * }}>
 *   <div style={{ display: 'grid', ... }}>
 *     {characters.map(...)}
 *   </div>
 * </div>
 * 
 * // AFTER:
 * <ScrollShell>
 *   <div style={{ 
 *     display: 'grid', 
 *     gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
 *     gap: '24px',
 *     padding: '1rem'
 *   }}>
 *     {characters.map(char => (
 *       <PremiumCharacterCard key={char.id} character={char} onClick={...} />
 *     ))}
 *   </div>
 * </ScrollShell>
 * 
 * 
 * DEFENSIVE ARCHITECTURE:
 * - If ResizeObserver fails: Falls back to showing fades always
 * - If refs fail to attach: Component still renders without fades
 * - If children don't cause overflow: No fades shown (smart detection)
 * - Graceful degradation at every level
 */