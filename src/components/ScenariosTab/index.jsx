// src/components/ScenariosTab/index.jsx - USE DIRECT AXIOS INSTANCE
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import api from '../../api'; // Import the axios instance directly
import TemplatesGallery from './TemplatesGallery';
import MyScenariosPanel from './MyScenariosPanel';
import './ScenariosTab.css';

export default function ScenariosTab() {
  const { token } = useAuth();
  const { user } = useUser();
  const [componentError, setComponentError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  const [showEducationalModal, setShowEducationalModal] = useState(false);

  // USE DIRECT AXIOS INSTANCE LIKE CREATOR DASHBOARD
  const loadScenariosData = useCallback(async () => {
    if (!token) {
      setComponentError('Authentication required');
      setIsInitialized(true);
      return;
    }

    try {
      setComponentError(null);
      setRequiresUpgrade(false);

      // DIRECT AXIOS CALL - SAME AS CREATOR DASHBOARD
      const response = await api.get('/debate/templates');
      
      // If we get here, user has access
      setRequiresUpgrade(false);
      console.log('✅ User has access to Scenarios');
      
    } catch (err) {
      // Same 403 detection as CreatorDashboard
      if (err.response?.status === 403) {
        setRequiresUpgrade(true);
      } else {
        setComponentError(err.response?.data?.error || err.message || 'Failed to load scenarios');
      }
    } finally {
      setIsInitialized(true);
    }
  }, [token]);
  // Initialize - same pattern as CreatorDashboard
  useEffect(() => {
    loadScenariosData();
  }, [loadScenariosData]);

  // Theme toggle - keep existing functionality
  const toggleTheme = () => {
    setCurrentTheme(currentTheme === 'light' ? 'awakeverse' : 'light');
  };

  // DEFENSIVE: Render error state
  if (componentError) {
    return (
      <div className="scenarios-tab-container">
        <div className="scenarios-error-state">
          <div className="error-content">
            <h3>⚠️ Unable to Load Scenarios</h3>
            <p>There was an issue loading the scenarios feature.</p>
            <div className="error-details">
              <code>{componentError}</code>
            </div>
            <button 
              className="retry-button"
              onClick={loadScenariosData}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DEFENSIVE: Show loading until fully initialized
  if (!isInitialized) {
    return (
      <div className="scenarios-tab-container">
        <div className="scenarios-loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading Verse Scenarios...</p>
        </div>
      </div>
    );
  }

  // UPGRADE REQUIRED - same pattern as CreatorDashboard
  if (requiresUpgrade) {
    return (
      <div className="scenarios-tab-container">
        <ScenariosUpgradeRequired onLearnMore={() => setShowEducationalModal(true)} />
        <EducationalUpgradeModal 
          isOpen={showEducationalModal}
          onClose={() => setShowEducationalModal(false)}
        />
      </div>
    );
  }

  // MAIN CONTENT - User has access
  try {
    return (
      <div className={`scenarios-tab-container ${currentTheme === 'awakeverse' ? 'theme-awakeverse' : ''}`}>
        {/* Theme toggle button */}
        <div className="scenarios-theme-toggle">
          <button onClick={toggleTheme}>
            {currentTheme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
        
        <div className="scenarios-content">
          {/* Templates Gallery */}
          <div className="gallery-section">
            <TemplatesGallery 
              onUpgradeRequired={() => setRequiresUpgrade(true)} // Fallback
            />
          </div>

          {/* My Scenarios Panel - User has access so show it */}
          <div className="scenarios-section">
            <MyScenariosPanel 
              token={token}
              userId={user?.id || 'unknown'}
              onCreateNew={() => {
                console.log('Navigate to template gallery');
              }}
            />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    // Ultimate fallback - if even the render fails
    console.error('❌ CRITICAL: ScenariosTab render failed:', error);
    return (
      <div className="scenarios-tab-container">
        <div className="scenarios-critical-error">
          <h3>🚨 Critical Error</h3>
          <p>The scenarios feature encountered a critical error and cannot be displayed.</p>
          <button 
            onClick={() => window.location.reload()}
            className="reload-button"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
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