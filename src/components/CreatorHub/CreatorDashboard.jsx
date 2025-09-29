// src/components/CreatorHub/CreatorDashboard.jsx
// UPDATED: Using /api/creator-hub routes instead of /api/market-hub
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import api from '../../api';
import './CreatorDashboard.css';

const CreatorDashboard = () => {
  const { token } = useAuth();
  const { user } = useUser();
  
  // State management - defensive defaults
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30'); // 30 days default
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load dashboard data with defensive error handling
  const loadDashboardData = useCallback(async () => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // UPDATED: Changed from /api/market-hub to /api/creator-hub
      const response = await api.get('/creator-hub/analytics/dashboard');
      
      if (response.data && response.data.status === 'success') {
        setDashboardData(response.data.dashboard);
      } else {
        throw new Error('Invalid dashboard response');
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
      
      // DEFENSIVE: Check for tier requirement error
      if (err.response?.status === 403) {
        setError('Unlimited tier required to access Creator Hub');
      } else {
        setError(err.response?.data?.error || 'Failed to load dashboard');
      }
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData();
    }, 300000);

    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Loading state
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

  // Error state - ENHANCED with upgrade prompt
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

  // Empty state - no published characters yet
  if (!dashboardData || dashboardData.summary.total_characters === 0) {
    return (
      <div className="creator-dashboard">
        <EmptyDashboardState />
      </div>
    );
  }

  const { summary, published_characters, recent_achievements } = dashboardData;

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

      {/* Summary Stats */}
      <section className="stats-grid">
        <StatCard
          icon="📊"
          label="Published Characters"
          value={summary.total_characters}
          trend={null}
        />
        <StatCard
          icon="👁️"
          label="Total Views (30d)"
          value={summary.total_views_30d}
          trend={null}
        />
        <StatCard
          icon="❤️"
          label="Total Likes (30d)"
          value={summary.total_likes_30d}
          trend={null}
        />
        <StatCard
          icon="📈"
          label="Avg Engagement Rate"
          value={`${(summary.avg_engagement_rate * 100).toFixed(1)}%`}
          trend={null}
        />
      </section>

      {/* Creator Level & Progress */}
      <section className="creator-level-section">
        <CreatorLevelCard
          currentLevel={summary.creator_level}
          achievementsCount={summary.achievements_count}
          trendingScore={summary.trending_score}
        />
      </section>

      {/* Published Characters List */}
      <section className="characters-section">
        <h2>Your Published Characters</h2>
        <div className="characters-grid">
          {published_characters.map(character => (
            <PublishedCharacterCard
              key={character.character_id}
              character={character}
              isMobile={isMobile}
            />
          ))}
        </div>
      </section>

      {/* Recent Achievements */}
      {recent_achievements && recent_achievements.length > 0 && (
        <section className="achievements-section">
          <h2>Recent Achievements</h2>
          <div className="achievements-list">
            {recent_achievements.map((achievement, index) => (
              <AchievementCard
                key={index}
                achievement={achievement}
              />
            ))}
          </div>
        </section>
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

const StatCard = ({ icon, label, value, trend }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {trend && (
        <div className={`stat-trend ${trend > 0 ? 'positive' : 'negative'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  </div>
);

const CreatorLevelCard = ({ currentLevel, achievementsCount, trendingScore }) => {
  const levelInfo = {
    newcomer: { color: '#9E9E9E', next: 'established_creator', emoji: '🌱' },
    established_creator: { color: '#4CAF50', next: 'rising_star', emoji: '⭐' },
    rising_star: { color: '#FF9800', next: 'veteran_creator', emoji: '🚀' },
    veteran_creator: { color: '#9C27B0', next: null, emoji: '👑' }
  };

  const info = levelInfo[currentLevel] || levelInfo.newcomer;

  return (
    <div className="creator-level-card" style={{ borderColor: info.color }}>
      <div className="level-header">
        <span className="level-emoji">{info.emoji}</span>
        <div className="level-info">
          <h3>Creator Level: {currentLevel.replace('_', ' ').toUpperCase()}</h3>
          <p>{achievementsCount} achievements earned</p>
        </div>
      </div>
      <div className="level-stats">
        <div className="level-stat">
          <span className="stat-label">Trending Score</span>
          <span className="stat-value">{trendingScore.toFixed(1)}</span>
        </div>
        {info.next && (
          <div className="level-progress">
            <span className="progress-label">Next: {info.next.replace('_', ' ')}</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min((trendingScore / 100) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PublishedCharacterCard = ({ character, isMobile }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="published-character-card">
      <div className="character-header">
        <img
          src={`/images/${character.character_key}.jpg`}
          alt={character.display_name}
          className="character-avatar"
          onError={(e) => {
            e.target.src = '/images/default-character.jpg';
          }}
        />
        <div className="character-info">
          <h3>{character.display_name}</h3>
          <span className="creator-level-badge">{character.creator_level}</span>
        </div>
      </div>

      <div className="character-stats">
        <div className="stat">
          <span className="stat-label">Engagement Score</span>
          <span className="stat-value">{character.total_engagement_score}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Published</span>
          <span className="stat-value">
            {character.published_at 
              ? new Date(character.published_at).toLocaleDateString() 
              : 'N/A'}
          </span>
        </div>
      </div>

      <div className="character-actions">
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="details-button"
        >
          {showDetails ? 'Hide' : 'View'} Analytics
        </button>
        <button 
          onClick={() => window.location.href = `/market-hub?character=${character.character_key}`}
          className="view-button"
        >
          View in Hub
        </button>
      </div>

      {showDetails && (
        <div className="character-details">
          <p>Detailed analytics coming soon...</p>
        </div>
      )}
    </div>
  );
};

const AchievementCard = ({ achievement }) => (
  <div className="achievement-card">
    <div className="achievement-icon">🏆</div>
    <div className="achievement-content">
      <h4>{achievement.achievement_type.replace('_', ' ').toUpperCase()}</h4>
      <p className="achievement-date">
        Earned {new Date(achievement.earned_at).toLocaleDateString()}
      </p>
    </div>
  </div>
);

export default CreatorDashboard;