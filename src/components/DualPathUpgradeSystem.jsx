// src/components/DualPathUpgradeSystem.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

// Shared payment processor for both paths
import PaymentProcessor from '../components/PaymentProcessor';

// Educational Character Creaion modal Flow
const EducationalUpgradeModal = ({ 
  isOpen, 
  onClose, 
  onProceedToPayment 
}) => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Education, 2: Benefits, 3: Ready to Pay

  if (!isOpen) return null;

  const renderEducationStep = () => (
    <div style={{
      background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 25%, #2C1810 50%, #0F1A2E 75%, #0B1426 100%)',
      border: '2px solid rgba(255, 215, 0, 0.3)',
      borderRadius: '20px',
      padding: '2rem',
      width: '90vw',
      maxWidth: '800px',
      maxHeight: '90vh',
      overflowY: 'auto'
    }}>
      {/* Educational Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{
          color: '#FFD700',
          fontSize: '2rem',
          margin: '0 0 1rem 0',
          fontFamily: "'Playfair Display', serif"
        }}>
          Unlock Your Creative Potential
        </h2>
        <p style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '1.1rem',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: 1.6
        }}>
          You've reached your character creation limit. See what premium users are creating 
          and discover the advanced features that bring characters to life.
        </p>
      </div>

      {/* Premium Character Showcase */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {[
          {
            name: "Victorian Detective",
            description: "Advanced personality with 500+ conversation memories",
            features: ["Complex backstory", "Evolving personality", "Memory system"]
          },
          {
            name: "Renaissance Artist", 
            description: "Multi-layered character with artistic expertise",
            features: ["Detailed knowledge base", "Creative responses", "Historical accuracy"]
          },
          {
            name: "Sci-Fi Explorer",
            description: "Futuristic character with advanced AI integration",
            features: ["Technical expertise", "Future scenarios", "Problem-solving"]
          }
        ].map((character, index) => (
          <div key={index} style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              🎭
            </div>
            <h3 style={{
              color: '#FFD700',
              margin: '0 0 0.5rem 0',
              fontSize: '1.1rem'
            }}>
              {character.name}
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.9rem',
              margin: '0 0 1rem 0',
              lineHeight: 1.4
            }}>
              {character.description}
            </p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: '0.8rem',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              {character.features.map((feature, i) => (
                <li key={i} style={{
                  marginBottom: '0.25rem',
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

      {/* Feature Comparison */}
      <div style={{
        background: 'rgba(255, 215, 0, 0.1)',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{
          color: '#FFD700',
          textAlign: 'center',
          margin: '0 0 1.5rem 0',
          fontSize: '1.3rem'
        }}>
          What You're Missing
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '0.5rem'
            }}>🚫</div>
            <h4 style={{
              color: '#ff6b6b',
              margin: '0 0 0.5rem 0'
            }}>
              Free Tier
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.9rem'
            }}>
              <li>1 Character Only</li>
              <li>Basic Personality</li>
              <li>150 Messages/Month</li>
              <li>Standard Support</li>
            </ul>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '0.5rem'
            }}>🎯</div>
            <h4 style={{
              color: '#FFD700',
              margin: '0 0 0.5rem 0'
            }}>
              Premium Access
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.9rem'
            }}>
              <li>Up to 15 Characters</li>
              <li>Advanced AI Features</li>
              <li>2,000+ Messages/Month</li>
              <li>Priority Support</li>
              <li>Memory Systems</li>
              <li>Custom Personalities</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Trust Building */}
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'rgba(255, 255, 255, 0.8)'
          }}>
            <span style={{ color: '#00FF88' }}>🔒</span>
            <span>Secure Payment</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'rgba(255, 255, 255, 0.8)'
          }}>
            <span style={{ color: '#00FF88' }}>💰</span>
            <span>30-Day Money Back</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'rgba(255, 255, 255, 0.8)'
          }}>
            <span style={{ color: '#00FF88' }}>⚡</span>
            <span>Instant Activation</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '1rem',
            fontWeight: 600,
            padding: '0.75rem 1.5rem',
            cursor: 'pointer'
          }}
        >
          Maybe Later
        </button>
        
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
            cursor: 'pointer'
          }}
        >
          See Pricing Plans
        </button>
      </div>
    </div>
  );

  const renderBenefitsStep = () => (
    <div style={{
      background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 25%, #2C1810 50%, #0F1A2E 75%, #0B1426 100%)',
      border: '2px solid rgba(255, 215, 0, 0.3)',
      borderRadius: '20px',
      padding: '2rem',
      width: '90vw',
      maxWidth: '900px',
      maxHeight: '90vh',
      overflowY: 'auto'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{
          color: '#FFD700',
          fontSize: '1.8rem',
          margin: '0 0 0.5rem 0'
        }}>
          Choose Your Creative Journey
        </h2>
        <p style={{
          color: 'rgba(255, 255, 255, 0.8)',
          margin: 0
        }}>
          Select the plan that matches your creative ambitions
        </p>
      </div>

      {/* Plan Comparison - same as your UpgradeModal but with more space */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Plan cards would go here - same as UpgradeModal */}
      </div>

      <div style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center'
      }}>
        <button
          onClick={() => setCurrentStep(1)}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '1rem',
            padding: '0.75rem 1.5rem',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
        
        <button
          onClick={() => onProceedToPayment('character_limit')}
          style={{
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            border: 'none',
            borderRadius: '8px',
            color: '#000',
            fontSize: '1rem',
            fontWeight: 700,
            padding: '0.75rem 2rem',
            cursor: 'pointer'
          }}
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );

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
      {currentStep === 1 ? renderEducationStep() : renderBenefitsStep()}
    </div>
  );
};

// Main Upgrade System Controller
const DualPathUpgradeSystem = ({
  isOpen,
  onClose,
  triggerReason = 'general', // 'message_limit', 'character_limit', 'general'
  currentUsage = null
}) => {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentContext, setPaymentContext] = useState('general');

  const handleProceedToPayment = (context) => {
    setPaymentContext(context);
    setShowPayment(true);
  };

  if (!isOpen) return null;

  // Show payment processor (shared between both paths)
  if (showPayment) {
    return (
      <PaymentProcessor
        isOpen={true}
        onClose={onClose}
        triggerReason={paymentContext}
        currentUsage={currentUsage}
        onBack={() => setShowPayment(false)}
      />
    );
  }

  // Character creation path - educational flow
  if (triggerReason === 'character_limit') {
    return (
      <EducationalUpgradeModal
        isOpen={true}
        onClose={onClose}
        onProceedToPayment={handleProceedToPayment}
      />
    );
  }

  // Message limit path - quick upgrade (your existing modal)
  return (
    <PaymentProcessor
      isOpen={true}
      onClose={onClose}
      triggerReason={triggerReason}
      currentUsage={currentUsage}
    />
  );
};

export default DualPathUpgradeSystem;