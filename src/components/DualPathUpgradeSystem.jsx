// src/components/DualPathUpgradeSystem.jsx - STYLING UPDATED, LOGIC UNCHANGED
import React, { useState } from 'react';
import { useUser } from './contexts/UserContext';

// Shared payment processor for both paths
import PaymentProcessor from './components/PaymentProcessor';

// Educational Character Creation modal flow
const EducationalUpgradeModal = ({
  isOpen,
  onClose,
  onProceedToPayment
}) => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Education, 2: Benefits

  if (!isOpen) return null;

  const renderEducationStep = () => (
    <div
      style={{
        background:
          'radial-gradient(circle at top, #111827 0%, #020617 55%, #020617 100%)',
        border: '1px solid rgba(148, 163, 184, 0.35)',
        borderRadius: '20px',
        padding: '2rem',
        width: '90vw',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow:
          '0 24px 60px rgba(15, 23, 42, 0.95), 0 0 40px rgba(99, 102, 241, 0.35)'
      }}
    >
      {/* Educational Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2
          style={{
            color: '#F5F5DC',
            fontSize: '1.9rem',
            margin: '0 0 1rem 0',
            letterSpacing: '-0.04em'
          }}
        >
          Unlock Your Creative Potential
        </h2>
        <p
          style={{
            color: '#94A3B8',
            fontSize: '1rem',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6
          }}
        >
          You&apos;ve reached your character creation limit. See what premium
          creators are building and discover the advanced tools that bring
          characters to life.
        </p>
      </div>

      {/* Premium Character Showcase */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}
      >
        {[
          {
            name: 'Victorian Detective',
            description: 'Advanced personality with 500+ conversation memories',
            features: ['Complex backstory', 'Evolving personality', 'Memory system']
          },
          {
            name: 'Renaissance Artist',
            description: 'Multi-layered character with artistic expertise',
            features: ['Detailed knowledge base', 'Creative responses', 'Historical accuracy']
          },
          {
            name: 'Sci-Fi Explorer',
            description: 'Futuristic character with advanced AI integration',
            features: ['Technical expertise', 'Future scenarios', 'Problem-solving']
          }
        ].map((character, index) => (
          <div
            key={index}
            style={{
              background: '#141B2E',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: '0 6px 18px rgba(15, 23, 42, 0.9)'
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: '#F9FAFB',
                boxShadow: '0 0 18px rgba(99, 102, 241, 0.5)'
              }}
            >
              🎭
            </div>
            <h3
              style={{
                color: '#F1F5F9',
                margin: '0 0 0.5rem 0',
                fontSize: '1.05rem'
              }}
            >
              {character.name}
            </h3>
            <p
              style={{
                color: '#94A3B8',
                fontSize: '0.9rem',
                margin: '0 0 1rem 0',
                lineHeight: 1.4
              }}
            >
              {character.description}
            </p>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                fontSize: '0.8rem',
                color: '#CBD5F5'
              }}
            >
              {character.features.map((feature, i) => (
                <li
                  key={i}
                  style={{
                    marginBottom: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span style={{ color: '#22C55E' }}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Feature Comparison */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(148, 163, 184, 0.4)',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem'
        }}
      >
        <h3
          style={{
            color: '#F1F5F9',
            textAlign: 'center',
            margin: '0 0 1.5rem 0',
            fontSize: '1.25rem'
          }}
        >
          What You&apos;re Missing
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚫</div>
            <h4
              style={{
                color: '#F97373',
                margin: '0 0 0.5rem 0',
                fontSize: '0.95rem'
              }}
            >
              Free Tier
            </h4>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                color: '#94A3B8',
                fontSize: '0.9rem'
              }}
            >
              <li>1 character only</li>
              <li>Basic personality</li>
              <li>150 messages / month</li>
              <li>Standard support</li>
            </ul>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
            <h4
              style={{
                color: '#6366F1',
                margin: '0 0 0.5rem 0',
                fontSize: '0.95rem'
              }}
            >
              Professional Tier
            </h4>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                color: '#E5E7EB',
                fontSize: '0.9rem'
              }}
            >
              <li>Up to 15 characters</li>
              <li>Advanced AI features</li>
              <li>2,000+ messages / month</li>
              <li>Priority support</li>
              <li>Memory systems</li>
              <li>Custom personalities</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Trust Building */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            marginBottom: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#E5E7EB'
            }}
          >
            <span style={{ color: '#22C55E' }}>🔒</span>
            <span>Secure payment</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#E5E7EB'
            }}
          >
            <span style={{ color: '#22C55E' }}>💰</span>
            <span>Earn with your characters</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#E5E7EB'
            }}
          >
            <span style={{ color: '#22C55E' }}>⚡</span>
            <span>Instant activation</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(148, 163, 184, 0.6)',
            borderRadius: '999px',
            color: '#E5E7EB',
            fontSize: '0.95rem',
            fontWeight: 500,
            padding: '0.75rem 1.7rem',
            cursor: 'pointer'
          }}
        >
          Maybe later
        </button>

        <button
          onClick={() => setCurrentStep(2)}
          style={{
            background: 'linear-gradient(135deg, #6366F1, #818CF8)',
            border: 'none',
            borderRadius: '999px',
            color: '#F9FAFB',
            fontSize: '0.98rem',
            fontWeight: 600,
            padding: '0.8rem 2.2rem',
            cursor: 'pointer',
            boxShadow:
              '0 8px 24px rgba(15, 23, 42, 0.95), 0 0 24px rgba(99, 102, 241, 0.4)'
          }}
        >
          See pricing plans
        </button>
      </div>
    </div>
  );

  const renderBenefitsStep = () => (
    <div
      style={{
        background:
          'radial-gradient(circle at top, #111827 0%, #020617 55%, #020617 100%)',
        border: '1px solid rgba(148, 163, 184, 0.35)',
        borderRadius: '20px',
        padding: '2rem',
        width: '90vw',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow:
          '0 24px 60px rgba(15, 23, 42, 0.95), 0 0 40px rgba(99, 102, 241, 0.35)'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2
          style={{
            color: '#F1F5F9',
            fontSize: '1.7rem',
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.03em'
          }}
        >
          Choose your creative journey
        </h2>
        <p
          style={{
            color: '#94A3B8',
            margin: 0,
            fontSize: '0.95rem'
          }}
        >
          Select the plan that matches your ambitions. You&apos;ll confirm safely
          on the payment page.
        </p>
      </div>

      {/* Plan Comparison - space reserved for existing UpgradeModal visuals */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}
      >
        {/* Plan cards would go here - same as UpgradeModal */}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={() => setCurrentStep(1)}
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(148, 163, 184, 0.6)',
            borderRadius: '999px',
            color: '#E5E7EB',
            fontSize: '0.95rem',
            padding: '0.75rem 1.7rem',
            cursor: 'pointer'
          }}
        >
          Back
        </button>

        <button
          onClick={() => onProceedToPayment('character_limit')}
          style={{
            background: 'linear-gradient(135deg, #6366F1, #818CF8)',
            border: 'none',
            borderRadius: '999px',
            color: '#F9FAFB',
            fontSize: '0.98rem',
            fontWeight: 600,
            padding: '0.8rem 2.4rem',
            cursor: 'pointer',
            boxShadow:
              '0 8px 24px rgba(15, 23, 42, 0.95), 0 0 24px rgba(99, 102, 241, 0.4)'
          }}
        >
          Continue to payment
        </button>
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background:
          'radial-gradient(circle at top, rgba(15, 23, 42, 0.96), rgba(0, 0, 0, 0.96))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // z-index kept extremely high so it sits above other modals
        zIndex: 999999999999,
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '1rem'
      }}
    >
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
