// UnifiedContentCard.jsx - Design-system aligned cinematic card
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
  if (!item || !item.content_type) {
    console.error('❌ UnifiedContentCard: Invalid item data', item);
    return null;
  }

  const isCharacter = item.content_type === 'character';
  const isScenario = item.content_type === 'scenario';

  const [copySuccess, setCopySuccess] = useState(false);

  // ENGAGEMENT HOOKS (preserved)
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

  /**
   * Character info helper (used for scenario thumbnails + future backgrounds)
   */
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

  /**
   * Background image resolver
   * Priority:
   *  1. scene_url (for scenarios/stories)
   *  2. Character avatar (characters)
   *  3. First scenario participant thumbnail (scenarios)
   */
  const getBackgroundImageUrl = () => {
    if (item.scene_url) {
      return item.scene_url;
    }

    if (isCharacter) {
      if (item.scenic_url) return item.scenic_url;
      if (item.avatar_url) return item.avatar_url;
      return null;
    }

    if (isScenario) {
      const characterKeys = item.character_keys || [];
      if (characterKeys.length > 0) {
        const firstInfo = getCharacterInfo(characterKeys[0]);
        if (firstInfo?.thumbnailUrl) {
          return firstInfo.thumbnailUrl;
        }
      }
    }

    return null;
  };

  const backgroundUrl = getBackgroundImageUrl();

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  // Handle share button click (character + scenario)
  const handleShareClick = async (e) => {
    e.stopPropagation();

    try {
      let shareUrl;
      let shareTitle;
      let shareText;

      if (isCharacter) {
        const safeSlug =
          item.display_name?.toLowerCase().replace(/\s+/g, '_') || 'character';
        const characterKey =
          item.character_key ||
          (item.creator_id
            ? `user_${item.creator_id}_${safeSlug}`
            : safeSlug);

        shareUrl = `${window.location.origin}/c/${characterKey}`;
        shareTitle = `${item.display_name} - AI Character on AwakeVerse`;
        shareText = item.short_description;

        if (item.character_id) {
          trackShare(item.character_id, {
            share_context: 'unified_content_card',
            share_type: 'character'
          });
        }
      } else if (isScenario) {
        const scenarioId = item.id || item.scenario_id;
        shareUrl = `${window.location.origin}/s/${scenarioId}`;
        shareTitle = `${item.title} - Multi-Character Debate on AwakeVerse`;
        shareText = item.description;

        if (scenarioId) {
          trackShare(scenarioId, {
            share_context: 'unified_content_card',
            share_type: 'scenario'
          });
        }
      } else {
        return;
      }

      // Native Web Share API first (mobile-friendly)
      if (navigator.share) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl
          });
          console.log('✅ Shared successfully via Web Share API');
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
          return;
        } catch (shareError) {
          if (shareError?.name !== 'AbortError') {
            console.log('Web Share failed, falling back to clipboard');
          }
        }
      }

      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);

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
    if (num == null) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // ============================================================================
  // CHARACTER CARD (cinematic background)
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

    const totalViews =
      item.period_views ||
      item.engagement_30d?.total_views ||
      0;

    const totalEngagement =
      item.total_engagement_score ||
      item.engagement_score ||
      totalViews + totalLikes + totalBookmarks;

    return (
      <div
        className={styles.card}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        {backgroundUrl && (
          <div
            className={styles.cardBackground}
            style={{ backgroundImage: `url(${backgroundUrl})` }}
          >
            <div className={styles.cardGradient} />
          </div>
        )}

        <div className={styles.cardInner}>
          <div className={styles.cardHeader}>
            <div className={styles.headerMain}>
              <img
                src={item.avatar_url || '/default-avatar.jpg'}
                alt={item.display_name}
                className={styles.avatar}
                onError={(e) => {
                  e.target.src = '/default-avatar.jpg';
                }}
              />
              <div className={styles.headerText}>
                <h3 className={styles.title}>{item.display_name}</h3>
                {item.expertise_domain && (
                  <div className={styles.domain}>{item.expertise_domain}</div>
                )}
              </div>
            </div>

            <div className={styles.badge}>Character</div>
          </div>

          {item.short_description && (
            <p className={styles.description}>{item.short_description}</p>
          )}

          <div className={styles.meta}>
            <span className={styles.metaItem}>
              🏆 {formatNumber(totalEngagement)}
            </span>
            <span className={styles.metaItem}>
              👁️ {formatNumber(totalViews)}
            </span>
            <span className={styles.metaItem}>
              {item.creator_level || 'newcomer'}
            </span>
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
              className={`${styles.actionBtn} ${
                copySuccess ? styles.shareSuccess : ''
              }`}
              onClick={handleShareClick}
              title={copySuccess ? 'Link copied!' : 'Share character'}
            >
              {copySuccess ? '✓ Copied' : (
                <>
                  <Share2 size={14} /> Share
                </>
              )}
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
      </div>
    );
  }

  // ============================================================================
  // SCENARIO CARD (cinematic background, future-ready for scene_url)
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
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        {backgroundUrl && (
          <div
            className={styles.cardBackground}
            style={{ backgroundImage: `url(${backgroundUrl})` }}
          >
            <div className={styles.cardGradient} />
          </div>
        )}

        <div className={styles.cardInner}>
          <div className={styles.cardHeader}>
            <div className={styles.headerMain}>
              <div className={styles.scenarioIcon}>⚔️</div>
              <div className={styles.headerText}>
                <h3 className={styles.title}>{item.title}</h3>
                {item.category && (
                  <div className={styles.domain}>{item.category}</div>
                )}
              </div>
            </div>
            <div className={`${styles.badge} ${styles.scenarioBadge}`}>
              Dialogue
            </div>
          </div>

          {item.description && (
            <p className={styles.description}>{item.description}</p>
          )}

          {characterThumbnails.length > 0 && (
            <div className={styles.characterThumbnails}>
              {characterThumbnails}
              {characterKeys.length > 4 && (
                <span className={styles.more}>
                  +{characterKeys.length - 4} more
                </span>
              )}
            </div>
          )}

          <div className={styles.meta}>
            <span className={styles.metaItem}>
              👥 {item.character_count || characterKeys.length || 0} characters
            </span>
            <span className={styles.metaItem}>
              🏆 {formatNumber(item.total_engagement_score || 0)}
            </span>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.actionBtn}
              onClick={(e) => handleEngage('like', e)}
              title="Like"
            >
              ❤️ {formatNumber(item.engagement_30d?.total_likes || 0)}
            </button>
            <button
              className={styles.actionBtn}
              onClick={(e) => handleEngage('bookmark', e)}
              title="Bookmark"
            >
              🔖 {formatNumber(item.engagement_30d?.total_bookmarks || 0)}
            </button>
            <button
              className={`${styles.actionBtn} ${
                copySuccess ? styles.shareSuccess : ''
              }`}
              onClick={handleShareClick}
              title={copySuccess ? 'Link copied!' : 'Share dialogue'}
            >
              {copySuccess ? '✓ Copied' : (
                <>
                  <Share2 size={14} /> Share
                </>
              )}
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
      </div>
    );
  }

  console.warn('⚠️ UnifiedContentCard: Unknown content_type:', item.content_type);
  return null;
};

export default UnifiedContentCard;
