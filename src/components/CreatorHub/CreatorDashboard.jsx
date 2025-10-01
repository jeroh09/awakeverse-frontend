// src/components/CreatorHub/CreatorDashboard.jsx
// FIXED: Add defensive null checks for all data

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import api from '../../api';
import { Eye, Heart, Bookmark, Share2, MessageCircle, TrendingUp, Calendar } from 'lucide-react';
import './CreatorDashboard.css';

const CreatorDashboard = () => {
  const { token } = useAuth();
  const { user } = useUser();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/creator-hub/analytics/dashboard');
      
      if (response.data && response.data.status === 'success') {
        // DEFENSIVE: Ensure characters array exists
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
      if (err.response?.status === 403) {
        setError('Unlimited tier required to access Creator Hub');
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to load dashboard');
      }
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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

  if (error) {
    return (
      <div className="creator-dashboard">
        <div className="dashboard-error">
          <h2>Unable to Load Dashboard</h2>
          <p>{error}</p>
          {error.includes('Unlimited tier') ? (
            <div className="upgrade-prompt">
              <p>Creator Hub features require Unlimited tier subscription.</p>
              <button 
                onClick={() => window.location.href = '/profile-settings?tab=subscription'}
                className="upgrade-button"
              >
                Upgrade to Unlimited
              </button>
            </div>
          ) : (
            <button onClick={loadDashboardData} className="retry-button">
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // DEFENSIVE: Check if data exists and has characters
  if (!dashboardData || !dashboardData.characters || dashboardData.characters.length === 0) {
    return (
      <div className="creator-dashboard">
        <EmptyDashboardState />
      </div>
    );
  }

  const { summary, characters, engagement_trends } = dashboardData;

  return (
    <div className="creator-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Creator Dashboard</h1>
          <p>Welcome back, {user?.displayName || 'Creator'}!</p>
        </div>
        <button onClick={loadDashboardData} className="refresh-button" title="Refresh data">
          🔄 Refresh
        </button>
      </header>

      {/* Summary Stats - REAL DATA */}
      <section className="stats-grid">
        <EngagementStatCard
          icon={<Eye size={24} />}
          label="Total Views"
          value={summary.total_views || 0}
          color="#3b82f6"
        />
        <EngagementStatCard
          icon={<Heart size={24} />}
          label="Total Likes"
          value={summary.total_likes || 0}
          color="#ef4444"
        />
        <EngagementStatCard
          icon={<Bookmark size={24} />}
          label="Total Bookmarks"
          value={summary.total_bookmarks || 0}
          color="#f59e0b"
        />
        <EngagementStatCard
          icon={<Share2 size={24} />}
          label="Total Shares"
          value={summary.total_shares || 0}
          color="#10b981"
        />
        <EngagementStatCard
          icon={<MessageCircle size={24} />}
          label="Chat Sessions"
          value={summary.total_chat_sessions || 0}
          color="#8b5cf6"
        />
        <EngagementStatCard
          icon={<TrendingUp size={24} />}
          label="Avg Engagement Rate"
          value={`${summary.avg_engagement_rate || 0}%`}
          color="#06b6d4"
        />
      </section>

      {/* Engagement Trends Chart */}
      {engagement_trends && engagement_trends.length > 0 && (
        <section className="trends-section">
          <h2>Engagement Trends (Last 30 Days)</h2>
          <EngagementTrendsChart data={engagement_trends} />
        </section>
      )}

      {/* Published Characters with REAL Engagement */}
      <section className="characters-section">
        <h2>Your Published Characters ({characters.length})</h2>
        <div className="characters-grid">
          {characters.map(character => (
            <CharacterEngagementCard
              key={character.character_id}
              character={character}
              onClick={() => setSelectedCharacter(character)}
            />
          ))}
        </div>
      </section>

      {/* Character Detail Modal */}
      {selectedCharacter && (
        <CharacterDetailModal
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
        />
      )}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const EmptyDashboardState = () => (
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
          <li>Publish to Market Hub (Unlimited tier required)</li>
          <li>Track performance and earn recognition!</li>
        </ol>
      </div>
      <button 
        onClick={() => window.location.href = '/app#my_characters'}
        className="create-character-button"
      >
        Go to My Characters
      </button>
    </div>
  </div>
);

const EngagementStatCard = ({ icon, label, value, color }) => {
  // DEFENSIVE: Ensure value is a number
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

const CharacterEngagementCard = ({ character, onClick }) => {
  // DEFENSIVE: Provide default engagement object
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

      {/* REAL Engagement Metrics */}
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
  
  const maxTotal = Math.max(...data.map(d => d.total || 0), 1); // Avoid division by zero
  
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

const CharacterDetailModal = ({ character, onClose }) => {
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

        <button className="view-hub-button" onClick={() => {
          window.open(`/market-hub?character=${character.character_key}`, '_blank');
        }}>
          View in Market Hub
        </button>
      </div>
    </div>
  );
};

export default CreatorDashboard;