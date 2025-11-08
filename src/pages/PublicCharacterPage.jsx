// PublicCharacterPage.jsx
// Location: src/pages/PublicCharacterPage.jsx
// Public character profile page for shared links
// UPDATED: Using CSS Modules for proper style scoping

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import styles from './PublicCharacterPage.module.css';

const PublicCharacterPage = () => {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCharacterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      
      // DEFENSIVE: Validate response structure
      if (data.status === 'success' && data.data) {
        setCharacter(data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching character:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = () => {
    // DEFENSIVE: Ensure character exists and has character_key
    if (!character || !character.character_key) {
      console.error('Character data incomplete');
      return;
    }

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
    // DEFENSIVE: Handle invalid inputs
    if (typeof num !== 'number' || isNaN(num)) return '0';
    
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // DEFENSIVE: Safe access to nested engagement data
  const getEngagementValue = (field) => {
    try {
      return character?.engagement_30d?.[field] || 0;
    } catch (e) {
      return 0;
    }
  };

  if (loading) {
    return (
      <div className={`${styles.publicCharacterPage} ${styles.loading}`}>
        <div className={styles.spinner}></div>
        <p>Loading character...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.publicCharacterPage} ${styles.error}`}>
        <div className={styles.errorContainer}>
          <h2>😕 Character Not Found</h2>
          <p>{error}</p>
          <button onClick={handleExploreMore} className={styles.exploreButton}>
            Explore Other Characters
          </button>
        </div>
      </div>
    );
  }

  // DEFENSIVE: Don't render if no character data
  if (!character) {
    return null;
  }

  return (
    <div className={styles.publicCharacterPage}>
      {/* Header with branding */}
      <header className={styles.pageHeader}>
        <div className={styles.logo} onClick={() => navigate('/')}>
          AwakeVerse
        </div>
        {!user && (
          <div className={styles.headerActions}>
            <button onClick={() => navigate('/login')} className={styles.loginBtn}>
              Log In
            </button>
            <button onClick={() => navigate('/register')} className={styles.signupBtn}>
              Sign Up
            </button>
          </div>
        )}
      </header>

      {/* Character Profile Section */}
      <div className={styles.characterProfile}>
        <div className={styles.profileContent}>
          {/* Avatar */}
          <div className={styles.avatarSection}>
            <img
              src={character.avatar_url || '/images/default-character.jpg'}
              alt={character.display_name || 'Character'}
              className={styles.characterAvatar}
              onError={(e) => {
                e.target.src = '/images/default-character.jpg';
              }}
            />
            {character.is_market_featured && (
              <div className={styles.featuredBadge}>⭐ Featured</div>
            )}
          </div>

          {/* Character Info */}
          <div className={styles.infoSection}>
            <h1 className={styles.characterName}>
              {character.display_name || 'Unknown Character'}
            </h1>
            
            {character.expertise_domain && (
              <div className={styles.domainBadge}>{character.expertise_domain}</div>
            )}

            <p className={styles.characterDescription}>
              {character.short_description || 'No description available'}
            </p>

            {/* Character Details */}
            <div className={styles.characterDetails}>
              {character.historical_period && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Period:</span>
                  <span className={styles.detailValue}>{character.historical_period}</span>
                </div>
              )}
              {character.personality_archetype && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Archetype:</span>
                  <span className={styles.detailValue}>{character.personality_archetype}</span>
                </div>
              )}
            </div>

            {/* Creator Info */}
            {character.creator && (
              <div className={styles.creatorInfo}>
                <span className={styles.createdBy}>Created by </span>
                <span className={styles.creatorName}>
                  {character.creator.display_name || 'Anonymous'}
                </span>
                <span className={styles.creatorLevel}>
                  • {character.creator.creator_level || 'creator'}
                </span>
              </div>
            )}

            {/* Engagement Stats */}
            <div className={styles.engagementStats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {formatNumber(getEngagementValue('total_views'))}
                </span>
                <span className={styles.statLabel}>Views</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {formatNumber(getEngagementValue('total_likes'))}
                </span>
                <span className={styles.statLabel}>Likes</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {formatNumber(getEngagementValue('total_chats'))}
                </span>
                <span className={styles.statLabel}>Chats</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {formatNumber(getEngagementValue('unique_users'))}
                </span>
                <span className={styles.statLabel}>Users</span>
              </div>
            </div>

            {/* Call to Action */}
            <div className={styles.ctaSection}>
              <button onClick={handleStartChat} className={styles.startChatBtn}>
                {user ? '💬 Start Chatting' : '🚀 Sign Up to Chat'}
              </button>
              <button onClick={handleExploreMore} className={styles.exploreBtn}>
                Explore More Characters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.pageFooter}>
        <p>© 2025 AwakeVerse • AI Character Platform</p>
      </footer>
    </div>
  );
};

export default PublicCharacterPage;