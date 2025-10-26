// src/components/MarketHub/FeaturedCarousel.jsx - FIXED VERSION
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Users, TrendingUp, MessageCircle, Heart, Bookmark } from 'lucide-react';
import { useEngagementTracking } from '../../hooks/useEngagementTracking';
import styles from './FeaturedCarousel.module.css';

const FeaturedCarousel = ({ 
  characters = [], 
  loading = false, 
  onCharacterClick, 
  onChatClick 
}) => {
  // 🆕 ADD DEBUG HERE - Right at the top of the component
  console.log('🔍 FeaturedCarousel RAW DATA:', {
    charactersCount: characters.length,
    characters: characters,
    firstCharacter: characters[0],
    loading: loading
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef(null);
  const autoPlayRef = useRef(null);
  
  const { trackView, trackShare } = useEngagementTracking();

  // Track view when featured character changes
  useEffect(() => {
    if (characters.length > 0 && characters[currentIndex]) {
      const currentCharacter = characters[currentIndex];
      if (currentCharacter.character_id) {
        trackView(currentCharacter.character_id, {
          view_context: 'featured_carousel',
          expertise_domain: currentCharacter.expertise_domain,
          feature_position: currentCharacter.feature_position
        });
      }
    }
  }, [currentIndex, characters, trackView]);

  // 🆕 FIXED: Map backend field names to frontend expected names
  const normalizeCharacterData = (character) => {
    if (!character) return null;
    
    // 🆕 ADD DEBUG HERE - Inside normalization function
    console.log('🔍 NORMALIZE DEBUG - RAW CHARACTER:', {
      rawCharacter: character,
      creatorObject: character.creator,
      display_name: character.creator?.display_name,
      hasCreatorName: !!character.creator_name
    });
    
    const normalizedCharacter = {
      // ✅ FIXED: Map correct field names from database query results
      character_key: character.character_key,
      character_id: character.character_id,
      display_name: character.character_name || character.display_name,
      short_description: character.character_description || character.short_description,
      expertise_domain: character.expertise_domain,
      avatar_url: character.avatar_url,
      feature_position: character.feature_position,
      total_engagement: character.total_engagement,
      
      // ✅ FIXED: Creator info - Look in creator object first
      creator: {
        display_name: character.creator?.display_name || 'Creator', // 🆕 FIXED THIS LINE
        username: character.creator?.username,
        creator_level: character.creator?.creator_level || 'newcomer'
      },
      
      // Engagement data (create mock if missing)
      engagement_30d: character.engagement_30d || {
        total_views: 0,
        total_likes: 0,
        total_shares: 0,
        total_chats: 0,
        total_bookmarks: 0
      }
    };

    // 🆕 ADD DEBUG HERE - After normalization
    console.log('🔍 NORMALIZE DEBUG - NORMALIZED CHARACTER:', normalizedCharacter);
    
    return normalizedCharacter;
  };

  // 🆕 FIXED: Get normalized character for display
  const getCurrentCharacter = () => {
    const normalized = normalizeCharacterData(characters[currentIndex]);
    console.log('🔍 CURRENT CHARACTER DEBUG:', {
      currentIndex,
      raw: characters[currentIndex],
      normalized: normalized,
      creatorDisplayName: normalized?.creator?.display_name
    });
    return normalized;
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || characters.length <= 1) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % characters.length);
    }, 5000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, characters.length]);

  // Pause auto-play on hover
  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  // Navigation functions
  const goToPrevious = () => {
    setCurrentIndex(prev => 
      prev === 0 ? characters.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % characters.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // 🆕 FIXED: Handle engagement data structure
  const getEngagementData = (character) => {
    const normalizedChar = normalizeCharacterData(character);
    const engagement = normalizedChar?.engagement_30d || {};
    
    return {
      totalLikes: engagement.total_likes || 0,
      totalBookmarks: engagement.total_bookmarks || 0,
      totalEngagement: engagement.total_views || normalizedChar?.total_engagement || 0,
      totalChats: engagement.total_chats || 0
    };
  };

  // 🆕 FIXED: Get proper display name
  const getDisplayName = (character) => {
    const normalizedChar = normalizeCharacterData(character);
    return normalizedChar?.display_name || 'Character';
  };

  // 🆕 FIXED: Enhanced character click handler
  const handleCharacterClick = (character) => {
    const normalizedChar = normalizeCharacterData(character);
    console.log('🔍 Featured Carousel - Character clicked:', normalizedChar);
    onCharacterClick?.(normalizedChar);
  };

  // 🆕 FIXED: Simplified chat click handler
  const handleChatClick = (e, character) => {
    e.stopPropagation();
    
    const normalizedChar = normalizeCharacterData(character);
    const displayName = getDisplayName(character);
    
    console.log('🔍 Featured Carousel - Starting chat with:', {
      displayName,
      character_key: normalizedChar?.character_key,
      character_id: normalizedChar?.character_id
    });

    // Call the onChatClick prop directly
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

  if (loading) {
    return (
      <div className={styles.carousel}>
        <div className={styles.loadingContainer}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.loadingCard} />
          ))}
        </div>
      </div>
    );
  }

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

  const currentCharacter = getCurrentCharacter();
  const engagement = getEngagementData(characters[currentIndex]);
  const displayName = getDisplayName(characters[currentIndex]);

  return (
    <div 
      className={styles.carousel}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={carouselRef}
    >
      {/* Main Featured Character Display */}
      <div className={styles.mainDisplay}>
        {characters.length > 1 && (
          <button 
            className={styles.navButton + ' ' + styles.prevButton}
            onClick={goToPrevious}
            aria-label="Previous character"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <div className={styles.featuredCard}>
          <div 
            className={styles.cardContent}
            onClick={() => handleCharacterClick(characters[currentIndex])}
          >
            <div className={styles.characterInfo}>
              <img
                src={currentCharacter?.avatar_url || '/default-avatar.jpg'}
                alt={displayName}
                className={styles.avatar}
                onError={(e) => {
                  e.target.src = '/images/default-character.jpg';
                }}
              />
              
              <div className={styles.details}>
                <div className={styles.header}>
                  <h3 className={styles.name}>
                    {displayName}
                  </h3>
                  
                  {currentCharacter?.feature_position && (
                    <div className={styles.positionBadge}>
                      #{currentCharacter.feature_position}
                    </div>
                  )}
                </div>

                <p className={styles.description}>
                  {currentCharacter?.short_description || 'No description available.'}
                </p>

                {currentCharacter?.expertise_domain && (
                  <div className={styles.domain}>
                    {currentCharacter.expertise_domain}
                  </div>
                )}

                <div className={styles.creator}>
                  Created by {currentCharacter?.creator?.display_name || 'Creator'}
                  {currentCharacter?.creator?.creator_level && (
                    <span className={styles.creatorLevel}>
                      • {currentCharacter.creator.creator_level.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 🆕 UPDATED: Engagement metrics with proper data */}
            <div className={styles.engagement}>
              <div className={styles.metric}>
                <MessageCircle size={16} />
                <span>{formatNumber(engagement.totalChats)} chats</span>
              </div>
              
              <div className={styles.metric}>
                <Users size={16} />
                <span>{formatNumber(engagement.totalEngagement)} views</span>
              </div>

              <div className={styles.metric}>
                <Heart size={16} />
                <span>{formatNumber(engagement.totalLikes)} likes</span>
              </div>

              <div className={styles.metric}>
                <Bookmark size={16} />
                <span>{formatNumber(engagement.totalBookmarks)} bookmarks</span>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button 
              className={styles.chatButton}
              onClick={(e) => handleChatClick(e, characters[currentIndex])}
            >
              Start Chat
            </button>
            
            <button 
              className={styles.detailsButton}
              onClick={() => handleCharacterClick(characters[currentIndex])}
            >
              View Details
            </button>
          </div>
        </div>

        {characters.length > 1 && (
          <button 
            className={styles.navButton + ' ' + styles.nextButton}
            onClick={goToNext}
            aria-label="Next character"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {characters.length > 1 && (
        <div className={styles.thumbnailNav}>
          {characters.map((character, index) => (
            <button
              key={character.character_id || index}
              className={`${styles.thumbnail} ${
                index === currentIndex ? styles.active : ''
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`View ${getDisplayName(character)}`}
            >
              <img
                src={character.avatar_url || '/default-avatar.jpg'}
                alt={getDisplayName(character)}
                onError={(e) => {
                  e.target.src = '/images/default-character.jpg';
                }}
              />
              <div className={styles.thumbnailInfo}>
                <span className={styles.thumbnailName}>
                  {getDisplayName(character)}
                </span>
                {character.feature_position && (
                  <span className={styles.thumbnailPosition}>
                    #{character.feature_position}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Progress Indicators */}
      {characters.length > 1 && (
        <div className={styles.indicators}>
          {characters.map((_, index) => (
            <button
              key={index}
              className={`${styles.indicator} ${
                index === currentIndex ? styles.active : ''
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedCarousel;