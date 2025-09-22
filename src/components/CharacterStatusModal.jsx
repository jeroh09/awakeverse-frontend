// components/CharacterStatusModal.jsx - Fixed with proper subscription integration
import React, { useState } from 'react';
import PaymentProcessor from './PaymentProcessor';

const CharacterStatusModal = ({ character, onClose, onCreateNew }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showPaymentProcessor, setShowPaymentProcessor] = useState(false);

  const getStatusConfig = () => {
    switch (character.status) {
      case 'pending':
        return {
          icon: '⏳',
          title: 'Character Under Review',
          color: '#FFA500',
          bgColor: 'rgba(255, 165, 0, 0.1)',
          borderColor: 'rgba(255, 165, 0, 0.3)',
          message: `${character.display_name} is being reviewed by our team. You'll receive an email notification when approved.`,
          estimatedTime: 'Usually takes 24-48 hours',
          primaryAction: 'Get Priority Approval',
          secondaryAction: 'Browse Other Characters'
        };
      case 'rejected':
        return {
          icon: '❌',
          title: 'Character Needs Revision',
          color: '#ff6b6b',
          bgColor: 'rgba(255, 107, 107, 0.1)',
          borderColor: 'rgba(255, 107, 107, 0.3)',
          message: character.rejection_reason || 'Your character submission needs adjustments before approval.',
          estimatedTime: 'Create a new character addressing the feedback',
          primaryAction: 'Create New Character',
          secondaryAction: 'Browse Other Characters'
        };
      default:
        return {
          icon: '⚠️',
          title: 'Character Unavailable',
          color: '#6c757d',
          bgColor: 'rgba(108, 117, 125, 0.1)',
          borderColor: 'rgba(108, 117, 125, 0.3)',
          message: 'This character is not available for chat.',
          estimatedTime: '',
          primaryAction: 'Browse Characters',
          secondaryAction: 'Close'
        };
    }
  };

  const config = getStatusConfig();

  const handlePrimaryAction = () => {
    if (character.status === 'pending') {
      // Open payment processor for priority approval
      setShowPaymentProcessor(true);
    } else if (character.status === 'rejected') {
      // Start new character creation
      onCreateNew();
    } else {
      // Default close action
      onClose();
    }
  };

  const handlePaymentClose = () => {
    setShowPaymentProcessor(false);
    // Optionally refresh the character status after payment
    // You might want to call a refresh function here
  };

  const handlePaymentBack = () => {
    setShowPaymentProcessor(false);
  };

  const upgradeOptions = [
    {
      tier: 'Pro',
      price: '$19.99/month',
      benefits: [
        'Priority 12-hour approval',
        '15 custom characters',
        '2000 messages/month',
        'Access to Monetisation'
      ],
      recommended: true
    },
    {
      tier: 'Unlimited',
      price: '$49.99/month',
      benefits: [
        'Instant approval',
        'Unlimited characters',
        'Unlimited messages',
        'Priority support',
        'Access to Monetisation'
      ]
    }
  ];

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
        background: 'rgba(11, 20, 38, 0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: `2px solid ${config.borderColor}`,
          borderRadius: isMobile ? '16px' : '20px',
          padding: isMobile ? '1.5rem' : '2rem',
          width: '100%',
          maxWidth: isMobile ? '400px' : '500px',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
          maxHeight: '80vh',
          overflowY: 'auto'
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
            fontWeight: 600,
            margin: '0 0 1rem 0',
            letterSpacing: '1px'
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
              color: '#FFD700',
              fontSize: '1.1rem',
              margin: '0 0 0.5rem 0'
            }}>
              {character.display_name}
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.9rem',
              margin: 0,
              lineHeight: 1.5
            }}>
              {config.message}
            </p>
            {config.estimatedTime && (
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.8rem',
                margin: '0.5rem 0 0 0',
                fontStyle: 'italic'
              }}>
                {config.estimatedTime}
              </p>
            )}
          </div>

          {/* Upgrade Options for Pending Status */}
          {character.status === 'pending' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{
                color: '#FFD700',
                fontSize: '1.1rem',
                margin: '0 0 1rem 0'
              }}>
                Skip the Wait
              </h3>
              
              {upgradeOptions.map((option, index) => (
                <div key={index} style={{
                  background: option.recommended ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  border: option.recommended ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.2)',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                  position: 'relative'
                }}>
                  {option.recommended && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '10px',
                      background: '#FFD700',
                      color: '#000',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold'
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
                        fontWeight: 'bold', 
                        color: '#FFD700',
                        fontSize: '1rem'
                      }}>
                        {option.tier}
                      </div>
                      <div style={{ 
                        fontSize: '0.9rem', 
                        color: 'rgba(255, 255, 255, 0.8)' 
                      }}>
                        {option.price}
                      </div>
                    </div>
                  </div>
                  
                  <ul style={{ 
                    margin: '0.5rem 0', 
                    fontSize: '0.8rem',
                    textAlign: 'left',
                    paddingLeft: '1rem'
                  }}>
                    {option.benefits.map((benefit, i) => (
                      <li key={i} style={{ 
                        color: 'rgba(255, 255, 255, 0.9)',
                        marginBottom: '0.3rem'
                      }}>
                        {benefit}
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
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
              margin: '0 0 1.5rem 0',
              textAlign: 'left'
            }}>
              <h4 style={{
                color: '#ff6b6b',
                fontSize: '0.9rem',
                margin: '0 0 0.5rem 0'
              }}>
                Feedback for Improvement:
              </h4>
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.85rem',
                margin: 0,
                lineHeight: 1.4
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
                  ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                  : character.status === 'rejected'
                  ? 'linear-gradient(135deg, #4CAF50, #45a049)'
                  : 'linear-gradient(135deg, #6c757d, #5a6268)',
                border: 'none',
                borderRadius: '8px',
                color: character.status === 'pending' ? '#000' : '#fff',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 600,
                padding: isMobile ? '0.8rem 1.5rem' : '0.75rem 1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                flex: 1
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {config.primaryAction}
            </button>
            
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 600,
                padding: isMobile ? '0.8rem 1.5rem' : '0.75rem 1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                flex: 1
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              {config.secondaryAction}
            </button>
          </div>

          {/* Helper Text */}
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.75rem',
            margin: '1rem 0 0 0',
            fontStyle: 'italic'
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