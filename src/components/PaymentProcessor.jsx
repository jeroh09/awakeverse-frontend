// src/components/PaymentProcessor.jsx - UPDATED with Design System
import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import PaymentRouter from '../services/PaymentRouter';

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
      primary: '#6366F1',      // Indigo (not gold!)
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
    display_name: 'EXPLORER',
    tagline: 'Start Your Journey',
    prices: {
      GBP: { amount: 10.99, symbol: '£', display: '£10.99' },
      USD: { amount: 13.99, symbol: '$', display: '$13.99' },
      EUR: { amount: 12.99, symbol: '€', display: '€12.99' }
    },
    character_limit: 0,
    message_limit: 2000,
    features: [
      'Basic chat access',
      'Rate-limited usage',
      'Browse marketplace',
      'Engage with characters'
    ],
    popular: false
  },
  pro: {
    name: 'pro',
    display_name: 'CREATOR',
    tagline: 'Build & Earn',
    prices: {
      GBP: { amount: 19.99, symbol: '£', display: '£19.99' },
      USD: { amount: 24.99, symbol: '$', display: '$24.99' },
      EUR: { amount: 22.99, symbol: '€', display: '€22.99' }
    },
    character_limit: -1,
    message_limit: -1,
    features: [
      'Unlimited chats & scenarios',
      'Character creation tools',
      'Marketplace publishing',
      '60/40 revenue share',
      'Standard AI models',
      'Basic analytics'
    ],
    popular: true
  },
  unlimited: {
    name: 'unlimited',
    display_name: 'PROFESSIONAL',
    tagline: 'Go Pro & Scale',
    prices: {
      GBP: { amount: 29.99, symbol: '£', display: '£29.99' },
      USD: { amount: 37.99, symbol: '$', display: '$37.99' },
      EUR: { amount: 34.99, symbol: '€', display: '€34.99' }
    },
    character_limit: -1,
    message_limit: -1,
    features: [
      'Everything in Creator',
      'Advanced multi-character designer',
      'Featured marketplace placement',
      '80/20 revenue share',
      'Live debate hosting',
      'Advanced analytics',
      'Priority AI models',
      'Commercial rights',
      'Priority support'
    ],
    popular: false
  }
};

// Helper to detect user's currency - Logic unchanged
const getUserCurrency = () => {
  try {
    const savedCurrency = localStorage.getItem('preferred_currency');
    if (savedCurrency && ['GBP', 'USD', 'EUR'].includes(savedCurrency)) {
      return savedCurrency;
    }
    
    const locale = navigator.language || 'en-GB';
    if (locale.includes('US')) return 'USD';
    if (locale.includes('GB') || locale.includes('UK')) return 'GBP';
    if (locale.includes('EU') || locale.includes('FR') || locale.includes('DE')) return 'EUR';
    
    return 'GBP';
  } catch (e) {
    return 'GBP';
  }
};

const PaymentProcessor = ({ 
  isOpen, 
  onClose, 
  triggerReason = 'general',
  currentUsage = null,
  onBack = null
}) => {
  // ============================================================================
  // STATE MANAGEMENT - All logic unchanged
  // ============================================================================
  const { user } = useUser();
  
  const [selectedTier, setSelectedTier] = useState('pro');
  const [selectedCurrency, setSelectedCurrency] = useState('GBP');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProvider, setProcessingProvider] = useState(null);
  const [error, setError] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  useEffect(() => {
    setSelectedCurrency(getUserCurrency());
  }, []);

  useEffect(() => {
    if (isOpen && user?.id) {
      loadCurrentSubscription();
    }
  }, [isOpen, user?.id]);

  useEffect(() => {
    if (triggerReason === 'character_limit') {
      setSelectedTier('starter');
    } else if (triggerReason === 'message_limit') {
      setSelectedTier('pro');
    }
  }, [triggerReason]);

  // ============================================================================
  // API HANDLERS - All logic unchanged
  // ============================================================================
  const loadCurrentSubscription = async () => {
    try {
      const env = PaymentRouter.getEnvironment();
      const response = await fetch(`${env.apiBase}/api/premium/user_subscription/${user.id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentSubscription(data.subscription);
      }
    } catch (error) {
      console.warn('Failed to load subscription:', error);
    }
  };

  const handleStripeCheckout = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setProcessingProvider('stripe');
    setError(null);

    try {
      console.log('🔄 Starting payment redirect via PaymentRouter...');
      
      await PaymentRouter.redirectToCheckout({
        tier: selectedTier,
        currency: selectedCurrency,
        provider: 'stripe',
        triggerSource: triggerReason || 'payment_modal',
        metadata: {
          currentUsage: currentUsage,
          timestamp: new Date().toISOString()
        }
      });
      
      console.warn('⚠️ Redirect did not occur - user still on page');
      setIsProcessing(false);
      setProcessingProvider(null);
      
    } catch (error) {
      console.error('❌ Payment error:', error);
      setError(error.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
      setProcessingProvider(null);
    }
  };

  const handlePayPalCheckout = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setProcessingProvider('paypal');
    setError(null);

    try {
      console.log('🔄 Starting PayPal redirect via PaymentRouter...');
      
      await PaymentRouter.redirectToCheckout({
        tier: selectedTier,
        currency: selectedCurrency,
        provider: 'paypal',
        triggerSource: triggerReason || 'payment_modal',
        metadata: {
          currentUsage: currentUsage,
          timestamp: new Date().toISOString()
        }
      });
      
      console.warn('⚠️ Redirect did not occur - user still on page');
      setIsProcessing(false);
      setProcessingProvider(null);
      
    } catch (error) {
      console.error('❌ PayPal error:', error);
      setError(error.message || 'PayPal payment failed. Please try again.');
      setIsProcessing(false);
      setProcessingProvider(null);
    }
  };

  const getPriceDisplay = (tier) => {
    const priceData = SUBSCRIPTION_TIERS[tier].prices[selectedCurrency];
    return priceData ? priceData.display : '£0.00';
  };

  if (!isOpen) return null;

  // ============================================================================
  // RENDER - Only visual styling updated, structure unchanged
  // ============================================================================
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(10, 15, 26, 0.95)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        background: `linear-gradient(135deg, ${designTokens.colors.background.canvas} 0%, ${designTokens.colors.background.surface} 50%, ${designTokens.colors.background.canvas} 100%)`,
        border: `1px solid ${designTokens.colors.border.medium}`,
        borderRadius: '20px',
        padding: '2rem',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: designTokens.shadows.elevation03
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '2rem',
              fontFamily: designTokens.typography.fonts.display,
              color: designTokens.colors.brand.ivory,
              letterSpacing: '-0.5px'
            }}>
              Choose Your Plan
            </h2>
            <p style={{
              margin: '0.5rem 0 0 0',
              color: designTokens.colors.text.secondary,
              fontSize: '0.95rem',
              fontFamily: designTokens.typography.fonts.body
            }}>
              Unlock unlimited conversations with history's greatest minds
            </p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'transparent',
                border: `1px solid ${designTokens.colors.border.medium}`,
                borderRadius: '8px',
                color: designTokens.colors.text.secondary,
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontFamily: designTokens.typography.fonts.body,
                transition: 'all 0.2s ease'
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
              ← Back
            </button>
          )}
        </div>

        {/* Currency Selector */}
        <div style={{
          marginBottom: '2rem',
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {['GBP', 'USD', 'EUR'].map(currency => (
            <button
              key={currency}
              onClick={() => setSelectedCurrency(currency)}
              style={{
                background: selectedCurrency === currency 
                  ? designTokens.colors.accent.primary
                  : designTokens.colors.background.interactive,
                border: selectedCurrency === currency
                  ? `1px solid ${designTokens.colors.accent.primary}`
                  : `1px solid ${designTokens.colors.border.medium}`,
                borderRadius: '8px',
                color: selectedCurrency === currency
                  ? designTokens.colors.text.primary
                  : designTokens.colors.text.secondary,
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontFamily: designTokens.typography.fonts.body,
                fontWeight: 500,
                transition: 'all 0.2s ease',
                boxShadow: selectedCurrency === currency ? designTokens.shadows.glow : 'none'
              }}
            >
              {currency}
            </button>
          ))}
        </div>

        {/* Context Message */}
        {triggerReason !== 'general' && (
          <div style={{
            background: designTokens.colors.background.interactive,
            border: `1px solid ${designTokens.colors.accent.primary}40`,
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
            <p style={{
              margin: 0,
              color: designTokens.colors.text.secondary,
              fontSize: '0.9rem',
              fontFamily: designTokens.typography.fonts.body
            }}>
              {triggerReason === 'message_limit' 
                ? "You've reached your message limit. Upgrade to continue your conversations."
                : triggerReason === 'character_limit'
                ? "You've reached your character limit. Upgrade to create more characters."
                : triggerReason === 'character_approval'
                ? "Get priority approval for your character with a Creator or Professional subscription."
                : "Upgrade to unlock more features and capabilities."
              }
            </p>
          </div>
        )}

        {/* Current Subscription Info */}
        {currentSubscription && (
          <div style={{
            background: designTokens.colors.background.interactive,
            border: `1px solid ${designTokens.colors.border.medium}`,
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              fontSize: '0.85rem',
              color: designTokens.colors.text.tertiary,
              marginBottom: '0.5rem',
              fontFamily: designTokens.typography.fonts.body,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Current Plan
            </div>
            <div style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: designTokens.colors.accent.primary,
              marginBottom: '0.75rem',
              fontFamily: designTokens.typography.fonts.display
            }}>
              {currentSubscription.tier_name?.toUpperCase() || 'FREE'}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '0.75rem',
              fontSize: '0.85rem',
              color: designTokens.colors.text.secondary,
              fontFamily: designTokens.typography.fonts.body
            }}>
              <div>
                Messages: <strong style={{ color: designTokens.colors.text.primary }}>
                  {currentSubscription.messages_used || 0}/
                  {currentSubscription.message_limit === -1 ? '∞' : currentSubscription.message_limit}
                </strong>
              </div>
              <div>
                Characters: <strong style={{ color: designTokens.colors.text.primary }}>
                  {currentSubscription.characters_used || 0}/
                  {currentSubscription.character_limit === -1 ? '∞' : currentSubscription.character_limit}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Tier Selection */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {Object.entries(SUBSCRIPTION_TIERS).map(([tier, config]) => {
            const priceDisplay = getPriceDisplay(tier);
            
            return (
              <div
                key={tier}
                onClick={() => setSelectedTier(tier)}
                style={{
                  background: selectedTier === tier 
                    ? `linear-gradient(135deg, ${designTokens.colors.background.interactive} 0%, ${designTokens.colors.background.peak} 100%)`
                    : designTokens.colors.background.surface,
                  border: selectedTier === tier 
                    ? `2px solid ${designTokens.colors.accent.primary}` 
                    : `1px solid ${designTokens.colors.border.medium}`,
                  borderRadius: '12px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  boxShadow: selectedTier === tier ? designTokens.shadows.glow : 'none'
                }}
              >
                {config.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '1rem',
                    background: `linear-gradient(135deg, ${designTokens.colors.accent.primary}, ${designTokens.colors.accent.hover})`,
                    color: designTokens.colors.text.primary,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    fontFamily: designTokens.typography.fonts.body,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    boxShadow: designTokens.shadows.glow
                  }}>
                    RECOMMENDED
                  </div>
                )}
                
                <h3 style={{
                  color: designTokens.colors.accent.primary,
                  margin: '0 0 0.5rem 0',
                  fontSize: '1.2rem',
                  fontFamily: designTokens.typography.fonts.display,
                  fontWeight: 700
                }}>
                  {config.display_name}
                </h3>
                
                <div style={{
                  color: designTokens.colors.text.primary,
                  fontSize: '2rem',
                  fontWeight: 700,
                  margin: '0 0 1rem 0',
                  fontFamily: designTokens.typography.fonts.display
                }}>
                  {priceDisplay}
                  <span style={{
                    fontSize: '0.8rem',
                    color: designTokens.colors.text.tertiary,
                    fontWeight: 400,
                    fontFamily: designTokens.typography.fonts.body
                  }}>
                    /month
                  </span>
                </div>
                
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  color: designTokens.colors.text.secondary,
                  fontSize: '0.9rem',
                  fontFamily: designTokens.typography.fonts.body
                }}>
                  {config.features.map((feature, index) => (
                    <li key={index} style={{
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{ color: designTokens.colors.semantic.success }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            background: `${designTokens.colors.semantic.error}15`,
            border: `1px solid ${designTokens.colors.semantic.error}40`,
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            color: designTokens.colors.semantic.error,
            textAlign: 'center',
            fontSize: '0.9rem',
            fontFamily: designTokens.typography.fonts.body
          }}>
            {error}
          </div>
        )}

        {/* Stripe Trust Badge & Action Button */}
        <div style={{
          background: designTokens.colors.background.surface,
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1rem',
          border: `1px solid ${designTokens.colors.border.subtle}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: designTokens.colors.text.secondary,
            fontFamily: designTokens.typography.fonts.body
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: designTokens.colors.semantic.success, fontSize: '1.2rem' }}>🔒</span>
              <span>Secured by Stripe</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: designTokens.colors.semantic.success, fontSize: '1.2rem' }}>💳</span>
              <span>PCI Compliant</span>
            </div>
          </div>
          
          <button
            onClick={handleStripeCheckout}
            disabled={isProcessing && processingProvider !== 'stripe'}
            style={{
              width: '100%',
              background: (isProcessing && processingProvider === 'stripe') 
                ? `${designTokens.colors.accent.primary}80` 
                : `linear-gradient(135deg, ${designTokens.colors.accent.primary}, ${designTokens.colors.accent.hover})`,
              border: 'none',
              borderRadius: '12px',
              color: designTokens.colors.text.primary,
              fontSize: '1.1rem',
              fontWeight: 700,
              fontFamily: designTokens.typography.fonts.body,
              padding: '1rem 2rem',
              cursor: (isProcessing && processingProvider !== 'stripe') ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: (isProcessing && processingProvider === 'stripe') ? 'none' : designTokens.shadows.glow
            }}
            onMouseEnter={(e) => {
              if (!(isProcessing && processingProvider !== 'stripe')) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = designTokens.shadows.glowStrong;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = designTokens.shadows.glow;
            }}
          >
            {(isProcessing && processingProvider === 'stripe') ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: `3px solid ${designTokens.colors.text.secondary}`,
                  borderTop: `3px solid ${designTokens.colors.text.primary}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Redirecting to Stripe...
              </>
            ) : (
              `Pay ${getPriceDisplay(selectedTier)}/month with Stripe →`
            )}
          </button>
        </div>

        {/* PayPal Trust Badge & Action Button */}
        <div style={{
          background: designTokens.colors.background.surface,
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1rem',
          border: `1px solid ${designTokens.colors.border.subtle}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: designTokens.colors.text.secondary,
            fontFamily: designTokens.typography.fonts.body
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: designTokens.colors.semantic.success, fontSize: '1.2rem' }}>🅿️</span>
              <span>PayPal Secure</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: designTokens.colors.semantic.success, fontSize: '1.2rem' }}>🔒</span>
              <span>Buyer Protection</span>
            </div>
          </div>
          
          <button
            onClick={handlePayPalCheckout}
            disabled={isProcessing && processingProvider !== 'paypal'}
            style={{
              width: '100%',
              background: (isProcessing && processingProvider === 'paypal') 
                ? 'rgba(0, 48, 135, 0.5)' 
                : 'linear-gradient(135deg, #0070BA, #003087)',
              border: 'none',
              borderRadius: '12px',
              color: '#FFF',
              fontSize: '1.1rem',
              fontWeight: 700,
              fontFamily: designTokens.typography.fonts.body,
              padding: '1rem 2rem',
              cursor: (isProcessing && processingProvider !== 'paypal') ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: (isProcessing && processingProvider === 'paypal') ? 'none' : '0 4px 12px rgba(0, 112, 186, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!(isProcessing && processingProvider !== 'paypal')) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 112, 186, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 112, 186, 0.3)';
            }}
          >
            {(isProcessing && processingProvider === 'paypal') ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '3px solid rgba(255,255,255,0.3)',
                  borderTop: '3px solid rgba(255,255,255,0.8)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Redirecting to PayPal...
              </>
            ) : (
              `Pay ${getPriceDisplay(selectedTier)}/month with PayPal →`
            )}
          </button>
        </div>

        <p style={{
          textAlign: 'center',
          color: designTokens.colors.text.tertiary,
          fontSize: '0.85rem',
          margin: 0,
          fontFamily: designTokens.typography.fonts.body
        }}>
          You'll be redirected to our secure checkout page
        </p>

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default PaymentProcessor;