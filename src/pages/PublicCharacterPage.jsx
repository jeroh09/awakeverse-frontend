// PublicCharacterPage.jsx
// Location: src/pages/PublicCharacterPage.jsx
// Public character profile page for shared links

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import './PublicCharacterPage.css';

const PublicCharacterPage = () => {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCharacterData();
  }, [characterId]);

  const fetchCharacterData = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/public/characters/${characterId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Character not found or not publicly available');
        }
        throw new Error('Failed to load character');
      }

      const data = await response.json();
      
      if (data.status === 'success' && data.data) {
        setCharacter(data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching character:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = () => {
    if (user) {
      // User is logged in - go to chat
      navigate(`/chat/${character.character_key}`);
    } else {
      // User not logged in - redirect to register with return URL
      navigate(`/register?redirect=/chat/${character.character_key}`);
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
      <div className="public-character-page loading">
        <div className="spinner"></div>
        <p>Loading character...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-character-page error">
        <div className="error-container">
          <h2>😕 Character Not Found</h2>
          <p>{error}</p>
          <button onClick={handleExploreMore} className="explore-button">
            Explore Other Characters
          </button>
        </div>
      </div>
    );
  }

  if (!character) {
    return null;
  }

  return (
    <div className="public-character-page">
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

      {/* Character Profile Section */}
      <div className="character-profile">
        <div className="profile-content">
          {/* Avatar */}
          <div className="avatar-section">
            <img
              src={character.avatar_url}
              alt={character.display_name}
              className="character-avatar"
              onError={(e) => {
                e.target.src = '/images/default-character.jpg';
              }}
            />
            {character.is_market_featured && (
              <div className="featured-badge">⭐ Featured</div>
            )}
          </div>

          {/* Character Info */}
          <div className="info-section">
            <h1 className="character-name">{character.display_name}</h1>
            
            {character.expertise_domain && (
              <div className="domain-badge">{character.expertise_domain}</div>
            )}

            <p className="character-description">{character.short_description}</p>

            {/* Character Details */}
            <div className="character-details">
              {character.historical_period && (
                <div className="detail-item">
                  <span className="detail-label">Period:</span>
                  <span className="detail-value">{character.historical_period}</span>
                </div>
              )}
              {character.personality_archetype && (
                <div className="detail-item">
                  <span className="detail-label">Archetype:</span>
                  <span className="detail-value">{character.personality_archetype}</span>
                </div>
              )}
            </div>

            {/* Creator Info */}
            <div className="creator-info">
              <span className="created-by">Created by </span>
              <span className="creator-name">{character.creator.display_name}</span>
              <span className="creator-level">• {character.creator.creator_level}</span>
            </div>

            {/* Engagement Stats */}
            <div className="engagement-stats">
              <div className="stat">
                <span className="stat-value">
                  {formatNumber(character.engagement_30d.total_views)}
                </span>
                <span className="stat-label">Views</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {formatNumber(character.engagement_30d.total_likes)}
                </span>
                <span className="stat-label">Likes</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {formatNumber(character.engagement_30d.total_chats)}
                </span>
                <span className="stat-label">Chats</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {formatNumber(character.engagement_30d.unique_users)}
                </span>
                <span className="stat-label">Users</span>
              </div>
            </div>

            {/* Call to Action */}
            <div className="cta-section">
              <button onClick={handleStartChat} className="start-chat-btn">
                {user ? '💬 Start Chatting' : '🚀 Sign Up to Chat'}
              </button>
              <button onClick={handleExploreMore} className="explore-btn">
                Explore More Characters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="page-footer">
        <p>© 2025 Awakeverse • AI Character Platform</p>
      </footer>
    </div>
  );
};

export default PublicCharacterPage;