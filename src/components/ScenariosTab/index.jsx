// src/components/ScenariosTab/index.jsx - Complete Merged Version with Payment Handlers
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../contexts/UserContext';
import SubscriptionService from '../../services/SubscriptionService';
import PaymentRouter from '../../services/PaymentRouter';
import TemplatesGallery from './TemplatesGallery';
import MyScenariosPanel from './MyScenariosPanel';
import ScenarioCreator from './ScenarioCreator';
import ScenarioChatWindow from './ScenarioChatWindow';
import './ScenariosTab.css';
import UseCaseCarousel from './UseCaseCarousel';
import ThemeToggle from './ThemeToggle';
import DialogueGuide from './DialogueGuide';

export default function ScenariosTab({ 
  marketHubScenario = null,
  onMarketHubScenarioClosed = null  // ✅ ADD THIS - callback when chat closes
 }) {
  const { user } = useUser();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  const [showEducationalModal, setShowEducationalModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('awakeverse');  // ✅ Dark mode default
  const [myScenarios, setMyScenarios] = useState([]);
  const [showBlankCreator, setShowBlankCreator] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

    // ============================================================================
  // NEW: Handle Market Hub scenario passed from ChatApp
  // ============================================================================
  useEffect(() => {
    if (marketHubScenario) {
      console.log('🌍 ScenariosTab: Received Market Hub scenario:', {
        debateId: marketHubScenario.debateId,
        scenarioId: marketHubScenario.scenarioId,
        title: marketHubScenario.title,
        is_market_hub: marketHubScenario.is_market_hub
      });

      // Open the chat window with this scenario
      setActiveScenario(marketHubScenario);

      console.log('✅ ScenariosTab: Opening chat window for Market Hub scenario');
    }
  }, [marketHubScenario]);

  // Fetch subscription data using SubscriptionService
  const loadSubscriptionData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Loading subscription data for user:', user.id);
      
      const data = await SubscriptionService.getUserSubscriptionStatus(user.id);
      
      console.log('✅ Subscription data loaded:', {
        tier: data.subscription?.tier,
        tier_name: data.subscription?.tier_name,
        unlimited: data.subscription?.unlimited,
        status: data.status
      });
      
      if (data.status === 'success' && data.subscription) {
        setSubscriptionData(data);
        
        // Check if user has unlimited tier
        const hasUnlimited = data.subscription.tier === 'unlimited' || 
                           data.subscription.tier_name === 'unlimited' ||
                           data.subscription.unlimited === true;
        
        setRequiresUpgrade(!hasUnlimited);
        
        console.log('🎭 Scenarios Access:', hasUnlimited ? 'GRANTED' : 'REQUIRES UPGRADE');
      } else {
        // Use fallback data
        console.warn('⚠️ Using fallback subscription data');
        const fallback = SubscriptionService.getFallbackSubscriptionData();
        setSubscriptionData(fallback);
        setRequiresUpgrade(true); // Fallback is free tier
      }
    } catch (error) {
      console.error('❌ Failed to load subscription:', error);
      const fallback = SubscriptionService.getFallbackSubscriptionData();
      setSubscriptionData(fallback);
      setRequiresUpgrade(true);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Initialize on mount
  useEffect(() => {
    loadSubscriptionData();
  }, [loadSubscriptionData]);

  // Load user's scenarios
  const loadMyScenarios = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { getMyScenarios } = await import('../../api');
      const data = await getMyScenarios();
      setMyScenarios(data.scenarios || []);
      console.log('📋 My scenarios loaded:', data.scenarios?.length || 0);
    } catch (error) {
      console.error('❌ Failed to load scenarios:', error);
      setMyScenarios([]);
    }
  }, [user?.id]);

  // Load scenarios when subscription is loaded
  useEffect(() => {
    if (!loading && !requiresUpgrade) {
      loadMyScenarios();
    }
  }, [loading, requiresUpgrade, loadMyScenarios]);

  // Handle scenario created from templates
  const handleScenarioCreated = useCallback((newScenario) => {
    console.log('🎭 ScenariosTab: New scenario created, refreshing list');
    loadMyScenarios();
  }, [loadMyScenarios]);

  // Handle "Create New" from MyScenariosPanel
  const handleCreateNew = useCallback(() => {
    setShowBlankCreator(true);
  }, []);

  // Handle starting a debate
  const handleStartDebate = useCallback((scenarioId) => {
    const scenario = myScenarios.find(s => s.id === scenarioId);
    if (scenario) {
      setActiveScenario(scenario);
    }
  }, [myScenarios]);

  // Handle closing chat window
  const handleCloseChatWindow = useCallback((nextScenario = null) => {
    if (nextScenario) {
    // Switch to new scenario immediately
      setActiveScenario(nextScenario);
    } else {
    // Just close
      setActiveScenario(null);
    }
    // ✅ If this was a Market Hub scenario, notify parent to clear it
    if (marketHubScenario && onMarketHubScenarioClosed) {
      console.log('🔄 Notifying ChatApp to clear Market Hub scenario');
      onMarketHubScenarioClosed();
    }
  }, [marketHubScenario, onMarketHubScenarioClosed]);

  const handleBlankCreatorClose = () => {
    setShowBlankCreator(false);
  };

  const handleBlankCreatorSuccess = (newScenario) => {
    console.log('✅ Blank scenario created:', newScenario);
    setShowBlankCreator(false);
    loadMyScenarios();
  };

  // ✅ ADDED: Payment handlers
  const handleUpgradeWithStripe = async () => {
    try {
      await PaymentRouter.redirectToCheckout({
        tier: 'unlimited',
        provider: 'stripe',
        triggerSource: 'scenarios_tab_upgrade_required'
      });
    } catch (error) {
      console.error('Stripe payment redirect failed:', error);
      alert('Unable to redirect to Stripe payment page. Please try again or contact support.');
    }
  };

  const handleUpgradeWithPayPal = async () => {
    try {
      await PaymentRouter.redirectToCheckout({
        tier: 'unlimited',
        provider: 'paypal',
        triggerSource: 'scenarios_tab_upgrade_required'
      });
    } catch (error) {
      console.error('PayPal payment redirect failed:', error);
      alert('Unable to redirect to PayPal payment page. Please try again or contact support.');
    }
  };

  // Theme toggle
  const toggleTheme = () => {
    setCurrentTheme(currentTheme === 'light' ? 'awakeverse' : 'light');
  };

  // Check if user is unlimited
  const isUnlimited = subscriptionData?.subscription?.tier === 'unlimited' || 
                     subscriptionData?.subscription?.tier_name === 'unlimited' ||
                     subscriptionData?.subscription?.unlimited === true;

  // DEFENSIVE: Show loading until subscription is loaded
  if (loading) {
    return (
      <div className="scenarios-tab-container">
        <div className="scenarios-loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading Verse Dialogues...</p>
        </div>
      </div>
    );
  }

  // ✅ EXCEPTION: Market Hub scenarios bypass this (freemium with limits)
  // This is the key line that was changed in index1.js that broke the flow
  if (requiresUpgrade && !marketHubScenario) {
    return (
      <div className={`scenarios-tab-container ${currentTheme === 'awakeverse' ? 'theme-awakeverse' : ''}`}>
        <ScenariosUpgradeRequired 
          onLearnMore={() => setShowEducationalModal(true)}
          onUpgradeWithStripe={handleUpgradeWithStripe}
          onUpgradeWithPayPal={handleUpgradeWithPayPal}
        />
        <EducationalUpgradeModal 
          isOpen={showEducationalModal}
          onClose={() => setShowEducationalModal(false)}
          onUpgradeWithStripe={handleUpgradeWithStripe}
          onUpgradeWithPayPal={handleUpgradeWithPayPal}
        />
      </div>
    );
  }

  // IF CHAT WINDOW IS ACTIVE, SHOW IT FULLSCREEN (TOP LEVEL)
  if (activeScenario) {
    return (
      <ScenarioChatWindow
        scenario={activeScenario}
        scenarios={myScenarios}  // ✅✅✅ ADDED: Full scenarios list for InfoPanel ✅✅✅
        onBack={handleCloseChatWindow}
        theme={currentTheme}
      />
    );
  }

  // MAIN CONTENT - User has unlimited access OR is using Market Hub scenario
  return (
    <div className={`scenarios-tab-container ${currentTheme === 'awakeverse' ? 'theme-awakeverse' : ''}`}>

      {/* ✅ Theme toggle — unchanged, floating */}
      <ThemeToggle
        currentTheme={currentTheme}
        onToggle={toggleTheme}
      />

      {/* ✅ NEW: Breadcrumb block — centered, title + subtitle + guide button */}
      <div className="scenarios-tab-breadcrumb">
        <span className="scenarios-tab-breadcrumb__title">Verse Dialogues</span>
        <span className="scenarios-tab-breadcrumb__subtitle">
          Orchestrate real multi-AI debates between characters of your choosing
        </span>
        <button
          className="scenarios-tab-breadcrumb__guide-btn"
          onClick={() => setShowGuide(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v1M12 11v5" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round"/>
          </svg>
          Dialogue Guide
        </button>
      </div>

      {/* ✅ NEW: Dialogue Guide modal */}
      <DialogueGuide
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        currentTheme={currentTheme}
      />

      <div className="scenarios-content">
        {/* Templates Gallery - unchanged */}
        <div className="gallery-section">
          <TemplatesGallery
            isUnlimited={isUnlimited}
            onUpgradeRequired={() => {}}
            currentScenarioCount={myScenarios.length}
            onScenarioCreated={handleScenarioCreated}
          />
        </div>

        <UseCaseCarousel />

        {/* My Scenarios Panel - unchanged */}
        <div className="scenarios-section">
          <MyScenariosPanel
            userId={user?.id}
            scenarios={myScenarios}
            onRefresh={loadMyScenarios}
            onCreateNew={handleCreateNew}
            onStartDebate={handleStartDebate}
            theme={currentTheme}
          />
        </div>
      </div>

      {/* Blank Scenario Creator - unchanged */}
      {showBlankCreator && (
        <ScenarioCreator
          template={null}
          isOpen={showBlankCreator}
          onClose={handleBlankCreatorClose}
          onSuccess={handleBlankCreatorSuccess}
          currentScenarioCount={myScenarios.length}
        />
      )}
    </div>
  );
}

// ============================================================================
// UPDATED UPGRADE REQUIRED COMPONENT - Replace lines 294-361 in index.jsx
// Market Hub Pattern with Light/Dark Mode
// ============================================================================

const ScenariosUpgradeRequired = ({ onLearnMore, onUpgradeWithStripe, onUpgradeWithPayPal }) => {
  // Dark mode as default
  const [isDark, setIsDark] = React.useState(true);

  // Load saved theme preference
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('dialogueTheme');
    if (savedTheme === 'light') {
      setIsDark(false);
    }
  }, []);

  // Toggle theme and save preference
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('dialogueTheme', newTheme ? 'dark' : 'light');
  };

  // Scroll to pricing section
  const scrollToPricing = () => {
    const pricingSection = document.getElementById('dialogue-pricing-section');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={`dialogue-upgrade-container ${isDark ? 'theme-dark' : 'theme-light'}`}>
      <div className="dialogue-content-wrapper">

        {/* STICKY HEADER */}
        <header className="dialogue-page-header">
          <a href="#" className="dialogue-back-button" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Hub
          </a>

          <button className="dialogue-theme-toggle" onClick={toggleTheme}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isDark ? (
                <>
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </>
              ) : (
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              )}
            </svg>
            <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </header>

        {/* HERO SECTION */}
        <section className="dialogue-hero-section">
          <div className="dialogue-hero-content">
            <h1 className="dialogue-hero-title">Unlock Verse Dialogue</h1>
            <p className="dialogue-hero-subtitle">
              Create multi-character debates between historical figures, philosophers, and AI personalities. 
              Access 20+ curated templates and unlimited custom scenarios.
            </p>

            {/* Scroll to pricing button */}
            <button 
              className="dialogue-scroll-to-pricing" 
              onClick={scrollToPricing}
              aria-label="Scroll to pricing"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>

          {/* Hero Image */}
          <div className="dialogue-hero-image-container">
            <img 
              src="/images/upgrade-dialogues-hero.jpg" 
              alt="Dialogue Hub Preview" 
              className="dialogue-hero-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="dialogue-hero-image-fallback">
              Preview: Multi-character debates & scenarios
            </div>
          </div>
        </section>

        {/* KEY FEATURES */}
        <section className="dialogue-features-section">
          <h2 className="dialogue-section-title">Powerful Dialogue Features</h2>
          <div className="dialogue-features-grid">
            
            <div className="dialogue-feature-card">
              <span className="dialogue-feature-icon">👥</span>
              <h3 className="dialogue-feature-title">Multi-Character Debates</h3>
              <p className="dialogue-feature-description">
                Orchestrate conversations between 2-5 AI characters simultaneously. Watch them debate, 
                challenge ideas, and build on each other's arguments.
              </p>
            </div>

            <div className="dialogue-feature-card">
              <span className="dialogue-feature-icon">📚</span>
              <h3 className="dialogue-feature-title">Curated Templates</h3>
              <p className="dialogue-feature-description">
                Choose from 20+ expertly crafted templates spanning philosophy, ethics, business, 
                science, and politics. Start debates instantly.
              </p>
            </div>

            <div className="dialogue-feature-card">
              <span className="dialogue-feature-icon">🎨</span>
              <h3 className="dialogue-feature-title">Custom Scenarios</h3>
              <p className="dialogue-feature-description">
                Build your own dialogue scenarios from scratch. Choose characters, set the context, 
                and define debate objectives.
              </p>
            </div>

            <div className="dialogue-feature-card">
              <span className="dialogue-feature-icon">🧠</span>
              <h3 className="dialogue-feature-title">Intelligent Moderation</h3>
              <p className="dialogue-feature-description">
                AI-powered facilitation keeps debates on track, ensures balanced participation, 
                and maintains philosophical depth.
              </p>
            </div>

            <div className="dialogue-feature-card">
              <span className="dialogue-feature-icon">💾</span>
              <h3 className="dialogue-feature-title">Continue Anytime</h3>
              <p className="dialogue-feature-description">
                Pause debates anytime and pick up where you left off. Build a library of ongoing 
                philosophical conversations.
              </p>
            </div>

            <div className="dialogue-feature-card">
              <span className="dialogue-feature-icon">🚀</span>
              <h3 className="dialogue-feature-title">Priority Access</h3>
              <p className="dialogue-feature-description">
                Get early access to new debate formats, exclusive templates, and experimental 
                multi-AI features.
              </p>
            </div>

          </div>
        </section>

        {/* TEMPLATE PREVIEW GALLERY */}
        <section className="dialogue-preview-section">
          <h2 className="dialogue-section-title">Featured Dialogue Templates</h2>
          <div className="dialogue-preview-grid">
            
            <div className="dialogue-preview-card">
              <div className="dialogue-preview-image-wrapper">
                <img 
                  src="/images/template-philosophy.jpg" 
                  alt="Philosophy Template" 
                  className="dialogue-preview-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="dialogue-preview-image-fallback">
                  Philosophy Summit
                </div>
              </div>
              <div className="dialogue-preview-content">
                <h3 className="dialogue-preview-title">Philosophy Summit</h3>
                <p className="dialogue-preview-description">
                  Socrates, Nietzsche, and Confucius debate the nature of truth and virtue.
                </p>
                <span className="dialogue-preview-badge">3 Characters</span>
              </div>
            </div>

            <div className="dialogue-preview-card">
              <div className="dialogue-preview-image-wrapper">
                <img 
                  src="/images/template-business.jpg" 
                  alt="Business Template" 
                  className="dialogue-preview-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="dialogue-preview-image-fallback">
                  Tech Titans
                </div>
              </div>
              <div className="dialogue-preview-content">
                <h3 className="dialogue-preview-title">Tech Titans Debate</h3>
                <p className="dialogue-preview-description">
                  Steve Jobs, Elon Musk, and Bill Gates discuss innovation strategy.
                </p>
                <span className="dialogue-preview-badge">3 Characters</span>
              </div>
            </div>

            <div className="dialogue-preview-card">
              <div className="dialogue-preview-image-wrapper">
                <img 
                  src="/images/template-ethics.jpg" 
                  alt="Ethics Template" 
                  className="dialogue-preview-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="dialogue-preview-image-fallback">
                  Ethics Council
                </div>
              </div>
              <div className="dialogue-preview-content">
                <h3 className="dialogue-preview-title">Ethics Council</h3>
                <p className="dialogue-preview-description">
                  Kant, Bentham, and Aristotle examine modern moral dilemmas.
                </p>
                <span className="dialogue-preview-badge">3 Characters</span>
              </div>
            </div>

            <div className="dialogue-preview-card">
              <div className="dialogue-preview-image-wrapper">
                <img 
                  src="/images/template-science.jpg" 
                  alt="Science Template" 
                  className="dialogue-preview-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="dialogue-preview-image-fallback">
                  Science Symposium
                </div>
              </div>
              <div className="dialogue-preview-content">
                <h3 className="dialogue-preview-title">Science Symposium</h3>
                <p className="dialogue-preview-description">
                  Einstein, Hawking, and Curie discuss quantum mechanics and reality.
                </p>
                <span className="dialogue-preview-badge">3 Characters</span>
              </div>
            </div>

          </div>
        </section>

        {/* BENEFITS LIST */}
        <section className="dialogue-benefits-section">
          <h2 className="dialogue-section-title">Everything Included</h2>
          <div className="dialogue-benefits-grid">
            <div className="dialogue-benefit-item">
              <span className="dialogue-benefit-icon">✓</span>
              <span className="dialogue-benefit-text">Unlimited Dialogue Scenarios</span>
            </div>
            <div className="dialogue-benefit-item">
              <span className="dialogue-benefit-icon">✓</span>
              <span className="dialogue-benefit-text">20+ Curated Templates</span>
            </div>
            <div className="dialogue-benefit-item">
              <span className="dialogue-benefit-icon">✓</span>
              <span className="dialogue-benefit-text">Multi-Character Debates (2-5)</span>
            </div>
            <div className="dialogue-benefit-item">
              <span className="dialogue-benefit-icon">✓</span>
              <span className="dialogue-benefit-text">Custom Scenario Builder</span>
            </div>
            <div className="dialogue-benefit-item">
              <span className="dialogue-benefit-icon">✓</span>
              <span className="dialogue-benefit-text">Save & Resume Conversations</span>
            </div>
            <div className="dialogue-benefit-item">
              <span className="dialogue-benefit-icon">✓</span>
              <span className="dialogue-benefit-text">AI-Powered Moderation</span>
            </div>
            <div className="dialogue-benefit-item">
              <span className="dialogue-benefit-icon">✓</span>
              <span className="dialogue-benefit-text">Priority Feature Access</span>
            </div>
            <div className="dialogue-benefit-item">
              <span className="dialogue-benefit-icon">✓</span>
              <span className="dialogue-benefit-text">Creator Hub Pro Access</span>
            </div>
          </div>
        </section>

        {/* PRICING & CTA */}
        <section className="dialogue-pricing-section" id="dialogue-pricing-section">
          <span className="dialogue-pricing-badge">Professional Tier</span>
          <h2 className="dialogue-pricing-title">Full Access to Verse Dialogues</h2>
          
          <div className="dialogue-pricing-amount">
            <span className="dialogue-price-value">£11.99</span>
            <span className="dialogue-price-period">/month</span>
          </div>

          <div className="dialogue-cta-buttons">
            <button className="dialogue-cta-button-primary" onClick={onUpgradeWithStripe}>
              💳 Upgrade with Stripe
            </button>
            <button className="dialogue-cta-button-secondary" onClick={onUpgradeWithPayPal}>
              🅿️ Pay with PayPal
            </button>
          </div>

          <button className="dialogue-cta-button-tertiary" onClick={onLearnMore}>
            Learn About All Features
          </button>

          <div className="dialogue-pricing-footer">
            <p>⭐ <strong>Secure payments</strong> · Cancel anytime · 30-day guarantee</p>
          </div>
        </section>

        {/* TESTIMONIAL */}
        <section className="dialogue-testimonial-section">
          <p className="dialogue-testimonial-quote">
            "The Dialogue Hub transformed how I approach philosophical inquiry. Seeing Kant and Mill 
            debate in real-time helped me understand ethical frameworks in ways textbooks never could."
          </p>
          <p className="dialogue-testimonial-author">— Alexandra Uzor, Salford University</p>
        </section>

      </div>
    </div>
  );
};

// ============================================================================
// UPDATED EDUCATIONAL UPGRADE MODAL - Replace lines 363-471 in index.jsx
// Market Hub Pattern with Light/Dark Mode
// ============================================================================

const EducationalUpgradeModal = ({ isOpen, onClose, onUpgradeWithStripe, onUpgradeWithPayPal }) => {
  if (!isOpen) return null;

  // Get theme from parent container
  const [isDark, setIsDark] = React.useState(true);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('dialogueTheme');
    if (savedTheme === 'light') {
      setIsDark(false);
    }
  }, []);

  const unlimitedFeatures = [
    {
      icon: '🎭',
      title: 'Verse Dialogue Hub',
      description: 'Full access to multi-character debates and 20+ Dialogue templates'
    },
    {
      icon: '👥',
      title: 'Multi-AI Conversations',
      description: 'Create dynamic debates between multiple AI characters'
    },
    {
      icon: '📚',
      title: 'Educational Templates',
      description: 'Philosophy, ethics, business, and science debate scenarios'
    },
    {
      icon: '💎',
      title: 'Creator Hub Pro',
      description: 'Publish characters and track detailed analytics'
    },
    {
      icon: '🚀',
      title: 'Priority Featuring',
      description: 'Your Dialogues get promoted in discovery'
    },
    {
      icon: '⚡',
      title: 'Unlimited Everything',
      description: 'No limits on Dialogues, characters, or messages'
    }
  ];

  return (
    <div className="dialogue-modal-overlay" onClick={onClose}>
      <div 
        className={`dialogue-modal-content ${isDark ? 'theme-dark' : 'theme-light'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button className="dialogue-modal-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        
        {/* Modal Header */}
        <div className="dialogue-modal-header">
          <div className="dialogue-modal-icon">🚀</div>
          <h2 className="dialogue-modal-title">Unlock Advanced AI Conversations</h2>
          <p className="dialogue-modal-subtitle">
            Upgrade to Professional tier and create dynamic multi-character debates
          </p>
        </div>

        {/* Features Grid */}
        <div className="dialogue-modal-features">
          {unlimitedFeatures.map((feature, index) => (
            <div key={index} className="dialogue-modal-feature-row">
              <div className="dialogue-modal-feature-icon">{feature.icon}</div>
              <div className="dialogue-modal-feature-text">
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Card */}
        <div className="dialogue-modal-pricing-card">
          <div className="dialogue-modal-pricing-header">
            <span className="dialogue-modal-pricing-badge">Professional Plan</span>
            <div className="dialogue-modal-price">
              <span className="dialogue-modal-price-amount">£11.99</span>
              <span className="dialogue-modal-price-period">/month</span>
            </div>
          </div>
          
          <div className="dialogue-modal-pricing-features">
            <div className="dialogue-modal-pricing-feature">✓ Unlimited Dialogues</div>
            <div className="dialogue-modal-pricing-feature">✓ Multi-Character Debates</div>
            <div className="dialogue-modal-pricing-feature">✓ 20+ Dialogue Templates</div>
            <div className="dialogue-modal-pricing-feature">✓ Creator Hub Pro Tools</div>
            <div className="dialogue-modal-pricing-feature">✓ All Premium Features</div>
            <div className="dialogue-modal-pricing-feature">✓ VIP Support</div>
          </div>

          <div className="dialogue-modal-pricing-actions">
            <button 
              className="dialogue-modal-cta-button primary"
              onClick={onUpgradeWithStripe}
            >
              💳 Upgrade with Stripe - £11.99/month
            </button>
            <button 
              className="dialogue-modal-cta-button secondary"
              onClick={onUpgradeWithPayPal}
            >
              🅿️ Pay with PayPal - £11.99/month
            </button>
            <button 
              className="dialogue-modal-compare-button"
              onClick={() => window.open('/pricing', '_blank')}
            >
              Compare All Plans
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="dialogue-modal-footer">
          <p>⭐ <strong>Payment secured by Stripe & PayPal</strong> · Cancel anytime</p>
        </div>
      </div>
    </div>
  );
};