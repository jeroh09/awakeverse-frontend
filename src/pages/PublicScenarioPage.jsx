// PublicScenarioPage.jsx - UPDATED WITH FIRST PARTICIPANT AVATAR
// Location: src/pages/PublicScenarioPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { characterCategories } from '../data/characterCategories';
import { isCustomCharacterKey, getDisplayNameFromKey } from '../utils/characterUtils';
import styles from './PublicScenarioPage.module.css';
import { 
  TwitterIcon, 
  FacebookIcon, 
  LinkedInIcon, 
  RedditIcon, 
  DiscordIcon, 
  InstagramIcon 
} from '../components/SocialIcons';

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
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getCharacterInfo = (charKey) => {
    if (!charKey || typeof charKey !== 'string') {
      return {
        name: 'Unknown Character',
        thumbnailUrl: '/images/default-character.jpg',
        isCustom: false
      };
    }

    try {
      const isCustom = isCustomCharacterKey(charKey);
      
      if (isCustom) {
        return {
          name: getDisplayNameFromKey(charKey),
          thumbnailUrl: `/images/${charKey}.jpg`,
          isCustom: true
        };
      } else {
        if (Array.isArray(characterCategories)) {
          for (const category of characterCategories) {
            if (category.characters && Array.isArray(category.characters)) {
              const found = category.characters.find(c => c.key === charKey);
              if (found) {
                return {
                  name: found.name || charKey,
                  thumbnailUrl: found.thumbnailUrl || `/images/${charKey}.jpg`,
                  isCustom: false
                };
              }
            }
          }
        }
        
        return {
          name: charKey,
          thumbnailUrl: `/images/${charKey}.jpg`,
          isCustom: false
        };
      }
    } catch (err) {
      console.error('Error getting character info:', err);
      return {
        name: charKey,
        thumbnailUrl: '/images/default-character.jpg',
        isCustom: false
      };
    }
  };

  // Get first participant for the main visual
  const getFirstParticipant = () => {
    if (!scenario?.character_keys || !Array.isArray(scenario.character_keys) || scenario.character_keys.length === 0) {
      return {
        name: 'Unknown Character',
        thumbnailUrl: '/images/default-character.jpg',
        isCustom: false
      };
    }
    return getCharacterInfo(scenario.character_keys[0]);
  };

  const handleStartDebate = () => {
    if (!scenario || !scenarioId) {
      console.error('Scenario data incomplete');
      return;
    }

    if (user) {
      navigate(`/scenarios?start=${scenarioId}`);
    } else {
      navigate(`/register?redirect=/scenarios?start=${scenarioId}`);
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
      return scenario?.engagement_30d?.[field] || 0;
    } catch (e) {
      return 0;
    }
  };

  if (loading) {
    return (
      <div className={`${styles.publicScenarioPage} ${styles.loading}`}>
        <div className={styles.spinner}></div>
        <p>Loading scenario...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.publicScenarioPage} ${styles.error}`}>
        <div className={styles.errorContainer}>
          <h2>😕 Scenario Not Found</h2>
          <p>{error}</p>
          <button onClick={handleExploreMore} className={styles.exploreButton}>
            Explore Other Scenarios
          </button>
        </div>
      </div>
    );
  }

  if (!scenario) {
    return null;
  }

  const firstParticipant = getFirstParticipant();

  return (
    <div className={styles.publicScenarioPage}>
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
        <article className={styles.scenarioCard}>
          
          {/* Card Visual Section - Using First Participant Avatar */}
          <div className={styles.cardVisual}>
            <img
              src={firstParticipant.thumbnailUrl}
              alt={firstParticipant.name}
              className={styles.characterImg}
              onError={(e) => {
                e.target.src = '/images/default-character.jpg';
              }}
            />
            
            {/* Scenario Badge Overlay */}
            <div className={styles.scenarioBadge}>
              🎭 Scenario
            </div>
            
            {/* Visual Overlay with ALL Social Icons */}
            <div className={styles.visualOverlay}>
              <a 
                href={`https://twitter.com/intent/tweet?text=Check out "${encodeURIComponent(scenario.title)}" scenario on AwakeVerse!&url=https://www.awakeverse.com/s/${scenarioId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                title="Share on Twitter"
              >
                𝕏
              </a>
              <a 
                href={`https://www.linkedin.com/sharing/share-offsite/?url=https://www.awakeverse.com/s/${scenarioId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                title="Share on LinkedIn"
              >
                in
              </a>
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=https://www.awakeverse.com/s/${scenarioId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                title="Share on Facebook"
              >
                f
              </a>
              <a 
                href={`https://www.reddit.com/submit?url=https://www.awakeverse.com/s/${scenarioId}&title=${encodeURIComponent(scenario.title + ' - AI Debate Scenario on AwakeVerse')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                title="Share on Reddit"
              >
                <RedditIcon />
              </a>
              <a 
                href={`https://discord.com/channels/@me?text=${encodeURIComponent(`Check out "${scenario.title}" - an AI debate scenario on AwakeVerse: https://www.awakeverse.com/s/${scenarioId}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                title="Share on Discord"
              >
                <DiscordIcon />
              </a>
              <a 
                href={`https://www.instagram.com/?url=https://www.awakeverse.com/s/${scenarioId}`}
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
            
            {/* Featured Badge */}
            {scenario.is_market_featured && (
              <div className={styles.featuredBadge}>⭐ Featured Scenario</div>
            )}

            {/* Header Section */}
            <div className={styles.headerSection}>
              <h1 className={styles.scenarioTitle}>
                {scenario.title || 'Untitled Scenario'}
              </h1>
              <div className={styles.metaTags}>
                {scenario.category && (
                  <span className={styles.metaTag}>{scenario.category}</span>
                )}
                {scenario.character_keys && (
                  <>
                    <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                    <span className={styles.metaTag}>
                      {scenario.character_keys.length} Participants
                    </span>
                  </>
                )}
                {scenario.difficulty && (
                  <>
                    <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                    <span className={styles.metaTag}>{scenario.difficulty}</span>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <p className={styles.bio}>
              {scenario.description || 'No description available'}
            </p>

            {/* Participants Section */}
            {scenario.character_keys && Array.isArray(scenario.character_keys) && scenario.character_keys.length > 0 && (
              <div className={styles.participantsSection}>
                <h3 className={styles.sectionTitle}>
                  Debate Participants
                </h3>
                <div className={styles.participantsGrid}>
                  {scenario.character_keys.map((charKey, index) => {
                    const charInfo = getCharacterInfo(charKey);
                    return (
                      <div key={`${charKey}-${index}`} className={styles.participantCard}>
                        <div className={styles.participantAvatar}>
                          <img
                            src={charInfo.thumbnailUrl}
                            alt={charInfo.name}
                            onError={(e) => {
                              e.target.src = '/images/default-character.jpg';
                            }}
                          />
                        </div>
                        <div className={styles.participantInfo}>
                          <div className={styles.participantName}>{charInfo.name}</div>
                          {charInfo.isCustom && (
                            <div className={styles.customBadge}>Custom</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                  {formatNumber(getEngagementValue('total_starts'))}
                </span>
                <span className={styles.statLabel}>Debates</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {formatNumber(getEngagementValue('average_rating') || 4.8)}
                </span>
                <span className={styles.statLabel}>Rating</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionRow}>
              <button onClick={handleStartDebate} className={`${styles.btn} ${styles.btnPrimary}`}>
                {user ? 'Start Debate' : 'Sign Up to Debate'}
              </button>
              <button onClick={handleExploreMore} className={`${styles.btn} ${styles.btnGhost}`}>
                Explore More
              </button>
            </div>

            {/* Creator Info */}
            {scenario.creator && (
              <div className={styles.creatorLine}>
                Created by <span>{scenario.creator.display_name || 'Anonymous'}</span>
                <span className={styles.creatorLevel}>
                  • {scenario.creator.creator_level || 'creator'}
                </span>
              </div>
            )}
          </div>
        </article>
      </div>

      {/* Footer */}
      <footer className={styles.pageFooter}>
        <p>© 2025 AwakeVerse • Multi-Character AI Debates</p>
      </footer>
    </div>
  );
};

export default PublicScenarioPage;