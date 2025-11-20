// src/components/CreatorHub/CreatorDashboard.jsx
// PRODUCTION-READY WITH MODAL CREATION FLOW

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useAppView } from '../../contexts/AppViewContext';
import api from '../../api';
import { 
  Eye, Heart, Bookmark, Share2, MessageCircle, 
  TrendingUp, Calendar, Users, BarChart3, 
  Sparkles, BookOpen, Zap, Crown
} from 'lucide-react';

// Import modal components
import TemplateGallery from '../TemplateGallery';
import CharacterBuilder from '../CharacterBuilder';
import CharacterCreationSuccess from '../CharacterCreationSuccess';

import PaymentRouter from '../../services/PaymentRouter';
import './CreatorDashboard.css';

const CreatorDashboard = () => {
  const { user } = useUser();
  const { switchView, VIEW_STATES } = useAppView();
  
  // Dashboard state
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  
  // Character creation modal state
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Educational modal state
  const [showEducationalModal, setShowEducationalModal] = useState(false);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!user) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setRequiresUpgrade(false);

      const response = await api.get('/creator-hub/analytics/dashboard');
      
      if (response.data && response.data.status === 'success') {
        const dashboard = response.data.dashboard || {};
        const characters = dashboard.characters || [];
        const summary = dashboard.summary || {
          total_characters: 0,
          total_views: 0,
          total_likes: 0,
          total_bookmarks: 0,
          total_shares: 0,
          total_chat_sessions: 0,
          total_engagements: 0,
          avg_engagement_rate: 0
        };
        
        setDashboardData({
          summary,
          characters,
          engagement_trends: dashboard.engagement_trends || [],
          recent_achievements: dashboard.recent_achievements || [],
          creator_info: dashboard.creator_info || {}
        });
      } else {
        throw new Error('Invalid dashboard response');
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
      if (err.response?.status === 403) {
        setRequiresUpgrade(true);
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to load dashboard');
      }
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ============================================================================
  // CHARACTER CREATION HANDLERS (Modal Flow)
  // ============================================================================

  const handleCreateCharacter = () => {
    setShowTemplates(true);
  };

  const handleTemplateSelect = useCallback((template) => {
    setSelectedTemplate(template);
    setShowTemplates(false);
    setShowBuilder(true);
  }, []);

  const handleCharacterCreationComplete = useCallback(() => {
    setShowBuilder(false);
    setShowSuccess(true);
    // Reload dashboard data to show new character
    loadDashboardData();
  }, [loadDashboardData]);

  const handleCloseCreationFlow = useCallback(() => {
    setShowTemplates(false);
    setShowBuilder(false);
    setShowSuccess(false);
    setSelectedTemplate(null);
  }, []);

  // ============================================================================
  // VIEW SWITCHING HANDLERS
  // ============================================================================

  const handleCreateStory = () => {
    switchView(VIEW_STATES.STORY_MODE);
  };

  const handleCreateScenario = () => {
    switchView(VIEW_STATES.SCENARIOS);
  };

  const handleViewMarketHub = () => {
    switchView(VIEW_STATES.MARKET_HUB);
  };

  const handleGoToCharacters = () => {
    switchView(VIEW_STATES.CHAT);
  };

  // ============================================================================
  // PAYMENT HANDLERS
  // ============================================================================

  const handleUpgradeWithStripe = async () => {
    try {
      await PaymentRouter.redirectToCheckout({
        tier: 'unlimited',
        provider: 'stripe',
        triggerSource: 'creator_dashboard'
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
        triggerSource: 'creator_dashboard'
      });
    } catch (error) {
      console.error('PayPal payment redirect failed:', error);
      alert('Unable to redirect to PayPal payment page. Please try again or contact support.');
    }
  };

  const handleComparePlans = () => {
    handleUpgradeWithStripe();
  };

  const handleViewInMarketHub = (characterKey) => {
    window.open(`/market-hub?character=${characterKey}`, '_blank');
  };

  // ============================================================================
  // CHARACTER CREATION MODALS (Overlay Flow)
  // ============================================================================

  if (showSuccess) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 4000,
        background: 'rgba(0, 0, 0, 0.95)'
      }}>
        <CharacterCreationSuccess onClose={handleCloseCreationFlow} />
      </div>
    );
  }

  if (showTemplates) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 3000,
        background: 'rgba(0, 0, 0, 0.95)',
        overflowY: 'auto'
      }}>
        <TemplateGallery 
          onSelectTemplate={handleTemplateSelect}
          onClose={handleCloseCreationFlow}
        />
      </div>
    );
  }

  if (showBuilder && selectedTemplate) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 3000,
        background: 'rgba(0, 0, 0, 0.95)'
      }}>
        <CharacterBuilder 
          template={selectedTemplate}
          onClose={handleCloseCreationFlow}
          onSuccess={handleCharacterCreationComplete}
        />
      </div>
    );
  }

  // ============================================================================
  // MAIN DASHBOARD RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="creator-dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <p>Loading your Creator Hub dashboard...</p>
        </div>
      </div>
    );
  }

  if (requiresUpgrade) {
    return (
      <div className="creator-dashboard">
        <UpgradeRequiredState 
          onLearnMore={() => setShowEducationalModal(true)}
          onUpgradeWithStripe={handleUpgradeWithStripe}
          onUpgradeWithPayPal={handleUpgradeWithPayPal}
        />
        <EducationalUpgradeModal 
          isOpen={showEducationalModal}
          onClose={() => setShowEducationalModal(false)}
          onUpgradeWithStripe={handleUpgradeWithStripe}
          onUpgradeWithPayPal={handleUpgradeWithPayPal}
          onComparePlans={handleComparePlans}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="creator-dashboard">
        <div className="dashboard-error">
          <h2>Unable to Load Dashboard</h2>
          <p>{error}</p>
          <button onClick={loadDashboardData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData || !dashboardData.characters || dashboardData.characters.length === 0) {
    return (
      <div className="creator-dashboard">
        <EmptyDashboardState 
          onLearnMore={() => setShowEducationalModal(true)}
          onGoToCharacters={handleGoToCharacters}
          onCreateCharacter={handleCreateCharacter}
        />
        <EducationalUpgradeModal 
          isOpen={showEducationalModal}
          onClose={() => setShowEducationalModal(false)}
          onUpgradeWithStripe={handleUpgradeWithStripe}
          onUpgradeWithPayPal={handleUpgradeWithPayPal}
          onComparePlans={handleComparePlans}
        />
      </div>
    );
  }

  const { summary, characters, engagement_trends, recent_achievements, creator_info } = dashboardData;

  return (
    <div className="creator-dashboard">
      {/* ========= HEADER ========= */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Creator Hub</h1>
          <p>Welcome back, {user?.displayName || 'Creator'}! Track your characters' performance.</p>
        </div>
        <div className="header-actions">
          <button onClick={loadDashboardData} className="refresh-button">
            <Zap size={16} />
            Refresh Data
          </button>
        </div>
      </header>

      {/* ========= QUICK STATS CARDS ========= */}
      <section className="stats-section">
        <div className="section-header">
          <h2>Performance Overview</h2>
          <span className="section-subtitle">Last 30 days</span>
        </div>
        <div className="stats-grid">
          <StatCard
            icon={<Eye size={20} />}
            label="Total Views"
            value={summary.total_views || 0}
            trend="+12%"
            color="#6366F1"
          />
          <StatCard
            icon={<Heart size={20} />}
            label="Total Likes"
            value={summary.total_likes || 0}
            trend="+8%"
            color="#EF4444"
          />
          <StatCard
            icon={<Bookmark size={20} />}
            label="Total Bookmarks"
            value={summary.total_bookmarks || 0}
            trend="+15%"
            color="#F59E0B"
          />
          <StatCard
            icon={<Share2 size={20} />}
            label="Total Shares"
            value={summary.total_shares || 0}
            trend="+5%"
            color="#10B981"
          />
          <StatCard
            icon={<MessageCircle size={20} />}
            label="Chat Sessions"
            value={summary.total_chat_sessions || 0}
            trend="+22%"
            color="#8B5CF6"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="Engagement Rate"
            value={`${summary.avg_engagement_rate || 0}%`}
            trend="+3%"
            color="#06B6D4"
          />
        </div>
      </section>

      <div className="dashboard-content">
        {/* ========= MAIN CONTENT AREA ========= */}
        <main className="main-content">
          {/* CHARACTERS GRID */}
          <section className="characters-section">
            <div className="section-header">
              <h2>Your Characters</h2>
              <span className="section-subtitle">
                {characters.length} published characters
              </span>
            </div>
            
            <div className="characters-grid">
              {characters.map(character => (
                <CharacterCard
                  key={character.character_id}
                  character={character}
                  onClick={() => setSelectedCharacter(character)}
                />
              ))}
            </div>
          </section>

          {/* ENGAGEMENT TRENDS */}
          {engagement_trends && engagement_trends.length > 0 && (
            <section className="trends-section">
              <div className="section-header">
                <h2>Engagement Trends</h2>
                <span className="section-subtitle">Last 14 days performance</span>
              </div>
              <EngagementChart data={engagement_trends} />
            </section>
          )}
        </main>

        {/* ========= SIDEBAR ========= */}
        <aside className="dashboard-sidebar">
          {/* QUICK ACTIONS */}
          <section className="actions-panel">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              {/* PRIMARY: CREATE CHARACTER */}
              <button className="action-btn primary" onClick={handleCreateCharacter}>
                <Sparkles size={16} />
                Create New Character
              </button>

              {/* SECONDARY: CREATE STORY */}
              <button 
                className="action-btn secondary" 
                onClick={handleCreateStory}
              >
                <BookOpen size={16} />
                Create Story
              </button>

              {/* SECONDARY: CREATE SCENARIO */}
              <button 
                className="action-btn secondary" 
                onClick={handleCreateScenario}
              >
                <Users size={16} />
                Create Scenario
              </button>

              {/* SECONDARY: MARKET HUB */}
              <button className="action-btn secondary" onClick={handleViewMarketHub}>
                <BarChart3 size={16} />
                View Market Hub
              </button>
            </div>
          </section>

          {/* RECENT ACHIEVEMENTS */}
          {recent_achievements && recent_achievements.length > 0 && (
            <section className="achievements-panel">
              <h3>Recent Achievements</h3>
              <div className="achievements-list">
                {recent_achievements.slice(0, 3).map((achievement, index) => (
                  <div key={index} className="achievement-item">
                    <div className="achievement-icon">🏆</div>
                    <div className="achievement-content">
                      <div className="achievement-title">{achievement.title}</div>
                      <div className="achievement-date">
                        {new Date(achievement.earned_at || achievement.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CREATOR LEVEL */}
          <section className="level-panel">
            <h3>Creator Level</h3>
            <div className="level-display">
              <div className="level-icon">
                <Crown size={24} />
              </div>
              <div className="level-info">
                <div className="level-name">{creator_info.level || 'Rising Star'}</div>
                <div className="level-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${creator_info.progress || 45}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    {creator_info.progress || 45}% to next level
                  </span>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* ========= MODALS ========= */}
      {selectedCharacter && (
        <CharacterDetailModal
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
          onViewInHub={handleViewInMarketHub}
        />
      )}

      <EducationalUpgradeModal 
        isOpen={showEducationalModal}
        onClose={() => setShowEducationalModal(false)}
        onUpgradeWithStripe={handleUpgradeWithStripe}
        onUpgradeWithPayPal={handleUpgradeWithPayPal}
        onComparePlans={handleComparePlans}
      />
    </div>
  );
};

// ========= SUBCOMPONENTS =========

const StatCard = ({ icon, label, value, trend, color }) => (
  <div className="stat-card">
    <div className="stat-header">
      <div className="stat-icon" style={{ color }}>
        {icon}
      </div>
      <div className="stat-trend" style={{ color: trend.startsWith('+') ? '#10B981' : '#EF4444' }}>
        {trend}
      </div>
    </div>
    <div className="stat-content">
      <div className="stat-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

const CharacterCard = ({ character, onClick }) => {
  const engagement = character.engagement || {};
  
  return (
    <div className="character-card" onClick={onClick}>
      <div className="character-header">
        <img
          src={character.avatar_url || '/images/default-character.jpg'}
          alt={character.display_name}
          className="character-avatar"
          onError={(e) => {
            e.target.src = '/images/default-character.jpg';
          }}
        />
        <div className="character-info">
          <h3 className="character-name">{character.display_name || 'Unnamed Character'}</h3>
          <span className="character-level">{character.creator_level || 'newcomer'}</span>
        </div>
      </div>
      
      {character.short_description && (
        <p className="character-description">{character.short_description}</p>
      )}
      
      <div className="engagement-metrics">
        <div className="metric-row">
          <div className="metric">
            <Eye size={14} />
            <span>{engagement.total_views || 0}</span>
          </div>
          <div className="metric">
            <Heart size={14} />
            <span>{engagement.total_likes || 0}</span>
          </div>
          <div className="metric">
            <MessageCircle size={14} />
            <span>{engagement.chat_sessions || 0}</span>
          </div>
        </div>
      </div>
      
      <div className="engagement-rate">
        <TrendingUp size={14} />
        <span>{engagement.engagement_rate || 0}% engagement rate</span>
      </div>
    </div>
  );
};

const EngagementChart = ({ data }) => (
  <div className="engagement-chart">
    <div className="chart-container">
      {data.slice(0, 14).reverse().map((day, index) => (
        <div key={index} className="chart-bar-container">
          <div className="chart-date">
            {new Date(day.date).getDate()}
          </div>
          <div className="chart-bars">
            <div 
              className="chart-bar views" 
              style={{ height: `${((day.views || 0) / 100) * 100}%` }}
            />
            <div 
              className="chart-bar likes" 
              style={{ height: `${((day.likes || 0) / 100) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
    <div className="chart-legend">
      <div className="legend-item">
        <div className="legend-color views"></div>
        <span>Views</span>
      </div>
      <div className="legend-item">
        <div className="legend-color likes"></div>
        <span>Likes</span>
      </div>
    </div>
  </div>
);

// ========= EXISTING SUBCOMPONENTS =========

const UpgradeRequiredState = ({ onLearnMore, onUpgradeWithStripe, onUpgradeWithPayPal }) => (
  <div className="upgrade-required-state">
    <div className="upgrade-required-content">
      <span className="upgrade-icon">💎</span>
      <h2>Unlock Creator Hub</h2>
      <p>Upgrade to professional tier to access powerful creator analytics and publishing tools</p>
      
      <div className="upgrade-features-preview">
        <h3>With Professional Tier You Get:</h3>
        <div className="preview-features">
          <div className="preview-feature">
            <TrendingUp size={20} />
            <span>Real-time Analytics</span>
          </div>
          <div className="preview-feature">
            <Eye size={20} />
            <span>Engagement Tracking</span>
          </div>
          <div className="preview-feature">
            <Heart size={20} />
            <span>Performance Metrics</span>
          </div>
          <div className="preview-feature">
            <MessageCircle size={20} />
            <span>Chat Session Insights</span>
          </div>
          <div className="preview-feature">
            <Bookmark size={20} />
            <span>Bookmark & Share Analytics</span>
          </div>
          <div className="preview-feature">
            <Share2 size={20} />
            <span>Character Publishing</span>
          </div>
        </div>
      </div>

      <div className="upgrade-actions">
        <div className="upgrade-payment-options">
          <button 
            className="upgrade-button primary-upgrade"
            onClick={onUpgradeWithStripe}
          >
            💳 Upgrade with Stripe - £11.99/month
          </button>

          <button 
            className="upgrade-button secondary-upgrade"
            onClick={onUpgradeWithPayPal}
          >
            🅿️ Pay with PayPal
          </button>
        </div>

        <button 
          onClick={onLearnMore}
          className="learn-features-button"
        >
          Learn About All Features
        </button>
      </div>

      <div className="upgrade-footer">
        <p>⭐<strong>Secured by Stripe</strong> · 🅿️<strong>PayPal Secure</strong> · Cancel anytime</p>
      </div>
    </div>
  </div>
);

const EmptyDashboardState = ({ onLearnMore, onGoToCharacters, onCreateCharacter }) => (
  <div className="empty-state">
    <div className="empty-state-content">
      <span className="empty-state-icon">🎨</span>
      <h2>Welcome to Creator Hub!</h2>
      <p>You haven't published any characters to the Market Hub yet.</p>
      <div className="empty-state-steps">
        <h3>Get Started:</h3>
        <ol>
          <li>Create an amazing character in Character Builder</li>
          <li>Get it approved by our team</li>
          <li>Publish to Market Hub (Professional tier required)</li>
          <li>Track performance and earn recognition!</li>
        </ol>
      </div>
      <div className="empty-state-actions">
        <button 
          onClick={onCreateCharacter}
          className="create-character-button"
        >
          Create Character
        </button>
        <button 
          onClick={onGoToCharacters}
          className="learn-more-button"
        >
          My Characters
        </button>
        <button 
          onClick={onLearnMore}
          className="learn-more-button secondary"
        >
          Learn About Professional Features
        </button>
      </div>
    </div>
  </div>
);

const CharacterDetailModal = ({ character, onClose, onViewInHub }) => {
  const engagement = character.engagement || {};
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <img 
            src={character.avatar_url || '/images/default-character.jpg'} 
            alt={character.display_name} 
          />
          <div>
            <h2>{character.display_name}</h2>
            <p>{character.short_description}</p>
          </div>
        </div>

        <div className="modal-stats">
          <h3>Engagement Breakdown</h3>
          
          <div className="stats-grid-modal">
            <div className="stat-item">
              <Eye size={20} />
              <div>
                <div className="stat-number">{engagement.total_views || 0}</div>
                <div className="stat-label">Total Views</div>
              </div>
            </div>
            
            <div className="stat-item">
              <Heart size={20} />
              <div>
                <div className="stat-number">{engagement.total_likes || 0}</div>
                <div className="stat-label">Total Likes</div>
              </div>
            </div>
            
            <div className="stat-item">
              <Bookmark size={20} />
              <div>
                <div className="stat-number">{engagement.total_bookmarks || 0}</div>
                <div className="stat-label">Total Bookmarks</div>
              </div>
            </div>
            
            <div className="stat-item">
              <Share2 size={20} />
              <div>
                <div className="stat-number">{engagement.total_shares || 0}</div>
                <div className="stat-label">Total Shares</div>
              </div>
            </div>
            
            <div className="stat-item">
              <MessageCircle size={20} />
              <div>
                <div className="stat-number">{engagement.chat_sessions || 0}</div>
                <div className="stat-label">Chat Sessions</div>
              </div>
            </div>
          </div>

          <div className="engagement-rate-display">
            <TrendingUp size={24} />
            <div>
              <div className="rate-number">{engagement.engagement_rate || 0}%</div>
              <div className="rate-label">Engagement Rate</div>
            </div>
          </div>
        </div>

        <button 
          className="view-hub-button" 
          onClick={() => onViewInHub(character.character_key)}
        >
          View in Market Hub
        </button>
      </div>
    </div>
  );
};

const EducationalUpgradeModal = ({ isOpen, onClose, onUpgradeWithStripe, onUpgradeWithPayPal, onComparePlans }) => {
  if (!isOpen) return null;

  const unlimitedFeatures = [
    {
      icon: '💎',
      title: 'Full Creator Hub Access',
      description: 'Publish unlimited characters and track detailed analytics'
    },
    {
      icon: '📊',
      title: 'Advanced Analytics',
      description: 'Real-time engagement metrics and performance insights'
    },
    {
      icon: '💰',
      title: 'Earn Monthly Payouts',
      description: 'Get paid based on your characters\' popularity and usage'
    },
    {
      icon: '🚀',
      title: 'Priority Featuring',
      description: 'Your characters get promoted in Market Hub'
    },
    {
      icon: '🎭',
      title: 'Scenarios Hub',
      description: 'Create multi-AI conversations and dynamic storylines'
    },
    {
      icon: '⚡',
      title: 'Unlimited Everything',
      description: 'No limits on characters, messages, or features'
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content educational-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="educational-header">
          <div className="educational-icon">🚀</div>
          <h2>Choose your plan and pay securely with Stripe or PayPal</h2>
          <p className="educational-subtitle">
            Upgrade to Professional tier and get access to powerful creator tools
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
            <h3>Professional Plan</h3>
            <div className="price">
              <span className="amount">£11.99</span>
              <span className="period">/month</span>
            </div>
          </div>
          
          <div className="pricing-features">
            <div className="pricing-feature">✓ Unlimited Characters</div>
            <div className="pricing-feature">✓ Unlimited Messages</div>
            <div className="pricing-feature">✓ Creator Hub Pro Tools</div>
            <div className="pricing-feature">✓ All Premium Templates</div>
            <div className="pricing-feature">✓ VIP Support</div>
            <div className="pricing-feature">✓ All Hub Access</div>
          </div>

          <div className="pricing-actions">
            <button 
              onClick={onUpgradeWithStripe}
              className="upgrade-now-button"
            >
              Pay with Stripe - £11.99/month
            </button>
            <button 
              onClick={onUpgradeWithPayPal}
              className="upgrade-now-button secondary"
            >
              Pay with PayPal - £11.99/month
            </button>
            <button 
              className="compare-plans-button"
              onClick={onComparePlans}
            >
              Compare All Plans
            </button>
          </div>
        </div>

        <div className="educational-footer">
          <p>⭐ <strong>Secured by Stripe</strong> · 🅿️ <strong>PayPal Secure</strong> · Cancel anytime</p>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;