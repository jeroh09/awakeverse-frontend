// PublicCharacterPage.jsx - UPDATED WITH ALL SOCIAL ICONS
// Location: src/pages/PublicCharacterPage.jsx
// Public character profile page for shared links

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import styles from './PublicCharacterPage.module.css';
import { 
  TwitterIcon, 
  FacebookIcon, 
  LinkedInIcon, 
  RedditIcon, 
  DiscordIcon, 
  InstagramIcon 
} from '../components/SocialIcons';

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
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = () => {
    if (!character || !character.character_key) {
      console.error('Character data incomplete');
      return;
    }

    if (user) {
      navigate(`/chat/${character.character_key}`);
    } else {
      navigate(`/register?redirect=/chat/${character.character_key}`);
    }
  };

  const handleExploreMore = () => {
    navigate('/market-hub');
  };

  const formatNumber = (num) => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

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

      {/* NEW CARD DESIGN IMPLEMENTATION */}
      <div className={styles.cardContainer}>
        <article className={styles.characterCard}>
          
          {/* Card Visual Section */}
          <div className={styles.cardVisual}>
            <img
              src={character.avatar_url || '/images/default-character.jpg'}
              alt={character.display_name || 'Character'}
              className={styles.characterImg}
              onError={(e) => {
                e.target.src = '/images/default-character.jpg';
              }}
            />
            
            {/* Visual Overlay with ALL Social Icons */}
            <div className={styles.visualOverlay}>
              <a 
                href={`https://twitter.com/intent/tweet?text=Check out ${encodeURIComponent(character.display_name)} on AwakeVerse - IP certified AI character!&url=https://www.awakeverse.com/c/${character.character_key}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                title="Share on Twitter"
              >
                𝕏
              </a>
              <a 
                href={`https://www.linkedin.com/sharing/share-offsite/?url=https://www.awakeverse.com/c/${character.character_key}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                title="Share on LinkedIn"
              >
                in
              </a>
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=https://www.awakeverse.com/c/${character.character_key}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                title="Share on Facebook"
              >
                f
              </a>
              <a 
                href={`https://www.reddit.com/submit?url=https://www.awakeverse.com/c/${character.character_key}&title=${encodeURIComponent(character.display_name + ' - IP Certified AI Character on AwakeVerse')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                title="Share on Reddit"
              >
                <RedditIcon />
              </a>
              <a 
                href={`https://discord.com/channels/@me?text=${encodeURIComponent(`Check out ${character.display_name} - an IP certified AI character on AwakeVerse: https://www.awakeverse.com/c/${character.character_key}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                title="Share on Discord"
              >
                <DiscordIcon />
              </a>
              <a 
                href={`https://www.instagram.com/?url=https://www.awakeverse.com/c/${character.character_key}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                title="Share on Instagram"
              >
                <InstagramIcon />
              </a>
            </div>
          </div>

          {/* Card Content Section */}
          <div className={styles.cardContent}>
            
            {/* IP Badge */}
            {character.ip_certified && (
              <div className={styles.ipBadge}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>IP Certified</span>
              </div>
            )}

            {/* Header Section */}
            <div className={styles.headerSection}>
              <h1 className={styles.characterName}>
                {character.display_name || 'Unknown Character'}
              </h1>
              <div className={styles.metaTags}>
                {character.historical_period && (
                  <span className={styles.metaTag}>{character.historical_period}</span>
                )}
                {character.personality_archetype && (
                  <>
                    <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                    <span className={styles.metaTag}>{character.personality_archetype}</span>
                  </>
                )}
                {character.expertise_domain && (
                  <>
                    <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                    <span className={styles.metaTag}>{character.expertise_domain}</span>
                  </>
                )}
              </div>
            </div>

            {/* Bio/Description */}
            <p className={styles.bio}>
              {character.short_description || character.description || 'No description available'}
            </p>

            {/* Stats Row */}
            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {formatNumber(getEngagementValue('total_views'))}
                </span>
                <span className={styles.statLabel}>Views</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {formatNumber(getEngagementValue('total_chats'))}
                </span>
                <span className={styles.statLabel}>Chats</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {formatNumber(getEngagementValue('average_rating') || 4.9)}
                </span>
                <span className={styles.statLabel}>Rating</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionRow}>
              <button onClick={handleStartChat} className={`${styles.btn} ${styles.btnPrimary}`}>
                {user ? 'Start Chatting' : 'Sign Up to Chat'}
              </button>
              <button onClick={handleExploreMore} className={`${styles.btn} ${styles.btnGhost}`}>
                Explore More
              </button>
            </div>

            {/* Creator Info */}
            {character.creator && (
              <div className={styles.creatorLine}>
                Created by <span>{character.creator.display_name || 'Anonymous'}</span>
              </div>
            )}

            {/* Additional Social Sharing */}
            <div className={styles.socialShare}>
              <span className={styles.shareLabel}>Share on:</span>
              <a 
                href={`https://twitter.com/intent/tweet?text=Check out ${encodeURIComponent(character.display_name)} on AwakeVerse - IP certified AI character!&url=https://www.awakeverse.com/c/${character.character_key}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialButton}
                title="Share on Twitter"
              >
                <TwitterIcon />
              </a>
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=https://www.awakeverse.com/c/${character.character_key}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialButton}
                title="Share on Facebook"
              >
                <FacebookIcon />
              </a>
              <a 
                href={`https://www.linkedin.com/sharing/share-offsite/?url=https://www.awakeverse.com/c/${character.character_key}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialButton}
                title="Share on LinkedIn"
              >
                <LinkedInIcon />
              </a>
              <a 
                href={`https://www.reddit.com/submit?url=https://www.awakeverse.com/c/${character.character_key}&title=${encodeURIComponent(character.display_name + ' - IP Certified AI Character on AwakeVerse')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialButton}
                title="Share on Reddit"
              >
                <RedditIcon />
              </a>
              <a 
                href={`https://discord.com/channels/@me?text=${encodeURIComponent(`Check out ${character.display_name} - an IP certified AI character on AwakeVerse: https://www.awakeverse.com/c/${character.character_key}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialButton}
                title="Share on Discord"
              >
                <DiscordIcon />
              </a>
              <a 
                href={`https://www.instagram.com/?url=https://www.awakeverse.com/c/${character.character_key}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialButton}
                title="Share on Instagram"
              >
                <InstagramIcon />
              </a>
            </div>
          </div>
        </article>
      </div>

      {/* Footer */}
      <footer className={styles.pageFooter}>
        <p>© 2025 AwakeVerse • AI Character Platform</p>
      </footer>
    </div>
  );
};

export default PublicCharacterPage;