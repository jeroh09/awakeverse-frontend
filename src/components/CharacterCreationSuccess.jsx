// src/components/CharacterCreationSuccess.jsx - Updated with Design System
import React, { useState, useEffect, useRef } from 'react';
import useCharacterCreationFlow from '../hooks/useCharacterCreationFlow';

// ============================================================================
// DESIGN SYSTEM TOKENS - Defensive Hybrid Approach
// ============================================================================
const designTokens = {
  colors: {
    background: {
      canvas: '#0A0F1A',
      surface: '#141B2E',
      interactive: '#1C2640',
      peak: '#243152'
    },
    accent: {
      primary: '#6366F1',
      hover: '#818CF8',
      glow: 'rgba(99, 102, 241, 0.2)',
      glowStrong: 'rgba(99, 102, 241, 0.3)'
    },
    brand: {
      ivory: '#F5F5DC',
      ivoryDim: '#E5E5CC'
    },
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444'
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
  },
  typography: {
    fonts: {
      display: "'Syne', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      body: "'Inter', system-ui, sans-serif"
    }
  },
  shadows: {
    elevation03: '0 4px 16px -4px rgba(0, 0, 0, 0.15), 0 8px 24px -8px rgba(99, 102, 241, 0.15)',
    glow: '0 0 20px -5px rgba(99, 102, 241, 0.2)',
    glowStrong: '0 0 24px -4px rgba(99, 102, 241, 0.3)'
  }
};

const CharacterCreationSuccess = ({ onClose, characterData }) => {
  // ============================================================================
  // STATE & REFS - All logic unchanged
  // ============================================================================
  const { createdCharacter, closeFlow } = useCharacterCreationFlow();
  const [redirectTimer, setRedirectTimer] = useState(5);
  const [isMobile, setIsMobile] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);

  const characterInfo = createdCharacter || characterData;

  // ============================================================================
  // EFFECTS - All logic unchanged
  // ============================================================================
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const updateTimer = () => {
      if (!isMountedRef.current) return;
      
      setRedirectTimer(prev => {
        const newValue = prev - 1;
        if (newValue <= 0 && !hasUserInteracted) {
          handleManualReturn();
        }
        return Math.max(0, newValue);
      });
    };

    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [hasUserInteracted]);

  // ============================================================================
  // HANDLERS - All logic unchanged
  // ============================================================================
  const handleManualReturn = () => {
    setHasUserInteracted(true);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    closeFlow();
    if (onClose) onClose();
  };

  const displayName = characterInfo?.display_name || characterData?.display_name || 'Your Character';

  // ============================================================================
  // RENDER - Only visual styling updated
  // ============================================================================
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      background: `linear-gradient(135deg, ${designTokens.colors.background.canvas} 0%, ${designTokens.colors.background.surface} 25%, ${designTokens.colors.background.interactive} 50%, ${designTokens.colors.background.surface} 75%, ${designTokens.colors.background.canvas} 100%)`,
      fontFamily: designTokens.typography.fonts.body,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1rem' : '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements - Updated to indigo */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '100px',
        height: '100px',
        background: `radial-gradient(circle, ${designTokens.colors.accent.glow} 0%, transparent 70%)`,
        borderRadius: '50%',
        animation: 'pulse 4s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '15%',
        width: '60px',
        height: '60px',
        background: `radial-gradient(circle, ${designTokens.colors.accent.glow} 0%, transparent 70%)`,
        borderRadius: '50%',
        animation: 'pulse 3s ease-in-out infinite 1s'
      }} />

      <div style={{
        background: `${designTokens.colors.background.surface}CC`,
        border: `2px solid ${designTokens.colors.accent.primary}60`,
        borderRadius: '20px',
        padding: isMobile ? '2rem' : '3rem',
        textAlign: 'center',
        maxWidth: isMobile ? '350px' : '500px',
        width: '100%',
        backdropFilter: 'blur(20px)',
        animation: 'fadeInScale 0.6s ease-out',
        position: 'relative',
        zIndex: 1,
        boxShadow: designTokens.shadows.elevation03
      }}>
        {/* Success Icon - Updated styling */}
        <div style={{
          fontSize: isMobile ? '3rem' : '4rem',
          marginBottom: '1rem',
          filter: `drop-shadow(0 0 20px ${designTokens.colors.accent.primary}80)`,
          animation: 'bounce 2s ease-in-out infinite'
        }}>
          ✨
        </div>
        
        {/* Success Message - Updated colors and fonts */}
        <h2 style={{
          color: designTokens.colors.brand.ivory,
          fontSize: isMobile ? '1.5rem' : '1.8rem',
          margin: '0 0 1rem 0',
          fontFamily: designTokens.typography.fonts.display,
          fontWeight: 700,
          letterSpacing: '-0.5px'
        }}>
          Character Submitted Successfully!
        </h2>
        
        {/* Character Name - Updated colors */}
        <p style={{
          color: designTokens.colors.text.primary,
          fontSize: isMobile ? '1rem' : '1.1rem',
          lineHeight: 1.6,
          margin: '0 0 1.5rem 0',
          fontFamily: designTokens.typography.fonts.body
        }}>
          <strong style={{ 
            color: designTokens.colors.accent.primary,
            fontWeight: 600
          }}>
            {displayName}
          </strong> has been submitted for approval. 
          You'll receive an email notification when your character is ready to chat.
        </p>
        
        {/* Message Limit Information - Updated to indigo theme */}
        <div style={{
          background: `${designTokens.colors.accent.primary}15`,
          border: `1px solid ${designTokens.colors.accent.primary}40`,
          borderRadius: '12px',
          padding: isMobile ? '0.8rem' : '1rem',
          margin: '0 0 2rem 0'
        }}>
          <p style={{
            color: designTokens.colors.accent.hover,
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
            fontFamily: designTokens.typography.fonts.body
          }}>
            <span style={{ fontSize: '1.2rem' }}>🎉</span>
            Your character comes with 150 free messages per month
          </p>
        </div>
        
        {/* Action Button - Updated to indigo gradient */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={handleManualReturn}
            style={{
              background: `linear-gradient(135deg, ${designTokens.colors.accent.primary}, ${designTokens.colors.accent.hover})`,
              border: 'none',
              borderRadius: '12px',
              color: designTokens.colors.text.primary,
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: 600,
              fontFamily: designTokens.typography.fonts.body,
              padding: isMobile ? '0.7rem 1.5rem' : '0.8rem 2rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: designTokens.shadows.glow,
              width: isMobile ? '100%' : 'auto',
              minWidth: '150px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = designTokens.shadows.glowStrong;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = designTokens.shadows.glow;
            }}
          >
            Return to Characters
          </button>
        </div>

        {/* Auto-redirect notice - Updated colors */}
        {!hasUserInteracted && redirectTimer > 0 && (
          <div style={{
            background: designTokens.colors.background.interactive,
            borderRadius: '8px',
            padding: '0.8rem',
            border: `1px solid ${designTokens.colors.border.medium}`
          }}>
            <p style={{
              color: designTokens.colors.text.secondary,
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontFamily: designTokens.typography.fonts.body
            }}>
              <span style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                border: `2px solid ${designTokens.colors.accent.primary}40`,
                borderTop: `2px solid ${designTokens.colors.accent.primary}`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Auto-redirecting in {redirectTimer} second{redirectTimer !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => setHasUserInteracted(true)}
              style={{
                background: 'none',
                border: 'none',
                color: designTokens.colors.accent.hover,
                fontSize: '0.7rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                marginTop: '0.5rem',
                fontFamily: designTokens.typography.fonts.body
              }}
            >
              Cancel auto-redirect
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInScale {
          from { 
            opacity: 0; 
            transform: scale(0.9) translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
        
        @keyframes pulse {
          0%, 100% { 
            opacity: 0.3; 
            transform: scale(1); 
          }
          50% { 
            opacity: 0.6; 
            transform: scale(1.1); 
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CharacterCreationSuccess;