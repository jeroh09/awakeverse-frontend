// src/design-system/tokens.js
// AwakeVerse Premium Design System - Tech Meets History

export const colors = {
  background: {
    canvas: '#0A0F1A',      // Main background (warmer)
    surface: '#141B2E',     // Cards, panels
    interactive: '#1C2640', // Hover states
    peak: '#243152'         // Active/selected
  },

  accent: {
    primary: '#6366F1',     // Indigo (replaces gold)
    hover: '#818CF8',       // Lighter indigo
    glow: 'rgba(99, 102, 241, 0.2)',
    glowStrong: 'rgba(99, 102, 241, 0.3)'
  },

  brand: {
    ivory: '#F5F5DC',       // AwakeVerse logo color
    ivoryDim: '#E5E5CC'     // Dimmed ivory for subtle text
  },

  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  },

  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    tertiary: '#64748B',
    muted: '#475569'
  },

  border: {
    subtle: 'rgba(148, 163, 184, 0.1)',
    medium: 'rgba(148, 163, 184, 0.2)',
    strong: 'rgba(148, 163, 184, 0.3)'
  }
};

export const typography = {
  fonts: {
    display: "'Syne', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    body: "'Inter', system-ui, sans-serif"
  },

  sizes: {
    display: '48px',
    h1: '36px',
    h2: '30px',
    h3: '24px',
    h4: '20px',
    bodyLarge: '18px',
    body: '16px',
    bodySmall: '14px',
    caption: '12px'
  },

  lineHeights: {
    display: '56px',
    h1: '44px',
    h2: '38px',
    h3: '32px',
    h4: '28px',
    bodyLarge: '28px',
    body: '24px',
    bodySmall: '22px',
    caption: '18px'
  },

  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }
};

export const shadows = {
  elevation01: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  elevation02: '0 2px 8px -2px rgba(0, 0, 0, 0.1), 0 4px 12px -4px rgba(99, 102, 241, 0.1)',
  elevation03: '0 4px 16px -4px rgba(0, 0, 0, 0.15), 0 8px 24px -8px rgba(99, 102, 241, 0.15)',
  elevation04: '0 8px 32px -8px rgba(0, 0, 0, 0.2), 0 16px 48px -12px rgba(99, 102, 241, 0.2)',
  elevationInner: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.1)',
  glow: '0 0 20px -5px rgba(99, 102, 241, 0.2)',
  glowStrong: '0 0 24px -4px rgba(99, 102, 241, 0.3)'
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px'
};

export const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  full: '9999px'
};

export const transitions = {
  fast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  normal: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  slow: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
};

export const theme = {
  colors,
  typography,
  shadows,
  spacing,
  borderRadius,
  transitions
};

export default theme;