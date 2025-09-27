// src/components/MarketHub/EnhancedCharacterCard.jsx
import React from 'react';
import { Eye, Heart, Share2, Bookmark, Gem } from 'lucide-react';
import styles from './EnhancedCharacterCard.module.css';

const EnhancedCharacterCard = ({ 
  character, 
  isOwner = false,
  onChatClick,
  onCardClick,
  showEarnings = false 
}) => {
  const {
    character_key,
    display_name,
    short_description,
    expertise_domain,
    creator_level,
    avatar_url,
    engagement_30d = {},
    creator = {},
    earnings = {}
  } = character;

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
    onChatClick?.(character_key);
  };

  const handleCardClick = () => {
    onCardClick?.(character);
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
        {/* Public engagement metrics */}
        <div className={styles.metric}>
          <Eye size={14} />
          <span>{formatNumber(engagement_30d.total_views || 0)}</span>
        </div>
        
        <div className={styles.metric}>
          <Heart size={14} />
          <span>{formatNumber(engagement_30d.total_likes || 0)}</span>
        </div>

        <div className={styles.metric}>
          <Share2 size={14} />
          <span>{formatNumber(engagement_30d.total_shares || 0)}</span>
        </div>

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