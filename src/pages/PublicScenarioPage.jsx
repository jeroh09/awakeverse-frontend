// PublicScenarioPage.jsx
// Location: src/pages/PublicScenarioPage.jsx
// Public scenario profile page for shared links
// UPDATED: Using CSS Modules for proper style scoping

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { characterCategories } from '../data/characterCategories';
import { isCustomCharacterKey, getDisplayNameFromKey } from '../utils/characterUtils';
import styles from './PublicScenarioPage.module.css';

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
      
      // DEFENSIVE: Validate response structure
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
    // DEFENSIVE: Handle missing or invalid charKey
    if (!charKey || typeof charKey !== 'string') {
      return {
        name: 'Unknown Character',
        thumbnailUrl: '/images/default-character.jpg',
        isCustom: false
      };
    }

    try {
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
        
        // Fallback if not found
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

  const handleStartDebate = () => {
    // DEFENSIVE: Ensure scenario exists and has ID
    if (!scenario || !scenarioId) {
      console.error('Scenario data incomplete');
      return;
    }

    if (user) {
      // User is logged in - go to scenario
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
    // DEFENSIVE: Handle invalid inputs
    if (typeof num !== 'number' || isNaN(num)) return '0';
    
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // DEFENSIVE: Safe access to nested engagement data
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

  // DEFENSIVE: Don't render if no scenario data
  if (!scenario) {
    return null;
  }

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

      {/* Scenario Profile Section */}
      <div className={styles.scenarioProfile}>
        <div className={styles.profileContent}>
          {/* Scenario Icon/Header */}
          <div className={styles.scenarioHeader}>
            <div className={styles.scenarioIcon}>🎭</div>
            <div className={styles.scenarioInfo}>
              <h1 className={styles.scenarioTitle}>
                {scenario.title || 'Untitled Scenario'}
              </h1>
              {scenario.category && (
                <div className={styles.categoryBadge}>{scenario.category}</div>
              )}
              {scenario.is_market_featured && (
                <div className={styles.featuredBadge}>⭐ Featured</div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className={styles.descriptionSection}>
            <p className={styles.scenarioDescription}>
              {scenario.description || 'No description available'}
            </p>
          </div>

          {/* Participants */}
          {scenario.character_keys && Array.isArray(scenario.character_keys) && scenario.character_keys.length > 0 && (
            <div className={styles.participantsSection}>
              <h3 className={styles.sectionTitle}>
                Debate Participants ({scenario.character_count || scenario.character_keys.length})
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

          {/* Creator Info */}
          {scenario.creator && (
            <div className={styles.creatorInfo}>
              <span className={styles.createdBy}>Created by </span>
              <span className={styles.creatorName}>
                {scenario.creator.display_name || 'Anonymous'}
              </span>
              <span className={styles.creatorLevel}>
                • {scenario.creator.creator_level || 'creator'}
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
                {formatNumber(getEngagementValue('total_starts'))}
              </span>
              <span className={styles.statLabel}>Debates</span>
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
            <button onClick={handleStartDebate} className={styles.startDebateBtn}>
              {user ? '🎭 Start Debate' : '🚀 Sign Up to Debate'}
            </button>
            <button onClick={handleExploreMore} className={styles.exploreBtn}>
              Explore More Scenarios
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.pageFooter}>
        <p>© 2025 AwakeVerse • Multi-Character AI Debates</p>
      </footer>
    </div>
  );
};

export default PublicScenarioPage;