// ============================================================================
// UnifiedContentCard.jsx - COMPLETE FIXED VERSION
// ============================================================================

import React, { useEffect } from 'react';
import { characterCategories } from '../../data/characterCategories';
import { isCustomCharacterKey, getDisplayNameFromKey } from '../../utils/characterUtils';
import styles from './UnifiedContentCard.module.css';
import { useEngagementTracking, useEngagementState } from '../../hooks/useEngagementTracking';

const UnifiedContentCard = ({ 
  item, 
  onCardClick,
  onChatClick,
  onEngage,
  userCharacters = []
}) => {
  const isCharacter = item.content_type === 'character';
  const isScenario = item.content_type === 'scenario';

  // ADD ENGAGEMENT HOOKS FOR CHARACTERS
  const { trackView, trackShare } = useEngagementTracking();
  const { 
    liked, 
    bookmarked, 
    loaded,
    loading,
    toggleLike, 
    toggleBookmark 
  } = useEngagementState(isCharacter ? item.character_id : null);

  // Track view when card is displayed
  useEffect(() => {
    if (isCharacter && item.character_id) {
      trackView(item.character_id, {
        view_context: 'unified_content_card',
        expertise_domain: item.expertise_domain
      });
    }
  }, [isCharacter, item.character_id, trackView, item.expertise_domain]);

  if (!item || !item.content_type) {
    console.error('❌ UnifiedContentCard: Invalid item data', item);
    return null;
  }

  const getCharacterInfo = (charKey) => {
    const isCustom = isCustomCharacterKey(charKey);
    
    if (isCustom) {
      const customChar = userCharacters.find(c => c.character_key === charKey);
      
      if (customChar) {
        return {
          name: customChar.display_name,
          thumbnailUrl: customChar.avatar_url,
          isCustom: true
        };
      }
      
      return {
        name: getDisplayNameFromKey(charKey),
        thumbnailUrl: `/images/${charKey}.jpg`,
        isCustom: true
      };
    } else {
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

  const handleEngage = async (engagementType, e) => {
    e.stopPropagation();
    if (onEngage) {
      await onEngage(item, engagementType);
    }
  };

  const handleChatClick = (e) => {
    e.stopPropagation();
    if (item.content_type === 'character') {
      onChatClick?.(item);
    }
  };

  const handleCardClick = () => {
    onCardClick?.(item);
  };

  // Format numbers for display
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // ============================================================================
  // RENDER CHARACTER CARD - FIXED ENGAGEMENT METRICS
  // ============================================================================
  if (isCharacter) {
    // ✅ HANDLE BOTH DATA STRUCTURES:
    // 1. Leaderboard style: item.period_views, item.period_likes (root level)
    // 2. Browse style: item.engagement_30d.total_views, item.engagement_30d.total_likes (nested)
    
    const totalLikes = 
      item.period_likes ||                           // Leaderboard format
      item.engagement_30d?.total_likes ||            // Browse format  
      0;

    const totalBookmarks = 
      item.period_bookmarks ||                       // Leaderboard format  
      item.engagement_30d?.total_bookmarks ||        // Browse format
      0;

    const totalEngagement = 
      item.total_engagement_score || 
      item.engagement_score || 
      item.period_views ||                           // Leaderboard format
      item.engagement_30d?.total_views ||            // Browse format
      0;
    
    // 🐛 DEBUG: Add this right here to see what data is available
    console.log('🔍 Character Card Data:', {
      name: item.display_name,
      period_likes: item.period_likes,
      period_views: item.period_views,
      engagement_30d: item.engagement_30d,
      total_engagement_score: item.total_engagement_score,
      computed_likes: totalLikes,
      computed_bookmarks: totalBookmarks,
      computed_engagement: totalEngagement
    });

    return (
      <div 
        className={styles.card} 
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
      >
        <div className={styles.cardHeader}>
          <img 
            src={item.avatar_url || '/default-avatar.jpg'} 
            alt={item.display_name}
            className={styles.avatar}
            onError={(e) => {e.target.src = '/default-avatar.jpg'}}
          />
          <div className={styles.badge}>Character</div>
        </div>

        <div className={styles.cardContent}>
          <h3 className={styles.title}>{item.display_name}</h3>

          {item.expertise_domain && (
            <div className={styles.domain}>{item.expertise_domain}</div>
          )}

          <p className={styles.description}>{item.short_description}</p>

          <div className={styles.meta}>
            <span className={styles.metaItem}>
              🏆 {formatNumber(totalEngagement)}
            </span>
            <span className={styles.metaItem}>
              {item.creator_level || 'newcomer'}
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.actionBtn}
            onClick={(e) => handleEngage('like', e)}
            title="Like"
          >
            ❤️ {formatNumber(totalLikes)}
          </button>
          <button 
            className={styles.actionBtn}
            onClick={(e) => handleEngage('bookmark', e)}
            title="Bookmark"
          >
            🔖 {formatNumber(totalBookmarks)}
          </button>
          <button 
            className={styles.primaryBtn}
            onClick={handleChatClick}
            title="Start chatting"
          >
            Start Chat →
          </button>
        </div>
      </div>
    );
  }
  
  // ============================================================================
  // RENDER SCENARIO CARD - UNCHANGED
  // ============================================================================
  if (isScenario) {
    const characterKeys = item.character_keys || [];
    
    const characterThumbnails = characterKeys.slice(0, 4).map((charKey, index) => {
      const charInfo = getCharacterInfo(charKey);
      const initial = charInfo.name.charAt(0).toUpperCase();
      
      return (
        <div 
          key={index} 
          className={styles.characterThumb}
          title={charInfo.name}
        >
          {charInfo.thumbnailUrl ? (
            <img 
              src={charInfo.thumbnailUrl}
              alt={charInfo.name}
              className={styles.thumbImg}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <span 
            className={styles.thumbFallback} 
            style={{ display: charInfo.thumbnailUrl ? 'none' : 'flex' }}
          >
            {initial}
          </span>
        </div>
      );
    });

    return (
      <div 
        className={`${styles.card} ${styles.scenarioCard}`}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
      >
        <div className={styles.cardHeader}>
          <div className={styles.scenarioIcon}>🎭</div>
          <div className={`${styles.badge} ${styles.scenarioBadge}`}>Scenario</div>
        </div>

        <div className={styles.cardContent}>
          <h3 className={styles.title}>{item.title}</h3>
          
          {item.category && (
            <div className={styles.domain}>{item.category}</div>
          )}
          
          <p className={styles.description}>{item.description}</p>
          
          <div className={styles.characterThumbnails}>
            {characterThumbnails}
            {item.character_count > 4 && (
              <div className={`${styles.characterThumb} ${styles.more}`}>
                +{item.character_count - 4}
              </div>
            )}
          </div>
          
          <div className={styles.meta}>
            <span className={styles.metaItem}>
              👥 {item.character_count || 0} characters
            </span>
            <span className={styles.metaItem}>
              🏆 {item.total_engagement_score || 0}
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.actionBtn}
            onClick={(e) => handleEngage('like', e)}
            title="Like"
          >
            ❤️ {item.engagement_30d?.total_likes || 0}
          </button>
          <button 
            className={styles.actionBtn}
            onClick={(e) => handleEngage('bookmark', e)}
            title="Bookmark"
          >
            🔖 {item.engagement_30d?.total_bookmarks || 0}
          </button>
          <button 
            className={styles.primaryBtn}
            onClick={handleCardClick}
            title="Start this debate"
          >
            Start Debate →
          </button>
        </div>
      </div>
    );
  }

  console.warn('⚠️ UnifiedContentCard: Unknown content_type:', item.content_type);
  return null;
};

export default UnifiedContentCard;