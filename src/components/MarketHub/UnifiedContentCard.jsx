// UnifiedContentCard.jsx - UPDATED WITH SHARE FUNCTIONALITY
// Location: src/components/MarketHub/UnifiedContentCard.jsx

import React, { useEffect, useState } from 'react';
import { Share2 } from 'lucide-react';
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
  
  const [copySuccess, setCopySuccess] = useState(false);

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

  // NEW: Handle share button click
  const handleShareClick = async (e) => {
    e.stopPropagation();
    
    try {
      let shareUrl;
      let shareTitle;
      let shareText;
      
      if (isCharacter) {
        // Build character share URL
        const characterKey = item.character_key || `user_${item.character_id}_${item.display_name?.toLowerCase().replace(/\s+/g, '_')}`;
        shareUrl = `${window.location.origin}/c/${characterKey}`;
        shareTitle = `${item.display_name} - AI Character on AwakeVerse`;
        shareText = item.short_description;
        
        // Track the share event
        if (item.character_id) {
          await trackShare(item.character_id, 'link_copy', {
            character_name: item.display_name,
            expertise_domain: item.expertise_domain
          });
        }
      } else if (isScenario) {
        // Build scenario share URL
        shareUrl = `${window.location.origin}/s/${item.id || item.scenario_id}`;
        shareTitle = `${item.title} - Multi-Character Debate on AwakeVerse`;
        shareText = item.description;
      }
      
      // Try native Web Share API first (mobile friendly)
      if (navigator.share) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl
          });
          console.log('✅ Shared successfully via Web Share API');
          return;
        } catch (shareError) {
          // User cancelled or share failed, fall back to clipboard
          if (shareError.name !== 'AbortError') {
            console.log('Web Share failed, falling back to clipboard');
          }
        }
      }
      
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      
      // Show success feedback
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      
      console.log('✅ Link copied to clipboard:', shareUrl);
      
    } catch (err) {
      console.error('❌ Share failed:', err);
      alert('Failed to share. Please try again.');
    }
  };

  // Format numbers for display
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // ============================================================================
  // RENDER CHARACTER CARD - WITH SHARE BUTTON
  // ============================================================================
  if (isCharacter) {
    const totalLikes = 
      item.period_likes ||
      item.engagement_30d?.total_likes ||
      0;

    const totalBookmarks = 
      item.period_bookmarks ||
      item.engagement_30d?.total_bookmarks ||
      0;

    const totalEngagement = 
      item.total_engagement_score || 
      item.engagement_score || 
      item.period_views ||
      item.engagement_30d?.total_views ||
      0;

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
            className={`${styles.actionBtn} ${copySuccess ? styles.shareSuccess : ''}`}
            onClick={handleShareClick}
            title={copySuccess ? "Link copied!" : "Share character"}
          >
            {copySuccess ? '✓ Copied' : <><Share2 size={14} /> Share</>}
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
  // RENDER SCENARIO CARD - WITH SHARE BUTTON
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
            className={`${styles.actionBtn} ${copySuccess ? styles.shareSuccess : ''}`}
            onClick={handleShareClick}
            title={copySuccess ? "Link copied!" : "Share scenario"}
          >
            {copySuccess ? '✓ Copied' : <><Share2 size={14} /> Share</>}
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