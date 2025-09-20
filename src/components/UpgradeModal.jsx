// src/components/UpgradeModal.jsx
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
    features: ['15 Custom Characters', '2,000 Messages/Month', 'Advanced Features', 'Priority Support'],
    popular: true
  },
  unlimited: {
    name: 'unlimited',
    display_name: 'Unlimited', 
    price: 29.99,
    character_limit: -1,
    message_limit: -1,
    features: ['Unlimited Characters', 'Unlimited Messages', 'All Features', 'VIP Support']
  }
};

const UpgradeModal = ({ 
  isOpen, 
  onClose, 
  triggerReason = 'general', // 'message_limit', 'character_limit', 'general'
  currentUsage = null 
}) => {
  const { token } = useAuth();
  const { user } = useUser();
  
  const [selectedTier, setSelectedTier] = useState('pro');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  // Load current subscription status
  useEffect(() => {
    if (isOpen && user?.id) {
      loadCurrentSubscription();
    }
  }, [isOpen, user?.id]);

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

  const handleUpgrade = async () => {
    if (isProcessing) return;
    
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
          payment_provider: 'mock' // Will be 'stripe' or 'paypal' in production
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        setSuccess(true);
        // Auto-close after success
        setTimeout(() => {
          onClose();
          // Refresh page to update subscription state
          window.location.reload();
        }, 2000);
      } else {
        setError(result.error || 'Upgrade failed. Please try again.');
      }

    } catch (error) {
      console.error('Upgrade error:', error);
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
        return 'You\'ve reached your monthly message limit. Upgrade to continue chatting with unlimited access.';
      case 'character_limit':
        return 'You\'ve reached your character creation limit. Upgrade to create more custom characters.';
      default:
        return 'Unlock the full potential of AwakeVerse with unlimited characters and messages.';
    }
  };

  if (!isOpen) return null;

  // Success state
  if (success) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.8)',
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
          maxWidth: '400px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem'
          }}>
            ✨
          </div>
          
          <h2 style={{
            color: '#00FF88',
            fontSize: '1.5rem',
            margin: '0 0 1rem 0'
          }}>
            Welcome to {SUBSCRIPTION_TIERS[selectedTier].display_name}!
          </h2>
          
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            margin: '0 0 2rem 0'
          }}>
            Your subscription is now active. Enjoy unlimited access to all features!
          </p>
          
          <div style={{
            width: '40px',
            height: '4px',
            background: 'linear-gradient(90deg, #00FF88, #FFD700)',
            margin: '0 auto',
            borderRadius: '2px'
          }} />
        </div>
      </div>
    );
  }

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
        overflowY: 'auto',
        backdropFilter: 'blur(10px)'
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
              margin: '0 0 0.5rem 0',
              fontFamily: "'Playfair Display', serif"
            }}>
              {getModalTitle()}
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              margin: 0,
              fontSize: '1rem'
            }}>
              {getModalDescription()}
            </p>
          </div>
          
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '1.5rem',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              padding: '0.5rem'
            }}
          >
            ×
          </button>
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
            <h4 style={{
              color: '#FFD700',
              margin: '0 0 0.5rem 0'
            }}>
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
                  POPULAR
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

        {/* Error Display */}
        {error && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            color: '#ff6b6b',
            textAlign: 'center'
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
            onClick={onClose}
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
              transition: 'all 0.3s ease',
              opacity: isProcessing ? 0.5 : 1
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={handleUpgrade}
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
              `Upgrade to ${SUBSCRIPTION_TIERS[selectedTier].display_name}`
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

export default UpgradeModal;