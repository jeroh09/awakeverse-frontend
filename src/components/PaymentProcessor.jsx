// src/components/PaymentProcessor.jsx - UPDATED with PayPal support
import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import PaymentRouter from '../services/PaymentRouter';

// SUBSCRIPTION_TIERS with CORRECT multi-currency pricing
const SUBSCRIPTION_TIERS = {
  starter: {
    name: 'starter',
    display_name: 'EXPLORER',
    tagline: 'Start Your Journey',
    prices: {
      GBP: { amount: 3.99, symbol: '£', display: '£3.99' },
      USD: { amount: 4.99, symbol: '$', display: '$4.99' },
      EUR: { amount: 4.99, symbol: '€', display: '€4.99' }
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
      GBP: { amount: 6.99, symbol: '£', display: '£6.99' },
      USD: { amount: 7.99, symbol: '$', display: '$7.99' },
      EUR: { amount: 7.99, symbol: '€', display: '€7.99' }
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
      GBP: { amount: 11.99, symbol: '£', display: '£11.99' },
      USD: { amount: 14.99, symbol: '$', display: '$14.99' },
      EUR: { amount: 14.99, symbol: '€', display: '€14.99' }
    },
    character_limit: -1,
    message_limit: -1,
    features: [
      'Everything in Creator',
      'Advanced multi-character designer',
      'Featured marketplace placement',
      '70/30 revenue share',
      'Live debate hosting',
      'Advanced analytics',
      'Priority AI models',
      'Commercial rights',
      'Priority support'
    ],
    popular: false
  }
};

// Helper to detect user's currency
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
  const { user } = useUser();
  
  const [selectedTier, setSelectedTier] = useState('pro');
  const [selectedCurrency, setSelectedCurrency] = useState('GBP');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProvider, setProcessingProvider] = useState(null); // Track which provider is processing
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
      
      // Use PaymentRouter - it handles everything!
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
      
      // If we reach here, redirect failed
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

  // ✅ ADDED: PayPal Handler
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
        provider: 'paypal',  // ← KEY DIFFERENCE
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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 25%, #2C1810 50%, #0F1A2E 75%, #0B1426 100%)',
        border: '2px solid rgba(255, 215, 0, 0.3)',
        borderRadius: '20px',
        padding: '2rem',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem'
        }}>
          <div>
            <h2 style={{
              color: '#FFD700',
              fontSize: '1.8rem',
              margin: '0 0 0.5rem 0'
            }}>
              {triggerReason === 'character_limit' ? 'Create More Characters' : 
               triggerReason === 'message_limit' ? 'Continue Chatting' : 
               'Upgrade Your Experience'}
            </h2>
            {/* ✅ UPDATED: Text to include PayPal */}
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              margin: 0
            }}>
              Choose your plan and pay securely with Stripe or PayPal
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {onBack && (
              <button
                onClick={onBack}
                style={{
                  background: 'none',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                ← Back
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.25rem'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Currency Selector */}
        <div style={{
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          {['GBP', 'USD', 'EUR'].map(currency => (
            <button
              key={currency}
              onClick={() => setSelectedCurrency(currency)}
              style={{
                background: selectedCurrency === currency 
                  ? 'rgba(255, 215, 0, 0.2)' 
                  : 'rgba(255, 255, 255, 0.05)',
                border: selectedCurrency === currency 
                  ? '1px solid #FFD700' 
                  : '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: selectedCurrency === currency ? '#FFD700' : 'rgba(255, 255, 255, 0.8)',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {currency === 'GBP' ? '£ GBP' : currency === 'USD' ? '$ USD' : '€ EUR'}
            </button>
          ))}
        </div>

        {/* Current Plan Info */}
        {currentSubscription && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '2rem'
          }}>
            <h4 style={{ color: '#FFD700', margin: '0 0 0.5rem 0' }}>
              Current Plan: {currentSubscription.tier_display}
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.9rem'
            }}>
              <div>Messages: {currentSubscription.messages_used || 0}/{currentSubscription.message_limit === -1 ? '∞' : currentSubscription.message_limit}</div>
              <div>Characters: {currentSubscription.characters_used || 0}/{currentSubscription.character_limit === -1 ? '∞' : currentSubscription.character_limit}</div>
            </div>
          </div>
        )}

        {/* Tier Selection */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
                    ? 'rgba(255, 215, 0, 0.1)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: selectedTier === tier 
                    ? '2px solid #FFD700' 
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
              >
                {config.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '1rem',
                    background: '#FFD700',
                    color: '#000',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    RECOMMENDED
                  </div>
                )}
                
                <h3 style={{
                  color: '#FFD700',
                  margin: '0 0 0.5rem 0',
                  fontSize: '1.2rem'
                }}>
                  {config.display_name}
                </h3>
                
                <div style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  margin: '0 0 1rem 0'
                }}>
                  {priceDisplay}
                  <span style={{
                    fontSize: '0.8rem',
                    color: 'rgba(255, 255, 255, 0.6)'
                  }}>
                    /month
                  </span>
                </div>
                
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.9rem'
                }}>
                  {config.features.map((feature, index) => (
                    <li key={index} style={{
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{ color: '#00FF88' }}>✓</span>
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
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            color: '#ff6b6b',
            textAlign: 'center',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {/* Stripe Trust Badge & Action Button */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#00FF88', fontSize: '1.2rem' }}>🔒</span>
              <span>Secured by Stripe</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#00FF88', fontSize: '1.2rem' }}>💳</span>
              <span>PCI Compliant</span>
            </div>
          </div>
          
          <button
            onClick={handleStripeCheckout}
            disabled={isProcessing && processingProvider !== 'stripe'}
            style={{
              width: '100%',
              background: (isProcessing && processingProvider === 'stripe') 
                ? 'rgba(255, 215, 0, 0.5)' 
                : 'linear-gradient(135deg, #FFD700, #FFA500)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontSize: '1.1rem',
              fontWeight: 700,
              padding: '1rem 2rem',
              cursor: (isProcessing && processingProvider !== 'stripe') ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {(isProcessing && processingProvider === 'stripe') ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '3px solid rgba(0,0,0,0.3)',
                  borderTop: '3px solid rgba(0,0,0,0.8)',
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

        {/* ✅ ADDED: PayPal Trust Badge & Action Button */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#00FF88', fontSize: '1.2rem' }}>🅿️</span>
              <span>PayPal Secure</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#00FF88', fontSize: '1.2rem' }}>🔒</span>
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
              borderRadius: '8px',
              color: '#FFF',
              fontSize: '1.1rem',
              fontWeight: 700,
              padding: '1rem 2rem',
              cursor: (isProcessing && processingProvider !== 'paypal') ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
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
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '0.85rem',
          margin: 0
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