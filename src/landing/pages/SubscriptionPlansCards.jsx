// SubscriptionPlansCards.jsx - Landing page pricing component
import React from 'react';
import { Link } from 'react-router-dom';

const SubscriptionPlansCards = () => {
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$9.99',
      period: '/month',
      description: 'Perfect for getting started',
      features: [
        '5 Custom Characters',
        '500 Messages/Month',
        'Character Templates',
        'Email Support'
      ],
      cta: 'Start Creating',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19.99',
      period: '/month',
      description: 'Most popular choice',
      features: [
        '15 Custom Characters',
        '2,000 Messages/Month',
        'All Templates',
        'Priority Support',
        'Creator Hub Access'
      ],
      cta: 'Go Pro',
      popular: true
    },
    {
      id: 'unlimited',
      name: 'Unlimited',
      price: '$49.99',
      period: '/month',
      description: 'For power users',
      features: [
        'Unlimited Characters',
        'Unlimited Messages',
        'All Features',
        'VIP Support',
        'Early Access',
        'Creator Hub Access'
      ],
      cta: 'Get Unlimited',
      popular: false
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '1.5rem',
      width: '100%',
      maxWidth: '900px'
    }}>
      {plans.map((plan) => (
        <div
          key={plan.id}
          style={{
            background: plan.popular 
              ? 'rgba(255, 215, 0, 0.1)' 
              : 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            border: plan.popular 
              ? '2px solid rgba(255, 215, 0, 0.5)' 
              : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            padding: '2rem',
            position: 'relative',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = plan.popular 
              ? '0 20px 40px rgba(255, 215, 0, 0.2)'
              : '0 20px 40px rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Popular Badge */}
          {plan.popular && (
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              color: '#000',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.5rem 1.5rem',
              borderRadius: '15px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Most Popular
            </div>
          )}

          {/* Plan Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem',
            paddingTop: plan.popular ? '0.5rem' : '0'
          }}>
            <h3 style={{
              color: plan.popular ? '#FFD700' : '#ffffff',
              fontSize: '1.4rem',
              fontWeight: 700,
              margin: '0 0 0.5rem 0',
              fontFamily: "'Playfair Display', serif"
            }}>
              {plan.name}
            </h3>
            
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.9rem',
              margin: '0 0 1.5rem 0'
            }}>
              {plan.description}
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              gap: '0.25rem'
            }}>
              <span style={{
                color: plan.popular ? '#FFD700' : '#ffffff',
                fontSize: '2.5rem',
                fontWeight: 700,
                fontFamily: "'Inter', sans-serif"
              }}>
                {plan.price}
              </span>
              <span style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '1rem',
                fontWeight: 400
              }}>
                {plan.period}
              </span>
            </div>
          </div>

          {/* Features List */}
          <div style={{
            marginBottom: '2rem'
          }}>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {plan.features.map((feature, index) => (
                <li
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '0.9rem'
                  }}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    background: plan.popular 
                      ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                      : 'linear-gradient(135deg, #00FF88, #00CC6A)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    color: '#000',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    ✓
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Button */}
          <Link
            to="/register"
            style={{
              display: 'block',
              background: plan.popular 
                ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                : 'linear-gradient(135deg, #00FF88, #00CC6A)',
              border: 'none',
              borderRadius: '25px',
              color: '#000',
              fontSize: '1rem',
              fontWeight: 700,
              padding: '1rem 2rem',
              textAlign: 'center',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              boxShadow: plan.popular 
                ? '0 4px 20px rgba(255, 215, 0, 0.3)'
                : '0 4px 20px rgba(0, 255, 136, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = plan.popular 
                ? '0 6px 25px rgba(255, 215, 0, 0.4)'
                : '0 6px 25px rgba(0, 255, 136, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = plan.popular 
                ? '0 4px 20px rgba(255, 215, 0, 0.3)'
                : '0 4px 20px rgba(0, 255, 136, 0.3)';
            }}
          >
            {plan.cta}
          </Link>

          {/* Additional Info */}
          <div style={{
            textAlign: 'center',
            marginTop: '1rem'
          }}>
            <p style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.8rem',
              margin: 0
            }}>
              Cancel anytime • Earn with Characters
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SubscriptionPlansCards;