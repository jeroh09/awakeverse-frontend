// src/components/CreatorHub/CreatorDashboard.jsx
// MIGRATED TO PAYMENTROUTER - All payment flows now use centralized service
// CHANGES: Lines 13, 97-105, 271 - Replaced hardcoded URLs with PaymentRouter

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useAppView } from '../../contexts/AppViewContext';
import api from '../../api';
import { Eye, Heart, Bookmark, Share2, MessageCircle, TrendingUp, Calendar } from 'lucide-react';
import './CreatorDashboard.css';

// ✅ NEW: Import PaymentRouter instead of using hardcoded URLs
import PaymentRouter from '../../services/PaymentRouter';

const CreatorDashboard = () => {
  const { user } = useUser();
  const { switchView, VIEW_STATES } = useAppView();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [showEducationalModal, setShowEducationalModal] = useState(false);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  // Add this state at the top of your component with other states
  const [showAllStats, setShowAllStats] = useState(false);
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

  const handleGoToCharacters = () => {
    switchView(VIEW_STATES.CHAT);
  };

  // ✅ PRODUCTION-READY: Separate handlers for each payment provider
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
    // Default to Stripe for comparison
    handleUpgradeWithStripe();
  };

  const handleViewInMarketHub = (characterKey) => {
    window.open(`/market-hub?character=${characterKey}`, '_blank');
  };

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
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Creator Dashboard</h1>
          <p>Welcome back, {user?.displayName || 'Creator'}!</p>
        </div>
        <button onClick={loadDashboardData} className="refresh-button" title="Refresh data">
          🔄 Refresh
        </button>
      </header>

      <section className="stats-section">
        <div className="section-header">
          <h2>Performance Overview</h2>
          <span className="section-subtitle">Last 30 days</span>
        </div>

        {/* Main Stats Grid - Always show first 4 cards */}
        <div className="stats-grid">
          <StatCard
            icon={<Eye size={20} />}
            label="Total Views"
            value={summary.total_views || 0}
            color="#6366F1"
          />
          <StatCard
            icon={<Heart size={20} />}
            label="Total Likes"
            value={summary.total_likes || 0}
            color="#EF4444"
          />
          <StatCard
            icon={<Bookmark size={20} />}
            label="Total Bookmarks"
            value={summary.total_bookmarks || 0}
            color="#F59E0B"
          />
          <StatCard
            icon={<MessageCircle size={20} />}
            label="Chat Sessions"
            value={summary.total_chat_sessions || 0}
            color="#8B5CF6"
          />
        </div>

        {/* Additional Stats - Show when expanded */}
        {showAllStats && (
          <div className="stats-grid-additional">
            <StatCard
              icon={<Share2 size={20} />}
              label="Total Shares"
              value={summary.total_shares || 0}
              color="#10B981"
            />
            <StatCard
              icon={<TrendingUp size={20} />}
              label="Engagement Rate"
              value={`${summary.avg_engagement_rate || 0}%`}
              color="#06B6D4"
            />
          </div>
        )}

        {/* See More/Less Toggle */}
        <div className="stats-toggle">
          <button 
            className="stats-toggle-button"
            onClick={() => setShowAllStats(!showAllStats)}
          >
            {showAllStats ? 'Show Less' : 'See More Metrics'}
            <TrendingUp size={16} className={showAllStats ? 'rotated' : ''} />
          </button>
        </div>
      </section>
      
      {engagement_trends && engagement_trends.length > 0 && (
        <section className="trends-section">
          <h2>Engagement Trends (Last 30 Days)</h2>
          <EngagementTrendsChart data={engagement_trends} />
        </section>
      )}

      <section className="characters-section">
        <h2>Your Published Characters ({characters.length})</h2>
        <div className="characters-grid">
          {characters.map(character => (
            <CharacterEngagementCard
              key={character.character_id}
              character={character}
              onClick={() => setSelectedCharacter(character)}
              onViewInHub={handleViewInMarketHub}
            />
          ))}
        </div>
      </section>

      {selectedCharacter && (
        <CharacterDetailModal
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
          onViewInHub={handleViewInMarketHub}
        />
      )}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

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

const EmptyDashboardState = ({ onLearnMore, onGoToCharacters }) => (
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
          onClick={onGoToCharacters}
          className="create-character-button"
        >
          Go to My Characters
        </button>
        <button 
          onClick={onLearnMore}
          className="learn-more-button"
        >
          Learn About Professional Features
        </button>
      </div>
    </div>
  </div>
);

const EngagementStatCard = ({ icon, label, value, color }) => {
  const displayValue = typeof value === 'number' ? value : 
                       typeof value === 'string' ? value : 0;
  
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-icon" style={{ color }}>
        {icon}
      </div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">
          {typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}
        </div>
      </div>
    </div>
  );
};

const CharacterEngagementCard = ({ character, onClick, onViewInHub }) => {
  const engagement = character.engagement || {
    total_views: 0,
    total_likes: 0,
    total_bookmarks: 0,
    total_shares: 0,
    chat_sessions: 0,
    engagement_rate: 0,
    engagements_7d: 0,
    engagements_30d: 0,
    last_engagement_at: null
  };
  
  return (
    <div className="character-engagement-card" onClick={onClick}>
      <div className="character-header">
        <img
          src={character.avatar_url || '/images/default-character.jpg'}
          alt={character.display_name || 'Character'}
          className="character-avatar"
          onError={(e) => {
            e.target.src = '/images/default-character.jpg';
          }}
        />
        <div className="character-info">
          <h3>{character.display_name || 'Unnamed Character'}</h3>
          <span className="creator-level-badge">
            {character.creator_level || 'newcomer'}
          </span>
        </div>
      </div>

      {character.short_description && (
        <div className="character-description">
          {character.short_description}
        </div>
      )}

      <div className="engagement-metrics">
        <div className="metric-row">
          <div className="metric">
            <Eye size={16} />
            <span className="metric-value">{engagement.total_views}</span>
            <span className="metric-label">views</span>
          </div>
          <div className="metric">
            <Heart size={16} />
            <span className="metric-value">{engagement.total_likes}</span>
            <span className="metric-label">likes</span>
          </div>
        </div>
        
        <div className="metric-row">
          <div className="metric">
            <Bookmark size={16} />
            <span className="metric-value">{engagement.total_bookmarks}</span>
            <span className="metric-label">bookmarks</span>
          </div>
          <div className="metric">
            <Share2 size={16} />
            <span className="metric-value">{engagement.total_shares}</span>
            <span className="metric-label">shares</span>
          </div>
        </div>
      </div>

      <div className="engagement-summary">
        <div className="summary-item">
          <MessageCircle size={14} />
          <span>{engagement.chat_sessions} chats</span>
        </div>
        <div className="summary-item">
          <TrendingUp size={14} />
          <span>{engagement.engagement_rate}% rate</span>
        </div>
      </div>

      {engagement.last_engagement_at && (
        <div className="last-engagement">
          <Calendar size={12} />
          <span>Last: {new Date(engagement.last_engagement_at).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
};

const EngagementTrendsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="no-trends">No engagement data yet</div>;
  }
  
  const maxTotal = Math.max(...data.map(d => d.total || 0), 1);
  
  return (
    <div className="trends-chart">
      {data.slice(0, 14).reverse().map((day, index) => (
        <div key={index} className="trend-bar-container">
          <div className="trend-date">
            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <div className="trend-bars">
            <div 
              className="trend-bar view-bar" 
              style={{ height: `${((day.views || 0) / maxTotal) * 100}%` }}
              title={`${day.views || 0} views`}
            />
            <div 
              className="trend-bar like-bar" 
              style={{ height: `${((day.likes || 0) / maxTotal) * 100}%` }}
              title={`${day.likes || 0} likes`}
            />
            <div 
              className="trend-bar bookmark-bar" 
              style={{ height: `${((day.bookmarks || 0) / maxTotal) * 100}%` }}
              title={`${day.bookmarks || 0} bookmarks`}
            />
            <div 
              className="trend-bar share-bar" 
              style={{ height: `${((day.shares || 0) / maxTotal) * 100}%` }}
              title={`${day.shares || 0} shares`}
            />
          </div>
          <div className="trend-total">{day.total || 0}</div>
        </div>
      ))}
      
      <div className="chart-legend">
        <div className="legend-item"><span className="view-color"></span> Views</div>
        <div className="legend-item"><span className="like-color"></span> Likes</div>
        <div className="legend-item"><span className="bookmark-color"></span> Bookmarks</div>
        <div className="legend-item"><span className="share-color"></span> Shares</div>
      </div>
    </div>
  );
};

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
                <div className="stat-sublabel">{engagement.unique_viewers || 0} unique</div>
              </div>
            </div>
            
            <div className="stat-item">
              <Heart size={20} />
              <div>
                <div className="stat-number">{engagement.total_likes || 0}</div>
                <div className="stat-label">Total Likes</div>
                <div className="stat-sublabel">{engagement.unique_likes || 0} unique</div>
              </div>
            </div>
            
            <div className="stat-item">
              <Bookmark size={20} />
              <div>
                <div className="stat-number">{engagement.total_bookmarks || 0}</div>
                <div className="stat-label">Total Bookmarks</div>
                <div className="stat-sublabel">{engagement.unique_bookmarks || 0} unique</div>
              </div>
            </div>
            
            <div className="stat-item">
              <Share2 size={20} />
              <div>
                <div className="stat-number">{engagement.total_shares || 0}</div>
                <div className="stat-label">Total Shares</div>
                <div className="stat-sublabel">{engagement.unique_shares || 0} unique</div>
              </div>
            </div>
            
            <div className="stat-item">
              <MessageCircle size={20} />
              <div>
                <div className="stat-number">{engagement.chat_sessions || 0}</div>
                <div className="stat-label">Chat Sessions</div>
                <div className="stat-sublabel">from Market Hub</div>
              </div>
            </div>
          </div>

          <div className="engagement-rate-display">
            <TrendingUp size={24} />
            <div>
              <div className="rate-number">{engagement.engagement_rate || 0}%</div>
              <div className="rate-label">Engagement Rate</div>
              <div className="rate-formula">
                (likes + bookmarks + shares) / views
              </div>
            </div>
          </div>

          <div className="recent-activity">
            <h4>Recent Activity</h4>
            <div className="activity-stats">
              <div>Last 7 days: <strong>{engagement.engagements_7d || 0}</strong> engagements</div>
              <div>Last 30 days: <strong>{engagement.engagements_30d || 0}</strong> engagements</div>
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