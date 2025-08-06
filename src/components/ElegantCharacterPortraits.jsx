// src/components/ElegantCharacterPortraits.jsx
import React, { useState, useEffect, useCallback } from 'react';
import './ElegantCharacterPortraits.css';

// Featured characters for auth pages - curated selection
const FEATURED_CHARACTERS = [
  {
    id: 'sherlock',
    name: 'Sherlock Holmes',
    title: 'Master of Deduction',
    image: '/images/sherlock.jpg'
  },
  {
    id: 'cleopatra',
    name: 'Cleopatra',
    title: 'Last Pharaoh of Egypt',
    image: '/images/cleopatra.jpg'
  },
  {
    id: 'socrates',
    name: 'Socrates',
    title: 'Father of Philosophy',
    image: '/images/socrates.jpg'
  },
  {
    id: 'da_vinci',
    name: 'Leonardo da Vinci',
    title: 'Renaissance Polymath',
    image: '/images/da_vinci.jpg'
  },
  {
    id: 'shakespeare',
    name: 'William Shakespeare',
    title: 'The Bard of Avon',
    image: '/images/shakespeare.jpg'
  },
  {
    id: 'nostradamus',
    name: 'Nostradamus',
    title: 'Prophet of Ages',
    image: '/images/nostradamus.jpg'
  }
];

const ElegantCharacterPortraits = ({ 
  autoAdvanceInterval = 12000, 
  className = '',
  onCharacterChange 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Auto-advance to next character
  const advanceToNext = useCallback(() => {
    if (isTransitioning || isPaused) return;
    const nextIndex = (currentIndex + 1) % FEATURED_CHARACTERS.length;
    showCharacter(nextIndex);
  }, [currentIndex, isTransitioning, isPaused]);

  // Show specific character with smooth transition
  const showCharacter = useCallback((index) => {
    if (isTransitioning || index === currentIndex) return;
    
    setIsTransitioning(true);
    setImageLoaded(false);
    
    // Brief delay for smooth transition
    setTimeout(() => {
      setCurrentIndex(index);
      
      // Notify parent of character change
      if (onCharacterChange) {
        onCharacterChange(FEATURED_CHARACTERS[index]);
      }
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 300);
  }, [currentIndex, isTransitioning, onCharacterChange]);

  // Auto-advance effect
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(advanceToNext, autoAdvanceInterval);
    return () => clearInterval(interval);
  }, [advanceToNext, autoAdvanceInterval, isPaused]);

  // Preload next image for smooth transitions
  useEffect(() => {
    const nextIndex = (currentIndex + 1) % FEATURED_CHARACTERS.length;
    const nextImage = new Image();
    nextImage.src = FEATURED_CHARACTERS[nextIndex].image;
  }, [currentIndex]);

  const currentCharacter = FEATURED_CHARACTERS[currentIndex];

  return (
    <div 
      className={`elegant-portrait-container ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="character-showcase">
        <div className={`portrait-frame ${imageLoaded ? 'active' : ''}`}>
          <img
            src={currentCharacter.image}
            alt={currentCharacter.name}
            className={`character-portrait ${imageLoaded ? 'active' : ''}`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              // Graceful fallback for missing images
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
          <div className="portrait-fallback">
            <div className="fallback-text">{currentCharacter.name}</div>
          </div>
        </div>
        
        <div className={`character-name ${imageLoaded ? 'active' : ''}`}>
          {currentCharacter.name}
        </div>
        
        <div className={`character-title ${imageLoaded ? 'active' : ''}`}>
          {currentCharacter.title}
        </div>
      </div>
      
      <div className="portrait-indicators">
        {FEATURED_CHARACTERS.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => showCharacter(index)}
            aria-label={`Show ${FEATURED_CHARACTERS[index].name}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ElegantCharacterPortraits;