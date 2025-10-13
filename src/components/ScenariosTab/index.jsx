// src/components/ScenariosTab/index.jsx - Complete Merged Version
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import SubscriptionService from '../../services/SubscriptionService';
import TemplatesGallery from './TemplatesGallery';
import MyScenariosPanel from './MyScenariosPanel';
import ScenarioCreator from './ScenarioCreator';
import ScenarioChatWindow from './ScenarioChatWindow';
import './ScenariosTab.css';

export default function ScenariosTab() {
  const { token } = useAuth();
  const { user } = useUser();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  const [showEducationalModal, setShowEducationalModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');
  const [myScenarios, setMyScenarios] = useState([]);
  const [showBlankCreator, setShowBlankCreator] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);

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
  const handleCloseChatWindow = useCallback(() => {
    setActiveScenario(null);
  }, []);

  const handleBlankCreatorClose = () => {
    setShowBlankCreator(false);
  };

  const handleBlankCreatorSuccess = (newScenario) => {
    console.log('✅ Blank scenario created:', newScenario);
    setShowBlankCreator(false);
    loadMyScenarios();
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
          <p>Loading Verse Scenarios...</p>
        </div>
      </div>
    );
  }

  // UPGRADE REQUIRED - User does not have unlimited tier
  if (requiresUpgrade) {
    return (
      <div className={`scenarios-tab-container ${currentTheme === 'awakeverse' ? 'theme-awakeverse' : ''}`}>
        <ScenariosUpgradeRequired onLearnMore={() => setShowEducationalModal(true)} />
        <EducationalUpgradeModal 
          isOpen={showEducationalModal}
          onClose={() => setShowEducationalModal(false)}
        />
      </div>
    );
  }

  // IF CHAT WINDOW IS ACTIVE, SHOW IT FULLSCREEN (TOP LEVEL)
  if (activeScenario) {
    return (
      <ScenarioChatWindow
        scenario={activeScenario}
        onBack={handleCloseChatWindow}
        theme={currentTheme}
      />
    );
  }

  // MAIN CONTENT - User has unlimited access
  return (
    <div className={`scenarios-tab-container ${currentTheme === 'awakeverse' ? 'theme-awakeverse' : ''}`}>
      {/* Theme toggle button */}
      <div className="scenarios-theme-toggle">
        <button onClick={toggleTheme}>
          {currentTheme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
      
      <div className="scenarios-content">
        {/* Templates Gallery - User has access */}
        <div className="gallery-section">
          <TemplatesGallery 
            isUnlimited={isUnlimited}
            onUpgradeRequired={() => {}} // No-op since user already has access
            currentScenarioCount={myScenarios.length}
            onScenarioCreated={handleScenarioCreated}
          />
        </div>

        {/* My Scenarios Panel - User has access */}
        <div className="scenarios-section">
          <MyScenariosPanel 
            token={token}
            userId={user?.id}
            scenarios={myScenarios}
            onRefresh={loadMyScenarios}
            onCreateNew={handleCreateNew}
            onStartDebate={handleStartDebate}
            theme={currentTheme}
          />
        </div>
      </div>

      {/* Blank Scenario Creator - opened from "Create New" button */}
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

// UPGRADE REQUIRED COMPONENT - Same pattern as CreatorDashboard
const ScenariosUpgradeRequired = ({ onLearnMore }) => (
  <div className="upgrade-required-state">
    <div className="upgrade-required-content">
      <span className="upgrade-icon">🎭</span>
      <h2>Unlock Verse Scenarios</h2>
      <p>Upgrade to Unlimited tier to access multi-character debates and scenario templates</p>
      
      <div className="upgrade-features-preview">
        <h3>With Unlimited Tier You Get:</h3>
        <div className="preview-features">
          <div className="preview-feature">
            <span className="feature-emoji">📚</span>
            <span>20+ Scenario Templates</span>
          </div>
          <div className="preview-feature">
            <span className="feature-emoji">👥</span>
            <span>Multi-Character Debates</span>
          </div>
          <div className="preview-feature">
            <span className="feature-emoji">💬</span>
            <span>Unlimited Questions</span>
          </div>
          <div className="preview-feature">
            <span className="feature-emoji">🎨</span>
            <span>Custom Scenario Creation</span>
          </div>
          <div className="preview-feature">
            <span className="feature-emoji">🚀</span>
            <span>Priority Access to New Features</span>
          </div>
          <div className="preview-feature">
            <span className="feature-emoji">💎</span>
            <span>All Creator Hub Features</span>
          </div>
        </div>
      </div>

      <div className="upgrade-actions">
        <button 
          onClick={() => window.location.href = '/profile-settings?tab=subscription'}
          className="upgrade-now-button"
        >
          Upgrade to Unlimited - $49.99/month
        </button>
        <button 
          onClick={onLearnMore}
          className="learn-features-button"
        >
          Learn About All Features
        </button>
      </div>

      <div className="upgrade-footer">
        <p>⭐ <strong>14-day money-back guarantee</strong> · Cancel anytime</p>
      </div>
    </div>
  </div>
);

// EDUCATIONAL MODAL - Same pattern as CreatorDashboard
const EducationalUpgradeModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const unlimitedFeatures = [
    {
      icon: '🎭',
      title: 'Verse Scenarios Hub',
      description: 'Full access to multi-character debates and 20+ scenario templates'
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
      description: 'Your scenarios get promoted in discovery'
    },
    {
      icon: '⚡',
      title: 'Unlimited Everything',
      description: 'No limits on scenarios, characters, or messages'
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content educational-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="educational-header">
          <div className="educational-icon">🚀</div>
          <h2>Unlock Advanced AI Conversations</h2>
          <p className="educational-subtitle">
            Upgrade to Unlimited tier and create dynamic multi-character debates
          </p>
        </div>

        <div className="educational-features">
          {unlimitedFeatures.map((feature, index) => (
            <div key={index} className="feature-row">
              <div className="feature-icon">{feature.icon}</div>
              <div className="feature-text">
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pricing-card">
          <div className="pricing-header">
            <h3>Unlimited Plan</h3>
            <div className="price">
              <span className="amount">$49.99</span>
              <span className="period">/month</span>
            </div>
          </div>
          
          <div className="pricing-features">
            <div className="pricing-feature">✓ Unlimited Scenarios</div>
            <div className="pricing-feature">✓ Multi-Character Debates</div>
            <div className="pricing-feature">✓ 20+ Scenario Templates</div>
            <div className="pricing-feature">✓ Creator Hub Pro Tools</div>
            <div className="pricing-feature">✓ All Premium Features</div>
            <div className="pricing-feature">✓ VIP Support</div>
          </div>

          <div className="pricing-actions">
            <button 
              className="upgrade-cta-button"
              onClick={() => window.location.href = '/profile-settings?tab=subscription'}
            >
              Upgrade to Unlimited - $49.99/month
            </button>
            <button 
              className="compare-plans-button"
              onClick={() => window.open('/pricing', '_blank')}
            >
              Compare All Plans
            </button>
          </div>
        </div>

        <div className="educational-footer">
          <p>⭐ <strong>14-day money-back guarantee</strong> · Cancel anytime</p>
        </div>
      </div>
    </div>
  );
};