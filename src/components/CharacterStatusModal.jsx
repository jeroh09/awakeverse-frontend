// components/CharacterStatusModal.jsx - UPDATED with Design System
import React, { useState } from 'react';
import PaymentProcessor from './PaymentProcessor';

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
      glow: 'rgba(99, 102, 241, 0.2)'
    },
    brand: {
      ivory: '#F5F5DC'
    },
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444'
    },
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
      tertiary: '#64748B'
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
    elevation02: '0 2px 8px -2px rgba(0, 0, 0, 0.1), 0 4px 12px -4px rgba(99, 102, 241, 0.1)',
    glow: '0 0 20px -5px rgba(99, 102, 241, 0.2)'
  }
};

const CharacterStatusModal = ({ character, onClose, onCreateNew }) => {
  // ============================================================================
  // STATE MANAGEMENT - All logic unchanged
  // ============================================================================
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showPaymentProcessor, setShowPaymentProcessor] = useState(false);

  // ============================================================================
  // STATUS CONFIGURATION - Logic unchanged, visual styling updated
  // ============================================================================
  const getStatusConfig = () => {
    switch (character.status) {
      case 'pending':
        return {
          icon: '⏳',
          title: 'Character Under Review',
          color: designTokens.colors.semantic.warning,
          bgColor: `${designTokens.colors.semantic.warning}15`,
          borderColor: `${designTokens.colors.semantic.warning}40`,
          message: `${character.display_name} is being reviewed by our team. You'll receive an email notification when approved.`,
          estimatedTime: 'Usually takes 24-48 hours',
          primaryAction: 'Get Priority Approval',
          secondaryAction: 'Browse Other Characters'
        };
      case 'rejected':
        return {
          icon: '❌',
          title: 'Character Needs Revision',
          color: designTokens.colors.semantic.error,
          bgColor: `${designTokens.colors.semantic.error}15`,
          borderColor: `${designTokens.colors.semantic.error}40`,
          message: character.rejection_reason || 'Your character submission needs adjustments before approval.',
          estimatedTime: 'Create a new character addressing the feedback',
          primaryAction: 'Create New Character',
          secondaryAction: 'Browse Other Characters'
        };
      default:
        return {
          icon: '⚠️',
          title: 'Character Unavailable',
          color: designTokens.colors.text.tertiary,
          bgColor: `${designTokens.colors.text.tertiary}15`,
          borderColor: `${designTokens.colors.text.tertiary}40`,
          message: 'This character is not available for chat.',
          estimatedTime: '',
          primaryAction: 'Browse Characters',
          secondaryAction: 'Close'
        };
    }
  };

  const config = getStatusConfig();

  // ============================================================================
  // EVENT HANDLERS - All logic unchanged
  // ============================================================================
  const handlePrimaryAction = () => {
    if (character.status === 'pending') {
      setShowPaymentProcessor(true);
    } else if (character.status === 'rejected') {
      onCreateNew();
    } else {
      onClose();
    }
  };

  const handlePaymentClose = () => {
    setShowPaymentProcessor(false);
  };

  const handlePaymentBack = () => {
    setShowPaymentProcessor(false);
  };

  // ============================================================================
  // UPGRADE OPTIONS - Logic unchanged, visual styling updated
  // ============================================================================
  const upgradeOptions = [
    {
      tier: 'Creator',
      price: '£6.99/month',
      benefits: [
        'Priority 12-hour approval',
        '15 custom characters',
        '2000 messages/month',
        'Access to Monetisation'
      ],
      recommended: true
    },
    {
      tier: 'Professional',
      price: '£11.99/month',
      benefits: [
        'Instant approval',
        'Unlimited characters',
        'Unlimited messages',
        'Priority support',
        'Access to Monetisation'
      ]
    }
  ];

  // ============================================================================
  // RENDER - Only visual styling updated, structure unchanged
  // ============================================================================
  return (
    <>
      {/* Payment Processor Modal */}
      <PaymentProcessor
        isOpen={showPaymentProcessor}
        onClose={handlePaymentClose}
        onBack={handlePaymentBack}
        triggerReason="character_approval"
      />

      {/* Character Status Modal */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(10, 15, 26, 0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem'
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${designTokens.colors.background.surface} 0%, ${designTokens.colors.background.canvas} 100%)`,
          border: `1px solid ${config.borderColor}`,
          borderRadius: isMobile ? '16px' : '20px',
          padding: isMobile ? '1.5rem' : '2rem',
          width: '100%',
          maxWidth: isMobile ? '400px' : '500px',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: designTokens.shadows.elevation02
        }}>
          {/* Status Icon */}
          <div style={{
            fontSize: isMobile ? '3rem' : '4rem',
            marginBottom: '1rem',
            animation: character.status === 'pending' ? 'pulse 2s infinite' : 'none'
          }}>
            {config.icon}
          </div>
          
          {/* Title */}
          <h2 style={{
            color: config.color,
            fontSize: isMobile ? '1.3rem' : '1.5rem',
            fontWeight: 700,
            margin: '0 0 1rem 0',
            letterSpacing: '-0.02em',
            fontFamily: designTokens.typography.fonts.display
          }}>
            {config.title}
          </h2>
          
          {/* Character Info */}
          <div style={{
            background: config.bgColor,
            border: `1px solid ${config.borderColor}`,
            borderRadius: '12px',
            padding: '1rem',
            margin: '0 0 1.5rem 0'
          }}>
            <h3 style={{
              color: designTokens.colors.accent.primary,
              fontSize: '1.1rem',
              margin: '0 0 0.5rem 0',
              fontFamily: designTokens.typography.fonts.display,
              fontWeight: 600
            }}>
              {character.display_name}
            </h3>
            <p style={{
              color: designTokens.colors.text.secondary,
              fontSize: '0.9rem',
              margin: 0,
              lineHeight: 1.5,
              fontFamily: designTokens.typography.fonts.body
            }}>
              {config.message}
            </p>
            {config.estimatedTime && (
              <p style={{
                color: designTokens.colors.text.tertiary,
                fontSize: '0.8rem',
                margin: '0.5rem 0 0 0',
                fontStyle: 'italic',
                fontFamily: designTokens.typography.fonts.body
              }}>
                {config.estimatedTime}
              </p>
            )}
          </div>

          {/* Upgrade Options for Pending Status */}
          {character.status === 'pending' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{
                color: designTokens.colors.brand.ivory,
                fontSize: '1.1rem',
                margin: '0 0 1rem 0',
                fontFamily: designTokens.typography.fonts.display,
                fontWeight: 600
              }}>
                Skip the Wait
              </h3>
              
              {upgradeOptions.map((option, index) => (
                <div key={index} style={{
                  background: option.recommended 
                    ? `linear-gradient(135deg, ${designTokens.colors.background.interactive}, ${designTokens.colors.background.peak})`
                    : designTokens.colors.background.surface,
                  border: option.recommended 
                    ? `2px solid ${designTokens.colors.accent.primary}` 
                    : `1px solid ${designTokens.colors.border.medium}`,
                  padding: '1rem',
                  borderRadius: '12px',
                  marginBottom: '0.5rem',
                  position: 'relative',
                  boxShadow: option.recommended ? designTokens.shadows.glow : 'none'
                }}>
                  {option.recommended && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '10px',
                      background: `linear-gradient(135deg, ${designTokens.colors.accent.primary}, ${designTokens.colors.accent.hover})`,
                      color: designTokens.colors.text.primary,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      fontFamily: designTokens.typography.fonts.body,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      RECOMMENDED
                    </div>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <div>
                      <div style={{ 
                        fontWeight: 700, 
                        color: designTokens.colors.accent.primary,
                        fontSize: '1rem',
                        fontFamily: designTokens.typography.fonts.display
                      }}>
                        {option.tier}
                      </div>
                      <div style={{ 
                        fontSize: '0.9rem', 
                        color: designTokens.colors.text.secondary,
                        fontFamily: designTokens.typography.fonts.body
                      }}>
                        {option.price}
                      </div>
                    </div>
                  </div>
                  
                  <ul style={{ 
                    margin: '0.5rem 0', 
                    fontSize: '0.8rem',
                    textAlign: 'left',
                    paddingLeft: '1rem',
                    fontFamily: designTokens.typography.fonts.body
                  }}>
                    {option.benefits.map((benefit, i) => (
                      <li key={i} style={{ 
                        color: designTokens.colors.text.secondary,
                        marginBottom: '0.3rem'
                      }}>
                        <span style={{ color: designTokens.colors.semantic.success }}>✓</span> {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Rejection Details */}
          {character.status === 'rejected' && character.rejection_reason && (
            <div style={{
              background: `${designTokens.colors.semantic.error}15`,
              border: `1px solid ${designTokens.colors.semantic.error}40`,
              borderRadius: '12px',
              padding: '1rem',
              margin: '0 0 1.5rem 0',
              textAlign: 'left'
            }}>
              <h4 style={{
                color: designTokens.colors.semantic.error,
                fontSize: '0.9rem',
                margin: '0 0 0.5rem 0',
                fontFamily: designTokens.typography.fonts.display,
                fontWeight: 600
              }}>
                Feedback for Improvement:
              </h4>
              <p style={{
                color: designTokens.colors.text.secondary,
                fontSize: '0.85rem',
                margin: 0,
                lineHeight: 1.4,
                fontFamily: designTokens.typography.fonts.body
              }}>
                {character.rejection_reason}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'center',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <button
              onClick={handlePrimaryAction}
              style={{
                background: character.status === 'pending' 
                  ? `linear-gradient(135deg, ${designTokens.colors.accent.primary}, ${designTokens.colors.accent.hover})`
                  : character.status === 'rejected'
                  ? `linear-gradient(135deg, ${designTokens.colors.semantic.success}, #059669)`
                  : designTokens.colors.background.interactive,
                border: 'none',
                borderRadius: '12px',
                color: designTokens.colors.text.primary,
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 600,
                fontFamily: designTokens.typography.fonts.body,
                padding: isMobile ? '0.8rem 1.5rem' : '0.75rem 1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                flex: 1,
                boxShadow: character.status === 'pending' ? designTokens.shadows.glow : 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = character.status === 'pending' 
                  ? '0 6px 20px rgba(99, 102, 241, 0.4)'
                  : '0 4px 15px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = character.status === 'pending' 
                  ? designTokens.shadows.glow 
                  : 'none';
              }}
            >
              {config.primaryAction}
            </button>
            
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: `1px solid ${designTokens.colors.border.medium}`,
                borderRadius: '12px',
                color: designTokens.colors.text.secondary,
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 600,
                fontFamily: designTokens.typography.fonts.body,
                padding: isMobile ? '0.8rem 1.5rem' : '0.75rem 1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                flex: 1
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = designTokens.colors.accent.primary;
                e.currentTarget.style.color = designTokens.colors.accent.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = designTokens.colors.border.medium;
                e.currentTarget.style.color = designTokens.colors.text.secondary;
              }}
            >
              {config.secondaryAction}
            </button>
          </div>

          {/* Helper Text */}
          <p style={{
            color: designTokens.colors.text.tertiary,
            fontSize: '0.75rem',
            margin: '1rem 0 0 0',
            fontStyle: 'italic',
            fontFamily: designTokens.typography.fonts.body
          }}>
            {character.status === 'pending' 
              ? 'While you wait, explore our existing character library'
              : character.status === 'rejected'
              ? 'Address the feedback above in your next character creation'
              : 'Browse our available characters to start chatting'
            }
          </p>
        </div>

        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.05); }
          }
        `}</style>
      </div>
    </>
  );
};

export default CharacterStatusModal;