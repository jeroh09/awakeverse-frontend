// src/components/UpgradeModal.jsx
import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

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
  triggerReason = 'general', // 'message_limit', 'character_limit', 'general'
  currentUsage = null
}) => {
  const { user } = useUser();

  const [selectedTier, setSelectedTier] = useState('pro');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  // Load current subscription status when opened
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
            payment_provider: 'mock' // TODO: 'stripe' / 'paypal' in production
          })
        }
      );

      const result = await response.json();

      if (result.status === 'success') {
        setSuccess(true);
        // Auto-close after a short delay and refresh subscription state
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

  // When trigger reason changes, gently steer to recommended tier
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

  // ===== SUCCESS STATE (Option A: Ivory + Indigo premium) =====
  if (success) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'radial-gradient(circle at top, rgba(15,23,42,0.96), rgba(0,0,0,0.97))',
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
            background:
              'radial-gradient(circle at top, #111827 0%, #020617 70%)',
            border: '1px solid rgba(148,163,184,0.45)',
            boxShadow:
              '0 24px 60px rgba(15,23,42,0.98), 0 0 40px rgba(99,102,241,0.45)',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '999px',
              margin: '0 auto 1.4rem',
              background:
                'conic-gradient(from 180deg, #6366F1, #818CF8, #E5E7EB, #6366F1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow:
                '0 0 0 2px rgba(15,23,42,1), 0 0 26px rgba(129,140,248,0.7)'
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '999px',
                background: '#020617',
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
              color: '#F5F5DC'
            }}
          >
            Upgrade complete
          </h2>

          <p
            style={{
              margin: '0 0 1.4rem 0',
              fontSize: '0.98rem',
              color: '#CBD5F5'
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
                background: 'rgba(15,23,42,0.9)',
                border: '1px solid rgba(148,163,184,0.5)',
                color: '#E5E7EB',
                fontSize: '0.9rem'
              }}
            >
              <div style={{ marginBottom: '0.25rem' }}>
                New plan:{' '}
                <strong>
                  {SUBSCRIPTION_TIERS[selectedTier].display_name}
                </strong>
              </div>
              <div>
                Characters:{' '}
                <strong>
                  {SUBSCRIPTION_TIERS[selectedTier].character_limit}
                </strong>{' '}
                &nbsp;·&nbsp; Messages:{' '}
                <strong>{SUBSCRIPTION_TIERS[selectedTier].message_limit}</strong>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              window.location.reload();
            }}
            style={{
              border: 'none',
              borderRadius: '999px',
              padding: '0.85rem 1.9rem',
              fontSize: '0.98rem',
              fontWeight: 600,
              cursor: 'pointer',
              background:
                'linear-gradient(135deg, #6366F1 0%, #818CF8 50%, #4F46E5 100%)',
              color: '#F9FAFB',
              boxShadow:
                '0 10px 30px rgba(15,23,42,0.95), 0 0 30px rgba(99,102,241,0.5)'
            }}
          >
            Continue in AwakeVerse
          </button>
        </div>
      </div>
    );
  }

  // ===== MAIN UPGRADE MODAL =====
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background:
          'radial-gradient(circle at top, rgba(15,23,42,0.96), rgba(0,0,0,0.96))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.5rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: '900px',
          width: '100%',
          borderRadius: '20px',
          padding: '2.1rem 2.2rem 2rem',
          background:
            'radial-gradient(circle at top, #111827 0%, #020617 70%)',
          border: '1px solid rgba(148,163,184,0.4)',
          boxShadow:
            '0 24px 60px rgba(15,23,42,0.98), 0 0 40px rgba(15,23,42,0.9)',
          color: '#F9FAFB',
          fontFamily:
            '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1.8rem'
          }}
        >
          <div style={{ paddingRight: '1.5rem', maxWidth: '520px' }}>
            <div
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#94A3B8',
                marginBottom: '0.5rem'
              }}
            >
              AwakeVerse premium
            </div>
            <h2
              style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.7rem',
                letterSpacing: '-0.04em',
                color: '#F5F5DC',
                fontFamily:
                  '"Syne", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
              }}
            >
              {getModalTitle()}
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '0.95rem',
                color: '#CBD5F5',
                lineHeight: 1.6
              }}
            >
              {getModalDescription()}
            </p>
            {currentUsage && (
              <p
                style={{
                  margin: '0.75rem 0 0',
                  fontSize: '0.85rem',
                  color: '#94A3B8'
                }}
              >
                Current usage:{' '}
                <strong style={{ color: '#E5E7EB' }}>
                  {currentUsage.messages_used ?? 0} messages /{' '}
                  {currentUsage.message_limit === -1
                    ? '∞'
                    : currentUsage.message_limit}
                </strong>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Close upgrade panel"
            style={{
              background: 'transparent',
              border: '1px solid rgba(148,163,184,0.6)',
              borderRadius: '999px',
              width: '32px',
              height: '32px',
              color: '#9CA3AF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.6 : 1
            }}
          >
            ×
          </button>
        </div>

        {/* CURRENT PLAN SUMMARY */}
        {currentSubscription && (
          <div
            style={{
              marginBottom: '1.8rem',
              padding: '0.9rem 1rem',
              borderRadius: '12px',
              background: 'rgba(15,23,42,0.9)',
              border: '1px solid rgba(148,163,184,0.4)',
              fontSize: '0.9rem'
            }}
          >
            <div
              style={{
                marginBottom: '0.4rem',
                color: '#E5E7EB',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap'
              }}
            >
              <span>
                Current plan:{' '}
                <strong>{currentSubscription.tier_display}</strong>
              </span>
              {currentSubscription.renews_at && (
                <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                  Renews on{' '}
                  {new Date(
                    currentSubscription.renews_at
                  ).toLocaleDateString()}
                </span>
              )}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.5rem',
                color: '#94A3B8'
              }}
            >
              <div>
                Messages:{' '}
                <strong style={{ color: '#E5E7EB' }}>
                  {currentSubscription.messages_used || 0}/
                  {currentSubscription.message_limit === -1
                    ? '∞'
                    : currentSubscription.message_limit}
                </strong>
              </div>
              <div>
                Characters:{' '}
                <strong style={{ color: '#E5E7EB' }}>
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
                    ? '1px solid rgba(129,140,248,0.9)'
                    : '1px solid rgba(148,163,184,0.4)',
                  background: isSelected
                    ? 'radial-gradient(circle at top, rgba(37,99,235,0.18), rgba(15,23,42,0.98))'
                    : 'rgba(15,23,42,0.95)',
                  boxShadow: isSelected
                    ? '0 10px 30px rgba(15,23,42,0.95), 0 0 24px rgba(129,140,248,0.4)'
                    : '0 4px 14px rgba(15,23,42,0.9)',
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
                        color: '#94A3B8',
                        marginBottom: '0.15rem'
                      }}
                    >
                      {config.display_name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        color: '#E5E7EB'
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
                        border: '1px solid rgba(129,140,248,0.9)',
                        background: 'rgba(15,23,42,0.95)',
                        color: '#E0E7FF'
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
                    color: '#F5F5DC',
                    marginBottom: '0.45rem'
                  }}
                >
                  ${config.price}
                  <span
                    style={{
                      fontSize: '0.85rem',
                      color: '#94A3B8',
                      marginLeft: '0.25rem'
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
                    color: '#CBD5F5',
                    lineHeight: 1.5
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
                      <span style={{ color: '#22C55E' }}>●</span>
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
              background: 'rgba(127,29,29,0.18)',
              border: '1px solid rgba(248,113,113,0.7)',
              color: '#FECACA',
              fontSize: '0.9rem'
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
              border: '1px solid rgba(148,163,184,0.6)',
              borderRadius: '999px',
              color: '#E5E7EB',
              fontSize: '0.9rem',
              fontWeight: 500,
              padding: '0.7rem 1.6rem',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.7 : 1
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
                ? 'rgba(99,102,241,0.6)'
                : 'linear-gradient(135deg,#6366F1,#818CF8)',
              border: 'none',
              borderRadius: '999px',
              color: '#F9FAFB',
              fontSize: '0.95rem',
              fontWeight: 600,
              padding: '0.75rem 1.9rem',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              boxShadow: isProcessing
                ? '0 0 0 rgba(0,0,0,0)'
                : '0 8px 24px rgba(15,23,42,0.95), 0 0 24px rgba(99,102,241,0.5)',
              opacity: isProcessing ? 0.8 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            {isProcessing && (
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '999px',
                  border: '2px solid rgba(226,232,240,0.4)',
                  borderTopColor: '#E5E7EB',
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
