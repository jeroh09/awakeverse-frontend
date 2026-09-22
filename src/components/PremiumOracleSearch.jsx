import React, { useState, useEffect } from 'react';
import theme from '../design-system/tokens';

const ORACLE_PROMPTS = [
  "Who do you want to talk to?",
  "Seek wisdom from...",
  "Which guide calls to you?",
  "Find your mentor...",
  "Discover your teacher..."
];

const PremiumOracleSearch = ({
  value,
  onChange,
  onFocus,
  onBlur
}) => {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % ORACLE_PROMPTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Shared base style for the input (identical on both layouts)
  const baseInputStyle = {
    width: '100%',
    padding: '0 24px 0 56px',
    fontSize: theme.typography.sizes.body,
    fontFamily: theme.typography.fonts.body,
    color: theme.colors.text.primary,
    outline: 'none',
    transition: theme.transitions.normal
  };

  // MOBILE — unchanged from the original (rounded pill, outer elevation/glow).
  const mobileInputStyle = {
    ...baseInputStyle,
    height: '52px',
    background: isFocused ? theme.colors.background.peak : theme.colors.background.interactive,
    backdropFilter: 'blur(12px)',
    border: `1px solid ${isFocused ? theme.colors.accent.primary : theme.colors.border.medium}`,
    borderRadius: theme.borderRadius.full,
    boxShadow: isFocused
      ? `${theme.shadows.elevation03}, ${theme.shadows.glow}`
      : theme.shadows.elevation02
  };

  // DESKTOP — inset "milled" input: less-rounded edges, recessed dark fill,
  // inset shadows instead of an outer drop-shadow so it reads imprinted.
  const desktopInputStyle = {
    ...baseInputStyle,
    height: '60px',
    background: isFocused ? '#0A0F1A' : '#0B111F',
    backdropFilter: 'none',
    border: `1px solid ${isFocused ? theme.colors.accent.primary : 'rgba(0,0,0,0.45)'}`,
    borderRadius: theme.borderRadius.md, // less rounded — reads as an input, not a pill
    boxShadow: isFocused
      ? 'inset 0 2px 6px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(99,102,241,0.35)'
      : 'inset 0 2px 4px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(148,163,184,0.05)'
  };

  const inputStyle = isMobile ? mobileInputStyle : desktopInputStyle;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '600px'
    }}>
      <svg
        style={{
          position: 'absolute',
          left: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '24px',
          height: '24px',
          color: isFocused ? theme.colors.accent.primary : theme.colors.text.secondary,
          transition: theme.transitions.normal,
          pointerEvents: 'none',
          zIndex: 2
        }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      <input
        type="text"
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={isMobile ? ORACLE_PROMPTS[placeholderIndex] : ''}
        style={inputStyle}
      />

      <style jsx>{`
        input::placeholder {
          color: ${theme.colors.text.tertiary};
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default PremiumOracleSearch;