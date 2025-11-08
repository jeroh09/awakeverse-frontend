// PublicScenarioPage.jsx
// Location: src/pages/PublicScenarioPage.jsx
// Public scenario profile page for shared links

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { characterCategories } from '../data/characterCategories';
import { isCustomCharacterKey, getDisplayNameFromKey } from '../utils/characterUtils';
import './PublicScenarioPage.css';

const PublicScenarioPage = () => {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [scenario, setScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchScenarioData();
  }, [scenarioId]);

  const fetchScenarioData = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/public/scenarios/${scenarioId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Scenario not found or not publicly available');
        }
        throw new Error('Failed to load scenario');
      }

      const data = await response.json();
      
      if (data.status === 'success' && data.data) {
        setScenario(data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching scenario:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCharacterInfo = (charKey) => {
    // Check if it's a custom character
    const isCustom = isCustomCharacterKey(charKey);
    
    if (isCustom) {
      return {
        name: getDisplayNameFromKey(charKey),
        thumbnailUrl: `/images/${charKey}.jpg`,
        isCustom: true
      };
    } else {
      // Static character - look up in categories
      for (const category of characterCategories) {
        if (category.characters) {
          const found = category.characters.find(c => c.key === charKey);
          if (found) {
            return {
              name: found.name,
              thumbnailUrl: found.thumbnailUrl,
              isCustom: false
            };
          }
        }
      }
      
      return {
        name: charKey,
        thumbnailUrl: `/images/${charKey}.jpg`,
        isCustom: false
      };
    }
  };

  const handleStartDebate = () => {
    if (user) {
      // User is logged in - go to scenario
      // Note: You'll need to implement scenario launching from public page
      // For now, redirect to scenarios tab or create a direct launch route
      navigate(`/scenarios?start=${scenarioId}`);
    } else {
      // User not logged in - redirect to register with return URL
      navigate(`/register?redirect=/scenarios?start=${scenarioId}`);
    }
  };

  const handleExploreMore = () => {
    navigate('/market-hub');
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="public-scenario-page loading">
        <div className="spinner"></div>
        <p>Loading scenario...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-scenario-page error">
        <div className="error-container">
          <h2>😕 Scenario Not Found</h2>
          <p>{error}</p>
          <button onClick={handleExploreMore} className="explore-button">
            Explore Other Scenarios
          </button>
        </div>
      </div>
    );
  }

  if (!scenario) {
    return null;
  }

  return (
    <div className="public-scenario-page">
      {/* Header with branding */}
      <header className="page-header">
        <div className="logo" onClick={() => navigate('/')}>
          Awakeverse
        </div>
        {!user && (
          <div className="header-actions">
            <button onClick={() => navigate('/login')} className="login-btn">
              Log In
            </button>
            <button onClick={() => navigate('/register')} className="signup-btn">
              Sign Up
            </button>
          </div>
        )}
      </header>

      {/* Scenario Profile Section */}
      <div className="scenario-profile">
        <div className="profile-content">
          {/* Scenario Icon/Header */}
          <div className="scenario-header">
            <div className="scenario-icon">🎭</div>
            <div className="scenario-info">
              <h1 className="scenario-title">{scenario.title}</h1>
              {scenario.category && (
                <div className="category-badge">{scenario.category}</div>
              )}
              {scenario.is_market_featured && (
                <div className="featured-badge">⭐ Featured</div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="description-section">
            <p className="scenario-description">{scenario.description}</p>
          </div>

          {/* Participants */}
          <div className="participants-section">
            <h3 className="section-title">
              Debate Participants ({scenario.character_count})
            </h3>
            <div className="participants-grid">
              {scenario.character_keys.map((charKey, index) => {
                const charInfo = getCharacterInfo(charKey);
                return (
                  <div key={index} className="participant-card">
                    <div className="participant-avatar">
                      <img
                        src={charInfo.thumbnailUrl}
                        alt={charInfo.name}
                        onError={(e) => {
                          e.target.src = '/images/default-character.jpg';
                        }}
                      />
                    </div>
                    <div className="participant-info">
                      <div className="participant-name">{charInfo.name}</div>
                      {charInfo.isCustom && (
                        <div className="custom-badge">Custom</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Creator Info */}
          <div className="creator-info">
            <span className="created-by">Created by </span>
            <span className="creator-name">{scenario.creator.display_name}</span>
            <span className="creator-level">• {scenario.creator.creator_level}</span>
          </div>

          {/* Engagement Stats */}
          <div className="engagement-stats">
            <div className="stat">
              <span className="stat-value">
                {formatNumber(scenario.engagement_30d.total_views)}
              </span>
              <span className="stat-label">Views</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {formatNumber(scenario.engagement_30d.total_likes)}
              </span>
              <span className="stat-label">Likes</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {formatNumber(scenario.engagement_30d.total_starts)}
              </span>
              <span className="stat-label">Debates</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {formatNumber(scenario.engagement_30d.unique_users)}
              </span>
              <span className="stat-label">Users</span>
            </div>
          </div>

          {/* Call to Action */}
          <div className="cta-section">
            <button onClick={handleStartDebate} className="start-debate-btn">
              {user ? '🎭 Start Debate' : '🚀 Sign Up to Debate'}
            </button>
            <button onClick={handleExploreMore} className="explore-btn">
              Explore More Scenarios
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="page-footer">
        <p>© 2025 Awakeverse • Multi-Character AI Debates</p>
      </footer>
    </div>
  );
};

export default PublicScenarioPage;