// src/components/PaymentProcessor.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

const SUBSCRIPTION_TIERS = {
  starter: {
    name: 'starter',
    display_name: 'Starter',
    price: 9.99,
    character_limit: 5,
    message_limit: 500,
    features: ['5 Custom Characters', '500 Messages/Month', 'Priority Support']
  },
  pro: {
    name: 'pro', 
    display_name: 'Pro',
    price: 19.99,
    character_limit: 15,
    message_limit: 2000,
    features: ['15 Custom Characters', '2,000 Messages/Month', 'All Features', 'Priority Support'],
    popular: true
  },
  unlimited: {
    name: 'unlimited',
    display_name: 'Unlimited', 
    price: 49.99,
    character_limit: -1,
    message_limit: -1,
    features: ['Unlimited Characters', 'Unlimited Messages', 'All Features', 'VIP Support']
  }
};

const PaymentProcessor = ({ 
  isOpen, 
  onClose, 
  triggerReason = 'general',
  currentUsage = null,
  onBack = null
}) => {
  const { token } = useAuth();
  const { user } = useUser();
  
  const [selectedTier, setSelectedTier] = useState('pro');
  const [currentStep, setCurrentStep] = useState(1); // 1: Plan Selection, 2: Payment Form, 3: Success
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  // Payment form state
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
    email: user?.username || '',
    billingAddress: ''
  });

  // Load current subscription on open
  useEffect(() => {
    if (isOpen && user?.id) {
      loadCurrentSubscription();
    }
  }, [isOpen, user?.id]);

  // Set recommended tier based on trigger reason
  useEffect(() => {
    if (triggerReason === 'character_limit') {
      setSelectedTier('starter');
    } else if (triggerReason === 'message_limit') {
      setSelectedTier('pro');
    }
  }, [triggerReason]);

  const loadCurrentSubscription = async () => {
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/premium/user_subscription/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentSubscription(data.subscription);
      }
    } catch (error) {
      console.warn('Failed to load subscription:', error);
    }
  };

  const handlePayment = async () => {
    if (isProcessing) return;
    
    // Basic form validation
    if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.name) {
      setError('Please fill in all required payment fields');
      return;
    }
    
    setIsProcessing(true);
    setError(null);

    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_BASE}/api/premium/subscription/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tier_name: selectedTier,
          payment_provider: 'mock', // Will be 'stripe' or 'paypal' in production
          payment_data: {
            card_number: paymentData.cardNumber.replace(/\s/g, ''),
            expiry_date: paymentData.expiryDate,
            cvv: paymentData.cvv,
            cardholder_name: paymentData.name,
            billing_email: paymentData.email
          }
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        setCurrentStep(3); // Success step
        // Auto-close and refresh after success
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 3000);
      } else {
        setError(result.error || 'Payment failed. Please try again.');
      }

    } catch (error) {
      console.error('Payment error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (!isOpen) return null;

  // Success State
  if (currentStep === 3) {
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
        zIndex: 9999
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 50%, #0B1426 100%)',
          border: '2px solid #00FF88',
          borderRadius: '20px',
          padding: '3rem',
          textAlign: 'center',
          maxWidth: '500px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✨</div>
          
          <h2 style={{
            color: '#00FF88',
            fontSize: '1.8rem',
            margin: '0 0 1rem 0'
          }}>
            Welcome to {SUBSCRIPTION_TIERS[selectedTier].display_name}!
          </h2>
          
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            margin: '0 0 2rem 0',
            lineHeight: 1.6
          }}>
            Your subscription is now active. You can now{' '}
            {triggerReason === 'character_limit' ? 'create more characters' : 'continue chatting'}{' '}
            with full access to all premium features.
          </p>
          
          <div style={{
            width: '60px',
            height: '4px',
            background: 'linear-gradient(90deg, #00FF88, #FFD700)',
            margin: '0 auto',
            borderRadius: '2px'
          }} />
          
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.9rem',
            margin: '1rem 0 0 0'
          }}>
            Redirecting you back to continue...
          </p>
        </div>
      </div>
    );
  }

  // Plan Selection Step
  if (currentStep === 1) {
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
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0
              }}>
                Choose the plan that fits your needs
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                    padding: '0.25rem 0.5rem'
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
            {Object.entries(SUBSCRIPTION_TIERS).map(([tier, config]) => (
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
                  ${config.price}
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
            ))}
          </div>

          {/* Action Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => setCurrentStep(2)}
              style={{
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontSize: '1rem',
                fontWeight: 700,
                padding: '0.75rem 2rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Payment Form Step
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
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            color: '#FFD700',
            fontSize: '1.5rem',
            margin: '0 0 0.5rem 0'
          }}>
            Complete Your Upgrade
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            margin: 0
          }}>
            {SUBSCRIPTION_TIERS[selectedTier].display_name} - ${SUBSCRIPTION_TIERS[selectedTier].price}/month
          </p>
        </div>

        {/* Payment Form */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.9rem',
              marginBottom: '0.5rem'
            }}>
              Card Number *
            </label>
            <input
              type="text"
              value={paymentData.cardNumber}
              onChange={(e) => setPaymentData(prev => ({
                ...prev,
                cardNumber: formatCardNumber(e.target.value)
              }))}
              placeholder="1234 5678 9012 3456"
              maxLength="19"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                outline: 'none'
              }}
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.9rem',
                marginBottom: '0.5rem'
              }}>
                Expiry Date *
              </label>
              <input
                type="text"
                value={paymentData.expiryDate}
                onChange={(e) => setPaymentData(prev => ({
                  ...prev,
                  expiryDate: formatExpiryDate(e.target.value)
                }))}
                placeholder="MM/YY"
                maxLength="5"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.9rem',
                marginBottom: '0.5rem'
              }}>
                CVV *
              </label>
              <input
                type="text"
                value={paymentData.cvv}
                onChange={(e) => setPaymentData(prev => ({
                  ...prev,
                  cvv: e.target.value.replace(/\D/g, '').slice(0, 4)
                }))}
                placeholder="123"
                maxLength="4"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.9rem',
              marginBottom: '0.5rem'
            }}>
              Cardholder Name *
            </label>
            <input
              type="text"
              value={paymentData.name}
              onChange={(e) => setPaymentData(prev => ({
                ...prev,
                name: e.target.value
              }))}
              placeholder="John Doe"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.9rem',
              marginBottom: '0.5rem'
            }}>
              Email
            </label>
            <input
              type="email"
              value={paymentData.email}
              onChange={(e) => setPaymentData(prev => ({
                ...prev,
                email: e.target.value
              }))}
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Security Badge */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          marginBottom: '1rem',
          fontSize: '0.8rem',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#00FF88' }}>🔒</span>
            <span>SSL Secured</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#00FF88' }}>💳</span>
            <span>PCI Compliant</span>
          </div>
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

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => setCurrentStep(1)}
            disabled={isProcessing}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1rem',
              fontWeight: 600,
              padding: '0.75rem 1.5rem',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.5 : 1
            }}
          >
            Back
          </button>
          
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            style={{
              background: isProcessing 
                ? 'rgba(255, 215, 0, 0.5)' 
                : 'linear-gradient(135deg, #FFD700, #FFA500)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontSize: '1rem',
              fontWeight: 700,
              padding: '0.75rem 2rem',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isProcessing ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(0,0,0,0.3)',
                  borderTop: '2px solid rgba(0,0,0,0.8)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Processing...
              </>
            ) : (
              `Complete Purchase - ${SUBSCRIPTION_TIERS[selectedTier].price}`
            )}
          </button>
        </div>

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