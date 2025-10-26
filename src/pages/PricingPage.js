// src/pages/PricingPage.js
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './PricingPage.css';

const PricingPage = () => {
  const [activeSection, setActiveSection] = useState(0);
  const featuresSectionRef = useRef(null);

  const scrollToFeatures = () => {
    featuresSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const platformFeatures = [
    {
      title: "Creator Hub",
      subtitle: "Build • Earn • Showcase",
      description: "Turn your character creations into monthly income. Submit quality characters and earn based on user interactions.",
      icon: "💎",
      features: [
        "Submit unlimited characters",
        "Earn monthly payouts",
        "Get featured in marketplace",
        "Real-time analytics",
        "Quality scoring system"
      ],
      visual: "creator-hub",
      gradient: "linear-gradient(135deg, #FFD700 0%, #FF6B6B 100%)"
    },
    {
      title: "Market Hub", 
      subtitle: "Discover • Explore • Connect",
      description: "Browse thousands of AI characters. Find the perfect conversation partner for any topic or interest.",
      icon: "🛍️",
      features: [
        "1000+ pre-built characters",
        "Advanced search & filters",
        "User ratings & reviews", 
        "Trending characters",
        "Personalized recommendations"
      ],
      visual: "market-hub",
      gradient: "linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)"
    },
    {
      title: "Scenarios Hub",
      subtitle: "Debate • Collaborate • Create",
      description: "Powerful multi-AI conversations. Watch historical figures debate, collaborate on projects, or create dynamic storylines.",
      icon: "🎭",
      features: [
        "Multi-AI conversations",
        "Historical debates", 
        "Creative collaborations",
        "Dynamic storylines",
        "Real-time interaction"
      ],
      visual: "scenarios-hub",
      gradient: "linear-gradient(135deg, #FF8E53 0%, #FE6B8B 100%)"
    }
  ];

  const subscriptionPlans = [
    {
      id: 'starter',
      name: 'Explorer',
      price: '£3.99',
      period: '/month',
      description: 'Perfect for getting started with AI conversations',
      features: [
        '5 Custom Characters',
        '500 Messages/Month', 
        'Basic Character Templates',
        'Access to Market Hub',
        'Email Support',
        'Standard Scenarios'
      ],
      cta: 'Start Creating',
      popular: false,
      color: '#4ECDC4'
    },
    {
      id: 'pro',
      name: 'Creator', 
      price: '£6.99',
      period: '/month',
      description: 'Most popular for serious creators and power users',
      features: [
        '15 Custom Characters',
        '2,000 Messages/Month',
        'All Character Templates', 
        'Creator Hub Access',
        'Priority Support',
        'Advanced Scenarios',
        'Early Feature Access'
      ],
      cta: 'Go Pro',
      popular: true,
      color: '#FFD700'
    },
    {
      id: 'unlimited',
      name: 'Professional',
      price: '£11.99', 
      period: '/month',
      description: 'Maximum power for unlimited creativity',
      features: [
        'Unlimited Characters',
        'Unlimited Messages',
        'All Premium Templates',
        'Creator Hub Pro Tools',
        'VIP Support',
        'Unlimited Scenarios',
        'Verse Hub Access',
        'Custom AI Training'
      ],
      cta: 'Get Unlimited',
      popular: false,
      color: '#FF6B6B'
    }
  ];

  return (
    <div className="pricing-container">
      {/* Header */}
      <header className="pricing-header">
        <Link to="/" className="header-logo">
          AwakeVerse
        </Link>
        <nav className="pricing-nav">
          <Link to="/features">Features</Link>
          <Link to="/learn-more">Learn More</Link>
          <Link to="/creator-hub">Creator Hub</Link>
          <Link to="/login" className="nav-button sign-in">Sign In</Link>
          <Link to="/register" className="nav-button sign-up">Get Started</Link>
        </nav>
      </header>

      {/* Section 1: Visual Platform Features */}
      <section className="platform-features-section">
        <div className="features-container">
          <div className="features-header">
            <h1>Where AI Conversations Come Alive</h1>
            <p>Three powerful hubs working together to create unforgettable AI experiences</p>
            <button className="scroll-indicator" onClick={scrollToFeatures}>
              View Pricing Plans
              <span className="arrow">↓</span>
            </button>
          </div>

          <div className="features-grid">
            {platformFeatures.map((feature, index) => (
              <div key={feature.title} className="feature-card">
                <div className="feature-visual">
                  <div 
                    className="visual-placeholder"
                    style={{ background: feature.gradient }}
                  >
                    <div className="feature-icon">{feature.icon}</div>
                    <div className="floating-elements">
                      <div className="floating-element el1">✨</div>
                      <div className="floating-element el2">⚡</div>
                      <div className="floating-element el3">🌟</div>
                    </div>
                  </div>
                </div>
                
                <div className="feature-content">
                  <h3>{feature.title}</h3>
                  <p className="feature-subtitle">{feature.subtitle}</p>
                  <p className="feature-description">{feature.description}</p>
                  
                  <div className="feature-highlights">
                    {feature.features.map((item, idx) => (
                      <div key={idx} className="highlight-item">
                        <span className="check">✓</span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Pricing Plans */}
      <section ref={featuresSectionRef} className="pricing-plans-section">
        <div className="pricing-container-inner">
          <div className="pricing-header">
            <h2>AwakeVerse</h2>
            <p>Start with 5 custom characters or go unlimited. Every plan includes access to our growing library of AI personalities.</p>
          </div>

          <div className="plans-grid">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.id}
                className={`plan-card ${plan.popular ? 'popular' : ''}`}
              >
                {plan.popular && (
                  <div className="popular-badge">Most Popular</div>
                )}
                
                <div className="plan-header">
                  <h3>{plan.name}</h3>
                  <div className="plan-price">
                    <span className="price">{plan.price}</span>
                    <span className="period">{plan.period}</span>
                  </div>
                  <p className="plan-description">{plan.description}</p>
                </div>

                <div className="plan-features">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="feature-item">
                      <span className="check-icon">✓</span>
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="plan-actions">
                  {plan.id === 'starter' ? (
                    <Link to="/register" className="cta-button primary">
                      {plan.cta}
                    </Link>
                  ) : (
                    <Link to="/login" className="cta-button secondary">
                      Upgrade Now
                    </Link>
                  )}
                  
                  <div className="plan-note">
                    {plan.id === 'pro' && 'Includes Creator Hub access'}
                    {plan.id === 'unlimited' && 'Includes all hub features'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Section */}
          <div className="trust-section">
            <div className="trust-items">
              <div className="trust-item">
                <div className="trust-icon">🔒</div>
                <span>Secure Payment</span>
              </div>
              <div className="trust-item">
                <div className="trust-icon">↶</div>
                <span>Cancel Anytime</span>
              </div>
              <div className="trust-item">
                <div className="trust-icon">💬</div>
                <span>24/7 Support</span>
              </div>
              <div className="trust-item">
                <div className="trust-icon">🚀</div>
                <span>Monetize Characters</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;