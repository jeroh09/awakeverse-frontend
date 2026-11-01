// src/components/MarketHub/EnhancedCharacterCard.jsx
// FIXED: Now loads engagement state from backend on mount

import React, { useEffect } from 'react';
import { Eye, Heart, Share2, Bookmark, Gem } from 'lucide-react';
import { useEngagementTracking, useEngagementState } from '../../hooks/useEngagementTracking';
import styles from './EnhancedCharacterCard.module.css';

const EnhancedCharacterCard = ({ 
  character, 
  isOwner = false,
  onChatClick,
  onCardClick,
  showEarnings = false 
}) => {
  const {
    character_id,
    display_name,
    short_description,
    expertise_domain,
    creator_level,
    avatar_url,
    engagement_30d = {},
    creator = {},
    earnings = {}
  } = character;

  // ENGAGEMENT TRACKING HOOKS
  const { trackView, trackShare } = useEngagementTracking();
  
  // FIXED: Now loads state from backend
  const { 
    liked, 
    bookmarked, 
    loaded,
    loading,
    toggleLike, 
    toggleBookmark 
  } = useEngagementState(character_id);

  // Track view when card is displayed
  useEffect(() => {
    if (character_id) {
      trackView(character_id, {
        view_context: 'character_card',
        expertise_domain: expertise_domain
      });
    }
  }, [character_id, trackView, expertise_domain]);

  // Format large numbers compactly
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Format earnings compactly
  const formatEarnings = (amount) => {
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    if (amount >= 100) return `$${Math.round(amount)}`;
    return `$${amount.toFixed(1)}`;
  };

  const handleChatClick = (e) => {
    e.stopPropagation();
    onChatClick?.(character.character_key || character.key);
  };

  const handleCardClick = () => {
    onCardClick?.(character);
  };

  // Handle like with tracking
  const handleLikeClick = async (e) => {
    e.stopPropagation();
    
    // Don't allow interaction while loading
    if (loading) return;
    
    await toggleLike();
  };

  // Handle bookmark with tracking
  const handleBookmarkClick = async (e) => {
    e.stopPropagation();
    
    // Don't allow interaction while loading
    if (loading) return;
    
    await toggleBookmark();
  };

  // Handle share with tracking
  const handleShareClick = async (e) => {
    e.stopPropagation();
    
    const characterUrl = `${window.location.origin}/market-hub?character=${character.character_key || character.key}`;
    
    try {
      await navigator.clipboard.writeText(characterUrl);
      
      // Track the share event with metadata
      await trackShare(character_id, 'link_copy', {
        character_name: display_name,
        expertise_domain: expertise_domain
      });
      
      // TODO: Replace with toast notification
      alert('Character link copied to clipboard!');
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  return (
    <div className={styles.card} onClick={handleCardClick}>
      <div className={styles.header}>
        <img
          src={avatar_url}
          alt={display_name}
          className={styles.avatar}
          onError={(e) => {
            e.target.src = '/images/default-character.jpg';
          }}
        />
        <div className={styles.creatorInfo}>
          <span className={styles.creatorName}>
            {creator.display_name || 'Creator'}
          </span>
          <span className={styles.creatorLevel}>
            {creator_level || 'newcomer'}
          </span>
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.characterName}>{display_name}</h3>
        
        {expertise_domain && (
          <div className={styles.domainBadge}>
            {expertise_domain}
          </div>
        )}

        <div className={styles.description}>
          {short_description}
        </div>
      </div>

      <div className={styles.metrics}>
        {/* View count */}
        <div className={styles.metric}>
          <Eye size={14} />
          <span>{formatNumber(engagement_30d.total_views || 0)}</span>
        </div>
        
        {/* Like button with tracking - Shows loading state */}
        <button 
          className={`${styles.metric} ${styles.actionButton} ${liked ? styles.active : ''} ${loading ? styles.loading : ''}`}
          onClick={handleLikeClick}
          disabled={loading}
          title={liked ? "Unlike this character" : "Like this character"}
        >
          <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
          <span>{formatNumber(engagement_30d.total_likes || 0)}</span>
        </button>

        {/* Share button with tracking */}
        <button 
          className={`${styles.metric} ${styles.actionButton}`}
          onClick={handleShareClick}
          title="Share this character"
        >
          <Share2 size={14} />
          <span>{formatNumber(engagement_30d.total_shares || 0)}</span>
        </button>

        {/* Bookmark button with tracking - Shows loading state */}
        <button 
          className={`${styles.metric} ${styles.actionButton} ${bookmarked ? styles.active : ''} ${loading ? styles.loading : ''}`}
          onClick={handleBookmarkClick}
          disabled={loading}
          title={bookmarked ? "Remove bookmark" : "Bookmark this character"}
        >
          <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
        </button>

        {/* Earnings - only show to character owner */}
        {isOwner && showEarnings && earnings.total_30d > 0 && (
          <div className={styles.metric + ' ' + styles.earnings}>
            <Gem size={14} />
            <span>{formatEarnings(earnings.total_30d)}</span>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <button 
          className={styles.chatButton}
          onClick={handleChatClick}
        >
          Chat Now
        </button>
      </div>
    </div>
  );
};

export default EnhancedCharacterCard;