// src/components/UpgradeModal.jsx - UPDATED with Design System
import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

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
    elevation03: '0 4px 16px -4px rgba(0, 0, 0, 0.15), 0 8px 24px -8px rgba(99, 102, 241, 0.15)',
    glow: '0 0 20px -5px rgba(99, 102, 241, 0.2)',
    glowStrong: '0 0 24px -4px rgba(99, 102, 241, 0.3)'
  }
};

// ============================================================================
// SUBSCRIPTION TIERS - Logic unchanged
// ============================================================================
const SUBSCRIPTION_TIERS = {
  starter: {
    name: 'starter',
    display_name: 'Starter',
    price: 9.99,
    character_limit: 5,
    message_limit: 500,
    features: [
      '5 custom characters',
      '500 messages / month',
      'Priority support'
    ]
  },
  pro: {
    name: 'pro',
    display_name: 'Pro',
    price: 19.99,
    character_limit: 15,
    message_limit: 2000,
    features: [
      '15 custom characters',
      '2,000 messages / month',
      'Advanced features',
      'Priority support'
    ]
  }
};

const UpgradeModal = ({
  isOpen,
  onClose,
  triggerReason = 'general',
  currentUsage = null
}) => {
  // ============================================================================
  // STATE MANAGEMENT - All logic unchanged
  // ============================================================================
  const { user } = useUser();

  const [selectedTier, setSelectedTier] = useState('pro');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  // ============================================================================
  // EFFECTS & API HANDLERS - All logic unchanged
  // ============================================================================
  useEffect(() => {
    if (isOpen && user?.id) {
      loadCurrentSubscription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.id]);

  const loadCurrentSubscription = async () => {
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(
        `${API_BASE}/api/premium/user_subscription/${user.id}`,
        {
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data?.subscription) {
          setCurrentSubscription(data.subscription);
        }
      }
    } catch (err) {
      console.warn('Failed to load subscription:', err);
    }
  };

  const handleUpgrade = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const csrf =
        document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';

      const response = await fetch(
        `${API_BASE}/api/premium/subscription/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrf
          },
          credentials: 'include',
          body: JSON.stringify({
            tier_name: selectedTier,
            payment_provider: 'mock'
          })
        }
      );

      const result = await response.json();

      if (result.status === 'success') {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 2000);
      } else {
        setError(result.error || 'Upgrade failed. Please try again.');
      }
    } catch (err) {
      console.error('Upgrade error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRecommendedTier = () => {
    if (triggerReason === 'character_limit') return 'starter';
    if (triggerReason === 'message_limit') return 'pro';
    return 'pro';
  };

  useEffect(() => {
    setSelectedTier(getRecommendedTier());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerReason]);

  const getModalTitle = () => {
    switch (triggerReason) {
      case 'message_limit':
        return 'Message Limit Reached';
      case 'character_limit':
        return 'Character Limit Reached';
      default:
        return 'Upgrade Your Experience';
    }
  };

  const getModalDescription = () => {
    switch (triggerReason) {
      case 'message_limit':
        return "You've reached your monthly message limit. Upgrade to keep your conversations flowing without interruption.";
      case 'character_limit':
        return "You've reached your character creation limit. Upgrade to create more custom characters and expand your worlds.";
      default:
        return 'Unlock the full potential of AwakeVerse with more characters, more messages, and advanced creator tools.';
    }
  };

  if (!isOpen) return null;

  // ============================================================================
  // SUCCESS STATE - Only visual styling updated
  // ============================================================================
  if (success) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10, 15, 26, 0.96)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            borderRadius: '20px',
            padding: '2.4rem 2.2rem 2.1rem',
            background: `linear-gradient(135deg, ${designTokens.colors.background.surface} 0%, ${designTokens.colors.background.canvas} 100%)`,
            border: `1px solid ${designTokens.colors.border.medium}`,
            boxShadow: designTokens.shadows.elevation03,
            textAlign: 'center'
          }}
        >
          {/* Success Icon with Indigo Glow */}
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '999px',
              margin: '0 auto 1.4rem',
              background: `conic-gradient(from 180deg, ${designTokens.colors.accent.primary}, ${designTokens.colors.accent.hover}, ${designTokens.colors.brand.ivory}, ${designTokens.colors.accent.primary})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 0 2px ${designTokens.colors.background.canvas}, ${designTokens.shadows.glow}`
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '999px',
                background: designTokens.colors.background.canvas,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.9rem'
              }}
            >
              ✨
            </div>
          </div>

          <h2
            style={{
              margin: '0 0 0.4rem 0',
              fontSize: '1.8rem',
              letterSpacing: '-0.04em',
              color: designTokens.colors.brand.ivory,
              fontFamily: designTokens.typography.fonts.display,
              fontWeight: 700
            }}
          >
            Upgrade complete
          </h2>

          <p
            style={{
              margin: '0 0 1.4rem 0',
              fontSize: '0.98rem',
              color: designTokens.colors.text.secondary,
              fontFamily: designTokens.typography.fonts.body
            }}
          >
            Your AwakeVerse subscription has been updated. New limits will apply
            to your next conversations and characters.
          </p>

          {selectedTier && SUBSCRIPTION_TIERS[selectedTier] && (
            <div
              style={{
                marginBottom: '1.6rem',
                padding: '0.9rem 1rem',
                borderRadius: '12px',
                background: designTokens.colors.background.interactive,
                border: `1px solid ${designTokens.colors.border.medium}`,
                color: designTokens.colors.text.primary,
                fontSize: '0.9rem',
                fontFamily: designTokens.typography.fonts.body
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '0.3rem', color: designTokens.colors.accent.primary }}>
                {SUBSCRIPTION_TIERS[selectedTier].display_name}
              </div>
              <div style={{ color: designTokens.colors.text.secondary }}>
                ${SUBSCRIPTION_TIERS[selectedTier].price}/month
              </div>
            </div>
          )}

          {/* Auto-close indicator */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              color: designTokens.colors.text.tertiary,
              fontSize: '0.85rem',
              fontFamily: designTokens.typography.fonts.body
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '999px',
                border: `2px solid ${designTokens.colors.border.medium}`,
                borderTopColor: designTokens.colors.accent.primary,
                animation: 'av-upgrade-spin 0.8s linear infinite'
              }}
            />
            <span>Redirecting...</span>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN MODAL - Only visual styling updated
  // ============================================================================
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 15, 26, 0.95)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.5rem'
      }}
    >
      <div
        style={{
          maxWidth: '680px',
          width: '100%',
          borderRadius: '20px',
          padding: '2rem',
          background: `linear-gradient(135deg, ${designTokens.colors.background.canvas} 0%, ${designTokens.colors.background.surface} 50%, ${designTokens.colors.background.canvas} 100%)`,
          border: `1px solid ${designTokens.colors.border.medium}`,
          boxShadow: designTokens.shadows.elevation03
        }}
      >
        {/* HEADER */}
        <div style={{ marginBottom: '1.8rem', textAlign: 'center' }}>
          <h2
            style={{
              margin: '0 0 0.5rem 0',
              fontSize: '2rem',
              letterSpacing: '-0.5px',
              color: designTokens.colors.brand.ivory,
              fontFamily: designTokens.typography.fonts.display,
              fontWeight: 700
            }}
          >
            {getModalTitle()}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '0.95rem',
              color: designTokens.colors.text.secondary,
              fontFamily: designTokens.typography.fonts.body,
              lineHeight: 1.5
            }}
          >
            {getModalDescription()}
          </p>
        </div>

        {/* CURRENT USAGE */}
        {currentUsage && (
          <div
            style={{
              background: designTokens.colors.background.interactive,
              border: `1px solid ${designTokens.colors.accent.primary}40`,
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '0.85rem',
                  color: designTokens.colors.text.tertiary,
                  marginBottom: '0.3rem',
                  fontFamily: designTokens.typography.fonts.body
                }}
              >
                Current Usage
              </div>
              <div
                style={{
                  fontSize: '0.9rem',
                  color: designTokens.colors.text.primary,
                  fontFamily: designTokens.typography.fonts.body
                }}
              >
                {currentUsage}
              </div>
            </div>
          </div>
        )}

        {/* CURRENT SUBSCRIPTION */}
        {currentSubscription && (
          <div
            style={{
              background: designTokens.colors.background.interactive,
              border: `1px solid ${designTokens.colors.border.medium}`,
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.8rem'
            }}
          >
            <div
              style={{
                fontSize: '0.85rem',
                color: designTokens.colors.text.tertiary,
                marginBottom: '0.5rem',
                fontFamily: designTokens.typography.fonts.body,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              Current Plan
            </div>
            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: designTokens.colors.accent.primary,
                marginBottom: '0.75rem',
                fontFamily: designTokens.typography.fonts.display
              }}
            >
              {currentSubscription.tier_name?.toUpperCase() || 'FREE'}
            </div>
            <div
              style={{
                display: 'flex',
                gap: '1.5rem',
                fontSize: '0.85rem',
                color: designTokens.colors.text.secondary,
                fontFamily: designTokens.typography.fonts.body
              }}
            >
              <div>
                Messages:{' '}
                <strong style={{ color: designTokens.colors.text.primary }}>
                  {currentSubscription.messages_used || 0}/
                  {currentSubscription.message_limit === -1
                    ? '∞'
                    : currentSubscription.message_limit}
                </strong>
              </div>
              <div>
                Characters:{' '}
                <strong style={{ color: designTokens.colors.text.primary }}>
                  {currentSubscription.characters_used || 0}/
                  {currentSubscription.character_limit === -1
                    ? '∞'
                    : currentSubscription.character_limit}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* TIER SELECTION */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.2rem',
            marginBottom: '1.8rem'
          }}
        >
          {Object.entries(SUBSCRIPTION_TIERS).map(([tierKey, config]) => {
            const isSelected = selectedTier === tierKey;
            const recommended = tierKey === getRecommendedTier();

            return (
              <button
                key={tierKey}
                type="button"
                onClick={() => setSelectedTier(tierKey)}
                disabled={isProcessing}
                style={{
                  textAlign: 'left',
                  borderRadius: '16px',
                  padding: '1.1rem 1.1rem 1rem',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  border: isSelected
                    ? `2px solid ${designTokens.colors.accent.primary}`
                    : `1px solid ${designTokens.colors.border.medium}`,
                  background: isSelected
                    ? `linear-gradient(135deg, ${designTokens.colors.background.interactive} 0%, ${designTokens.colors.background.peak} 100%)`
                    : designTokens.colors.background.surface,
                  boxShadow: isSelected ? designTokens.shadows.glow : 'none',
                  opacity: isProcessing ? 0.7 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.6rem',
                    gap: '0.5rem'
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        color: designTokens.colors.text.tertiary,
                        marginBottom: '0.15rem',
                        fontFamily: designTokens.typography.fonts.body
                      }}
                    >
                      {config.display_name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        color: designTokens.colors.text.secondary,
                        fontFamily: designTokens.typography.fonts.body
                      }}
                    >
                      For active creators
                    </div>
                  </div>
                  {recommended && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        padding: '0.15rem 0.55rem',
                        borderRadius: '999px',
                        border: `1px solid ${designTokens.colors.accent.primary}`,
                        background: designTokens.colors.background.canvas,
                        color: designTokens.colors.accent.hover,
                        fontFamily: designTokens.typography.fonts.body,
                        fontWeight: 600
                      }}
                    >
                      Recommended
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: designTokens.colors.brand.ivory,
                    marginBottom: '0.45rem',
                    fontFamily: designTokens.typography.fonts.display
                  }}
                >
                  ${config.price}
                  <span
                    style={{
                      fontSize: '0.85rem',
                      color: designTokens.colors.text.tertiary,
                      marginLeft: '0.25rem',
                      fontFamily: designTokens.typography.fonts.body,
                      fontWeight: 400
                    }}
                  >
                    /month
                  </span>
                </div>

                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    fontSize: '0.85rem',
                    color: designTokens.colors.text.secondary,
                    lineHeight: 1.5,
                    fontFamily: designTokens.typography.fonts.body
                  }}
                >
                  {config.features.map((feature, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        marginBottom: '0.35rem'
                      }}
                    >
                      <span style={{ color: designTokens.colors.semantic.success }}>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div
            style={{
              marginBottom: '1.1rem',
              padding: '0.75rem 0.9rem',
              borderRadius: '10px',
              background: `${designTokens.colors.semantic.error}15`,
              border: `1px solid ${designTokens.colors.semantic.error}40`,
              color: designTokens.colors.semantic.error,
              fontSize: '0.9rem',
              fontFamily: designTokens.typography.fonts.body
            }}
          >
            {error}
          </div>
        )}

        {/* ACTIONS */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.8rem',
            alignItems: 'center'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            style={{
              background: 'transparent',
              border: `1px solid ${designTokens.colors.border.medium}`,
              borderRadius: '999px',
              color: designTokens.colors.text.secondary,
              fontSize: '0.9rem',
              fontWeight: 500,
              fontFamily: designTokens.typography.fonts.body,
              padding: '0.7rem 1.6rem',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.borderColor = designTokens.colors.accent.primary;
                e.currentTarget.style.color = designTokens.colors.accent.primary;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = designTokens.colors.border.medium;
              e.currentTarget.style.color = designTokens.colors.text.secondary;
            }}
          >
            Not now
          </button>

          <button
            type="button"
            onClick={handleUpgrade}
            disabled={isProcessing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              background: isProcessing
                ? `${designTokens.colors.accent.primary}80`
                : `linear-gradient(135deg, ${designTokens.colors.accent.primary}, ${designTokens.colors.accent.hover})`,
              border: 'none',
              borderRadius: '999px',
              color: designTokens.colors.text.primary,
              fontSize: '0.95rem',
              fontWeight: 600,
              fontFamily: designTokens.typography.fonts.body,
              padding: '0.75rem 1.9rem',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              boxShadow: isProcessing ? 'none' : designTokens.shadows.glow,
              opacity: isProcessing ? 0.8 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = designTokens.shadows.glowStrong;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = designTokens.shadows.glow;
            }}
          >
            {isProcessing && (
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '999px',
                  border: `2px solid ${designTokens.colors.text.secondary}`,
                  borderTopColor: designTokens.colors.text.primary,
                  animation: 'av-upgrade-spin 0.8s linear infinite'
                }}
              />
            )}
            <span>{isProcessing ? 'Processing...' : 'Upgrade now'}</span>
          </button>
        </div>

        {/* Local keyframes for spinner */}
        <style>
          {`
            @keyframes av-upgrade-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default UpgradeModal;