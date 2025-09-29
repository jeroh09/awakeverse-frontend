// src/components/MarketHub/FeaturedCarousel.jsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Users, TrendingUp } from 'lucide-react';
import styles from './FeaturedCarousel.module.css';

const FeaturedCarousel = ({ 
  characters = [], 
  loading = false, 
  onCharacterClick, 
  onChatClick 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef(null);
  const autoPlayRef = useRef(null);

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

  // Handle click events
  const handleCharacterClick = (character) => {
    onCharacterClick?.(character);
  };

  const handleChatClick = (e, characterKey) => {
    e.stopPropagation();
    onChatClick?.(characterKey);
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
                src={characters[currentIndex].avatar_url}
                alt={characters[currentIndex].display_name}
                className={styles.avatar}
                onError={(e) => {
                  e.target.src = '/images/default-character.jpg';
                }}
              />
              
              <div className={styles.details}>
                <div className={styles.header}>
                  <h3 className={styles.name}>
                    {characters[currentIndex].display_name}
                  </h3>
                  
                  {characters[currentIndex].feature_position && (
                    <div className={styles.positionBadge}>
                      #{characters[currentIndex].feature_position}
                    </div>
                  )}
                </div>

                <p className={styles.description}>
                  {characters[currentIndex].short_description}
                </p>

                {characters[currentIndex].expertise_domain && (
                  <div className={styles.domain}>
                    {characters[currentIndex].expertise_domain}
                  </div>
                )}

                <div className={styles.creator}>
                  Created by {characters[currentIndex].creator?.display_name || 'Creator'}
                  {characters[currentIndex].creator?.creator_level && (
                    <span className={styles.creatorLevel}>
                      • {characters[currentIndex].creator.creator_level}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.engagement}>
              <div className={styles.metric}>
                <Users size={16} />
                <span>{characters[currentIndex].engagement_30d?.total_chats || 0} chats</span>
              </div>
              
              <div className={styles.metric}>
                <Star size={16} />
                <span>{characters[currentIndex].engagement_30d?.total_likes || 0} likes</span>
              </div>

              <div className={styles.metric}>
                <TrendingUp size={16} />
                <span>{characters[currentIndex].total_engagement || 0} total</span>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button 
              className={styles.chatButton}
              onClick={(e) => handleChatClick(e, characters[currentIndex].character_key)}
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
              key={character.character_key}
              className={`${styles.thumbnail} ${
                index === currentIndex ? styles.active : ''
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`View ${character.display_name}`}
            >
              <img
                src={character.avatar_url}
                alt={character.display_name}
                onError={(e) => {
                  e.target.src = '/images/default-character.jpg';
                }}
              />
              <div className={styles.thumbnailInfo}>
                <span className={styles.thumbnailName}>
                  {character.display_name}
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