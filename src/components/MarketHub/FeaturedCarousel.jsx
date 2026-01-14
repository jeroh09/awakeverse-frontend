// src/components/MarketHub/FeaturedCarousel.jsx - 3-CARD LAYOUT VERSION
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Users, MessageCircle, Heart, Bookmark } from 'lucide-react';
import { useEngagementTracking } from '../../hooks/useEngagementTracking';
import styles from './FeaturedCarousel.module.css';

const FeaturedCarousel = ({ 
  characters = [], 
  loading = false, 
  onCharacterClick, 
  onChatClick 
}) => {
  // Current page state (shows 3 characters at a time)
  const [currentPage, setCurrentPage] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef(null);
  const autoPlayRef = useRef(null);
  
  const { trackView, trackShare } = useEngagementTracking();

  // Calculate pagination (3 characters per page)
  const charactersPerPage = 3;
  const totalPages = Math.ceil(characters.length / charactersPerPage);
  
  // Get characters for current page (positions 2, 1, 3)
  const getPageCharacters = () => {
    const startIdx = currentPage * charactersPerPage;
    const pageChars = characters.slice(startIdx, startIdx + charactersPerPage);
    
    // Arrange as: [position2, position1, position3] or [left, center, right]
    if (pageChars.length >= 3) {
      return [pageChars[1], pageChars[0], pageChars[2]]; // Rearrange: 2, 1, 3
    } else if (pageChars.length === 2) {
      return [null, pageChars[0], pageChars[1]]; // Center and right only
    } else if (pageChars.length === 1) {
      return [null, pageChars[0], null]; // Center only
    }
    return [null, null, null];
  };

  const [leftChar, centerChar, rightChar] = getPageCharacters();

  // Track views for all visible characters
  useEffect(() => {
    [leftChar, centerChar, rightChar].forEach((char) => {
      if (char?.character_id) {
        trackView(char.character_id, {
          view_context: 'featured_carousel_3card',
          expertise_domain: char.expertise_domain,
          feature_position: char.feature_position
        });
      }
    });
  }, [currentPage, leftChar, centerChar, rightChar, trackView]);

  // Normalize character data helper
  const normalizeCharacterData = (character) => {
    if (!character) return null;
    
    return {
      character_key: character.character_key,
      character_id: character.character_id,
      display_name: character.character_name || character.display_name,
      short_description: character.character_description || character.short_description,
      expertise_domain: character.expertise_domain,
      avatar_url: character.avatar_url,
      feature_position: character.feature_position,
      total_engagement: character.total_engagement,
      creator: {
        display_name: character.creator?.display_name || 'Creator',
        username: character.creator?.username,
        creator_level: character.creator?.creator_level || 'newcomer'
      },
      engagement_30d: character.engagement_30d || {
        total_views: 0,
        total_likes: 0,
        total_shares: 0,
        total_chats: 0,
        total_bookmarks: 0
      }
    };
  };

  // Auto-play functionality (advance to next page)
  useEffect(() => {
    if (!isAutoPlaying || totalPages <= 1) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentPage(prev => (prev + 1) % totalPages);
    }, 6000); // 6 seconds per page

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, totalPages]);

  // Pause auto-play on hover
  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  // Navigation functions
  const goToPrevious = () => {
    setCurrentPage(prev => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentPage(prev => (prev + 1) % totalPages);
  };

  const goToPage = (pageIndex) => {
    setCurrentPage(pageIndex);
  };

  // Get engagement data helper
  const getEngagementData = (character) => {
    if (!character) return { totalLikes: 0, totalBookmarks: 0, totalEngagement: 0, totalChats: 0, totalViews: 0 };
    
    const normalizedChar = normalizeCharacterData(character);
    const engagement = normalizedChar?.engagement_30d || {};
    
    return {
      totalLikes: engagement.total_likes || 0,
      totalBookmarks: engagement.total_bookmarks || 0,
      totalViews: engagement.total_views || 0,
      totalEngagement: engagement.total_views || normalizedChar?.total_engagement || 0,
      totalChats: engagement.total_chats || 0
    };
  };

  // Character click handler
  const handleCharacterClick = (character) => {
    if (!character) return;
    
    const normalizedChar = normalizeCharacterData(character);

    const dualFormatChar = {
      name: normalizedChar.display_name || normalizedChar.character_key || 'Character',
      description: normalizedChar.short_description || '',
      key: normalizedChar.character_key,
      thumbnailUrl: normalizedChar.avatar_url || `/images/${normalizedChar.character_key}.jpg`,
      ...normalizedChar,
      display_name: normalizedChar.display_name || normalizedChar.character_key,
      character_key: normalizedChar.character_key,
      short_description: normalizedChar.short_description || '',
      avatar_url: normalizedChar.avatar_url
    };

    console.log('🔍 Featured Carousel - Character clicked:', normalizedChar);
    onCharacterClick?.(dualFormatChar);
  };

  // Chat click handler
  const handleChatClick = (e, character) => {
    e.stopPropagation();
    if (!character) return;
    
    const normalizedChar = normalizeCharacterData(character);
    
    console.log('🔍 Featured Carousel - Starting chat with:', {
      displayName: normalizedChar?.display_name,
      character_key: normalizedChar?.character_key,
      character_id: normalizedChar?.character_id
    });

    if (onChatClick) {
      onChatClick(normalizedChar);
    }
  };

  // Format numbers for display
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Render individual card
  const renderCard = (character, cardType = 'main') => {
    if (!character) return null;

    const normalizedChar = normalizeCharacterData(character);
    const engagement = getEngagementData(character);
    const isSideCard = cardType === 'side';
    const displayName = normalizedChar?.display_name || 'Character';

    return (
      <div 
        className={`${styles.card} ${isSideCard ? styles.sideCard : styles.mainCard}`}
        onClick={() => handleCharacterClick(character)}
      >
        {/* Background Image */}
        {normalizedChar?.avatar_url && (
          <div
            className={styles.cardBackground}
            style={{ backgroundImage: `url(${normalizedChar.avatar_url})` }}
          >
            <div className={styles.cardGradient} />
          </div>
        )}

        <div className={styles.cardContent}>
          {/* Header */}
          <div className={styles.cardHeader}>
            <img
              src={normalizedChar?.avatar_url || '/default-avatar.jpg'}
              alt={displayName}
              className={styles.avatar}
              onError={(e) => {
                e.target.src = '/default-avatar.jpg';
              }}
            />
            
            <div className={styles.cardInfo}>
              <div className={styles.badges}>
                {normalizedChar?.feature_position === 1 && (
                  <span className={styles.featuredBadge}>✨ Featured</span>
                )}
                {normalizedChar?.feature_position && (
                  <span className={styles.positionBadge}>
                    #{normalizedChar.feature_position}
                  </span>
                )}
              </div>
              
              <h3 className={styles.cardTitle}>{displayName}</h3>
              
              {normalizedChar?.expertise_domain && (
                <div className={styles.domain}>{normalizedChar.expertise_domain}</div>
              )}
            </div>
          </div>

          {/* Description (full for main, truncated for sides) */}
          {normalizedChar?.short_description && (
            <p className={styles.description}>
              {normalizedChar.short_description}
            </p>
          )}

          {/* Engagement Metrics */}
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <MessageCircle size={14} />
              <span>{formatNumber(engagement.totalChats)}</span>
            </div>
            <div className={styles.metric}>
              <Users size={14} />
              <span>{formatNumber(engagement.totalViews)}</span>
            </div>
            {!isSideCard && (
              <>
                <div className={styles.metric}>
                  <Heart size={14} />
                  <span>{formatNumber(engagement.totalLikes)}</span>
                </div>
                <div className={styles.metric}>
                  <Bookmark size={14} />
                  <span>{formatNumber(engagement.totalBookmarks)}</span>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button 
              className={styles.primaryBtn}
              onClick={(e) => handleChatClick(e, character)}
            >
              Start Chat →
            </button>
            {!isSideCard && (
              <button 
                className={styles.secondaryBtn}
                onClick={() => handleCharacterClick(character)}
              >
                View Details
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.carousel}>
        <div className={styles.loadingContainer}>
          <div className={styles.threeCardGrid}>
            <div className={styles.loadingCard} />
            <div className={`${styles.loadingCard} ${styles.loadingMain}`} />
            <div className={styles.loadingCard} />
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!characters || characters.length === 0) {
    return (
      <div className={styles.carousel}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Star size={48} />
          </div>
          <h3>No Featured Characters This Week</h3>
          <p>Check back soon for amazing characters from our community!</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={styles.carousel}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={carouselRef}
    >
      {/* Navigation Arrows */}
      {totalPages > 1 && (
        <>
          <button 
            className={`${styles.navButton} ${styles.prevButton}`}
            onClick={goToPrevious}
            aria-label="Previous page"
          >
            <ChevronLeft size={24} />
          </button>

          <button 
            className={`${styles.navButton} ${styles.nextButton}`}
            onClick={goToNext}
            aria-label="Next page"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* 3-Card Grid Layout */}
      <div className={styles.threeCardGrid}>
        {/* Left Side Card (Position 2) */}
        {leftChar && renderCard(leftChar, 'side')}
        
        {/* Center Main Card (Position 1) */}
        {centerChar && renderCard(centerChar, 'main')}
        
        {/* Right Side Card (Position 3) */}
        {rightChar && renderCard(rightChar, 'side')}
      </div>

      {/* Progress Indicators */}
      {totalPages > 1 && (
        <div className={styles.indicators}>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              className={`${styles.indicator} ${
                index === currentPage ? styles.active : ''
              }`}
              onClick={() => goToPage(index)}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedCarousel;