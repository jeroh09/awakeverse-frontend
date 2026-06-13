// src/components/CreatorHub/CreatorDashboard.jsx
// PRODUCTION-READY WITH MODAL CREATION FLOW

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useAppView } from '../../contexts/AppViewContext';
import BusinessModePanel from './BusinessModePanel';
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

  //business mode sectionn
  const [hubMode, setHubMode] = useState('creator');

  
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
        <InteractiveLockedDashboard 
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

          {/* ── Unified control pill: Refresh | Creator | Business ── */}
          <div className="hub-control-bar">

            <button
              className="hub-seg hub-seg-refresh"
              onClick={loadDashboardData}
              title="Refresh dashboard data"
            >
              <Zap size={13} />
              Refresh
            </button>

            <div className="hub-control-divider" />

            <button
              className={`hub-seg${hubMode === 'creator' ? ' hub-seg--active' : ''}`}
              onClick={() => setHubMode('creator')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3 6.5 7 1-5 5 1.18 7L12 18l-6.18 3.5L7 14.5 2 9.5l7-1z"/>
              </svg>
              Creator
            </button>

            <button
              className={`hub-seg${hubMode === 'business' ? ' hub-seg--active' : ''}`}
              onClick={() => setHubMode('business')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="15" rx="2"/>
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              </svg>
              Business
            </button>

          </div>
        </header>

        {hubMode === 'business' ? (
          <BusinessModePanel />
        ) : (
          <>
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
                    <button className="action-btn primary" onClick={handleCreateCharacter}>
                      <Sparkles size={16} />
                      Create New Character
                    </button>
                    <button className="action-btn secondary" onClick={handleCreateStory}>
                      <BookOpen size={16} />
                      Create Story
                    </button>
                    <button className="action-btn secondary" onClick={handleCreateScenario}>
                      <Users size={16} />
                      Create Dialogue
                    </button>
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
          </>
        )}
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
// ========= INTERACTIVE LOCKED DASHBOARD =========

const InteractiveLockedDashboard = ({ onUpgradeWithStripe, onUpgradeWithPayPal }) => {
  const [selectedPreview, setSelectedPreview] = useState('engagement');
  const [selectedPayment, setSelectedPayment] = useState('stripe');
  const [isLocked, setIsLocked] = useState(true);

  const previewData = {
    engagement: {
      title: "Engagement Analytics",
      description: "With Pro: Track real-time engagement, user demographics, and conversation trends to optimize your characters.",
      image: "/images/creatorhub/engagement_analytics.jpg"
    },
    marketHub: {
      title: "Market Hub Featuring",
      description: "With Pro: Get featured in prime slots, reach 10x more users, and get priority in search results.",
      image: "/images/creatorhub/market_hub_featuring.jpg"
    },
    payouts: {
      title: "Monthly Payouts",
      description: "With Pro: Earn from every chat session, track revenue in real-time, and get monthly payouts via Stripe or PayPal.",
      image: "/images/creatorhub/payouts_earnings_dashboard.jpg"  // NEW!
    }
  };

  const handlePreviewSelect = (preview) => {
    setSelectedPreview(preview);
    if (isLocked) {
      setIsLocked(false);
    }
  };

  const handleUpgrade = () => {
    if (selectedPayment === 'stripe') {
      onUpgradeWithStripe();
    } else {
      onUpgradeWithPayPal();
    }
  };

  const currentPreview = previewData[selectedPreview];

  return (
    <div className="locked-dashboard-preview">
      <div className="locked-dashboard-container">
        {/* Header */}
        <div className="locked-dashboard-header">
          <button 
            className="locked-close-button"
            onClick={() => window.history.back()}
          >
            ×
          </button>
          <h1>Creator Hub Pro Dashboard Preview</h1>
          <p>See what you're missing. Upgrade to unlock powerful analytics, higher earnings, and priority featuring.</p>
        </div>

        {/* Main Content */}
        <div className="locked-dashboard-content">
          {/* Left: Interactive Preview */}
          <div className="locked-preview-section">
            <div className="locked-preview-header">
              <h2>Locked Dashboard Preview</h2>
              <div className="locked-feature-tag">
                <span>🔒</span>
                <span>Click panels to preview</span>
              </div>
            </div>

            {/* Main Preview Panel */}
            <div className="locked-main-preview">
              {isLocked ? (
                <div className="preview-overlay">
                  <div className="locked-lock-icon">🔒</div>
                  <div className="locked-unlock-text">Pro Features Locked</div>
                  <p className="locked-preview-subtext">
                    Click on the panels below to preview what you'll unlock with Creator Hub Pro
                  </p>
                </div>
              ) : null}

              <div className="preview-image-container">
                {currentPreview.image ? (
                  <>
                    <img 
                      src={currentPreview.image} 
                      alt={currentPreview.title}
                      className="preview-image"
                      onError={(e) => {
                        e.target.src = '/images/default-dashboard-preview.jpg';
                      }}
                    />
                    <div className="image-description-overlay">
                      <h3>{currentPreview.title}</h3>
                      <div className="image-description">
                        <h4>What you'll unlock:</h4>
                        <p>{currentPreview.description}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  // Payouts preview (no image)
                  <div style={{ 
                    padding: 'var(--spacing-xl)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    background: 'linear-gradient(135deg, var(--bg-peak), var(--bg-interactive))'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-lg)' }}>💰</div>
                    <div style={{ 
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--font-size-h3)',
                      color: 'var(--brand-ivory)',
                      marginBottom: 'var(--spacing-sm)',
                      textAlign: 'center'
                    }}>
                      Monthly Payouts
                    </div>
                    <div style={{ 
                      fontSize: 'var(--font-size-h2)',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--spacing-md)',
                      textAlign: 'center'
                    }}>
                      £248.50
                    </div>
                    <div style={{ 
                      color: 'var(--text-secondary)',
                      fontSize: 'var(--font-size-body-small)',
                      textAlign: 'center',
                      marginBottom: 'var(--spacing-lg)'
                    }}>
                      Estimated Monthly Earnings
                    </div>
                    <div className="image-description" style={{ maxWidth: '400px' }}>
                      <p>{currentPreview.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mini Panels */}
            <div className="locked-mini-panels">
              <div 
                className={`locked-mini-panel ${selectedPreview === 'engagement' ? 'active' : ''}`}
                onClick={() => handlePreviewSelect('engagement')}
              >
                <div className="panel-header">
                  <div className="panel-icon">📊</div>
                  <div className="panel-title">Engagement Analytics</div>
                </div>
                <p className="panel-description">Real-time views, likes, and chat session tracking with detailed breakdowns</p>
              </div>

              <div 
                className={`locked-mini-panel ${selectedPreview === 'marketHub' ? 'active' : ''}`}
                onClick={() => handlePreviewSelect('marketHub')}
              >
                <div className="panel-header">
                  <div className="panel-icon">🚀</div>
                  <div className="panel-title">Market Hub Featuring</div>
                </div>
                <p className="panel-description">Get promoted in prime slots and reach 10x more users</p>
              </div>

              <div 
                className={`locked-mini-panel ${selectedPreview === 'payouts' ? 'active' : ''}`}
                onClick={() => handlePreviewSelect('payouts')}
              >
                <div className="panel-header">
                  <div className="panel-icon">💰</div>
                  <div className="panel-title">Monthly Payouts</div>
                </div>
                <p className="panel-description">Earn from character usage with transparent revenue tracking</p>
              </div>
            </div>
          </div>

          {/* Right: Upgrade Section */}
          <div className="locked-upgrade-section">
            <div className="locked-pricing-header">
              <h3>Unlock Everything</h3>
              <div className="locked-pricing">
                <span className="locked-price-amount">£29.99</span>
                <span className="locked-price-period">/month</span>
              </div>
              <p className="locked-pricing-description">Cancel anytime. All features included.</p>
            </div>

            {/* Payment Options */}
            <div className="locked-payment-options">
              <div 
                className={`locked-payment-option ${selectedPayment === 'stripe' ? 'selected' : ''}`}
                onClick={() => setSelectedPayment('stripe')}
              >
                <div className="payment-icon">💳</div>
                <div className="payment-details">
                  <div className="payment-name">Pay with Stripe</div>
                  <div className="payment-security">
                    <span>⭐</span>
                    <span>Secured & Encrypted</span>
                  </div>
                </div>
              </div>

              <div 
                className={`locked-payment-option ${selectedPayment === 'paypal' ? 'selected' : ''}`}
                onClick={() => setSelectedPayment('paypal')}
              >
                <div className="payment-icon">🅿️</div>
                <div className="payment-details">
                  <div className="payment-name">Pay with PayPal</div>
                  <div className="payment-security">
                    <span>🛡️</span>
                    <span>Buyer Protection</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="locked-upgrade-cta">
              <button 
                className="locked-upgrade-button"
                onClick={handleUpgrade}
              >
                <span>🔓</span>
                <span>Unlock Creator Hub Pro</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="locked-dashboard-footer">
          <div className="locked-security-badges">
            <div className="locked-security-badge">
              <span>⭐</span>
              <span>Stripe Secure</span>
            </div>
            <div className="locked-security-badge">
              <span>🅿️</span>
              <span>PayPal Protected</span>
            </div>
            <div className="locked-security-badge">
              <span>🔒</span>
              <span>SSL Encrypted</span>
            </div>
          </div>
          <div className="locked-cancel-info">
            Cancel anytime · 7-day support included
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyDashboardState = ({ onLearnMore, onGoToCharacters, onCreateCharacter }) => (
  <div className="empty-state">
    <div className="empty-state-content">

      <span className="es-hero-label">Creator Hub</span>
      <h2>Build Characters.<br />Reach an Audience.</h2>
      <p>You haven't published any characters yet. Follow the path below to go from idea to Market Hub in five steps.</p>

      {/* ── Step Journey ── */}
      <div className="es-step-journey">

        {/* Step 1 — Design */}
        <div className="es-step-item">
          <div className="es-step-node">
            <span className="es-step-badge">1</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="url(#es-g1)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="es-g1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#818CF8" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="8" r="3.5" />
              <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
              <path d="M17 4l1.5 1.5L17 7" stroke="#818CF8" strokeWidth="1.5" />
              <path d="M18.5 5.5h2" stroke="#818CF8" strokeWidth="1.5" />
            </svg>
          </div>
          <span className="es-step-label">Design your<br />Character</span>
        </div>

        {/* Step 2 — Review */}
        <div className="es-step-item">
          <div className="es-step-node">
            <span className="es-step-badge">2</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="url(#es-g2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="es-g2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#818CF8" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>
              <path d="M12 2l7 3.5v5C19 15 16 19.5 12 22 8 19.5 5 15 5 10.5V5.5L12 2z" />
              <polyline points="9 12 11.5 14.5 15 10" stroke="#A5B4FC" strokeWidth="1.8" />
            </svg>
          </div>
          <span className="es-step-label">Team<br />Review</span>
        </div>

        {/* Step 3 — Publish */}
        <div className="es-step-item">
          <div className="es-step-node">
            <span className="es-step-badge">3</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="url(#es-g3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="es-g3" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#818CF8" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="12" r="8" />
              <path d="M12 4c-2 2-3 4-3 8s1 6 3 8" />
              <path d="M12 4c2 2 3 4 3 8s-1 6-3 8" />
              <line x1="4.5" y1="12" x2="19.5" y2="12" />
              <polyline points="10 7.5 12 4.5 14 7.5" stroke="#A5B4FC" />
            </svg>
          </div>
          <span className="es-step-label">Publish to<br />Market Hub</span>
        </div>

        {/* Step 4 — Enter Dialogue */}
        <div className="es-step-item">
          <div className="es-step-node">
            <span className="es-step-badge">4</span>
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="es-g4" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#818CF8" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>
              <circle cx="6.5" cy="5.5" r="2.2" stroke="url(#es-g4)" strokeWidth="1.6" />
              <circle cx="17.5" cy="5.5" r="2.2" stroke="url(#es-g4)" strokeWidth="1.6" />
              <rect x="2" y="10" width="11" height="7" rx="2.5" stroke="url(#es-g4)" strokeWidth="1.6" />
              <path d="M5 17l-1.5 2.5 3-1" stroke="url(#es-g4)" strokeWidth="1.4" />
              <rect x="11" y="12.5" width="11" height="7" rx="2.5" stroke="#A5B4FC" strokeWidth="1.6" />
              <path d="M19 19.5l1.5 2.5-3-1" stroke="#A5B4FC" strokeWidth="1.4" />
              <circle cx="7" cy="13.5" r="0.8" fill="#818CF8" />
              <circle cx="9.5" cy="13.5" r="0.8" fill="#818CF8" />
              <circle cx="15" cy="16" r="0.8" fill="#A5B4FC" />
              <circle cx="17.5" cy="16" r="0.8" fill="#A5B4FC" />
            </svg>
          </div>
          <span className="es-step-label">Enter<br />Dialogue</span>
        </div>

        {/* Step 5 — Track & Earn */}
        <div className="es-step-item">
          <div className="es-step-node">
            <span className="es-step-badge">5</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="url(#es-g5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="es-g5" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#818CF8" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>
              <rect x="3" y="14" width="4" height="7" rx="1" />
              <rect x="10" y="10" width="4" height="11" rx="1" />
              <rect x="17" y="6" width="4" height="15" rx="1" />
              <polyline points="4 10 8.5 6 13 8 19 3" stroke="#A5B4FC" strokeWidth="1.6" />
              <circle cx="19" cy="3" r="1.5" fill="#818CF8" stroke="none" />
            </svg>
          </div>
          <span className="es-step-label">Track &amp;<br />Earn</span>
        </div>

      </div>
      {/* ── end step journey ── */}

      <div className="es-divider" />

      <div className="empty-state-actions">
        <button onClick={onCreateCharacter} className="es-btn es-btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          Create Character
        </button>
        <button onClick={onGoToCharacters} className="es-btn es-btn-secondary">
          My Characters
        </button>
        <button onClick={onLearnMore} className="es-btn es-btn-ghost">
          Professional Features →
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
              <span className="amount">£29.99</span>
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
              Pay with Stripe - £29.99/month
            </button>
            <button 
              onClick={onUpgradeWithPayPal}
              className="upgrade-now-button secondary"
            >
              Pay with PayPal - £29.99/month
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