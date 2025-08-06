// src/landing/components/EnhancedCharacterPanels.js - FIXED Avatar Reloading
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { characterCategories } from '../../data/characterCategories';
import './EnhancedCharacterPanels.css';

const EnhancedCharacterPanels = () => {
  const [flippedPanels, setFlippedPanels] = useState({});
  const [flipTimeouts, setFlipTimeouts] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [imageErrors, setImageErrors] = useState({}); // Track failed images

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getCategoryByKey = (key) => {
    return characterCategories.find(cat => cat.key === key);
  };

  // Memoize main characters to prevent re-creation on every render
  const mainCharacters = useMemo(() => [
    {
      character: getCategoryByKey('sleuths').characters[0],
      category: getCategoryByKey('sleuths'),
      tagline: 'Solve mysteries',
      description: 'Master of deduction and logical reasoning. Uncover hidden truths through observation and analytical thinking.'
    },
    {
      character: getCategoryByKey('makers').characters[0],
      category: getCategoryByKey('makers'),
      tagline: 'Innovate',
      description: 'Renaissance genius of art, science, and invention. Explore creativity and push the boundaries of possibility.'
    },
    {
      character: getCategoryByKey('heartstrings').characters[0],
      category: getCategoryByKey('heartstrings'),
      tagline: 'Explore love',
      description: 'Legendary beauty whose love launched a thousand ships. Discover the power and complexity of human desire.'
    },
    {
      character: getCategoryByKey('veilwalkers').characters[0],
      category: getCategoryByKey('veilwalkers'),
      tagline: 'Unlock mysteries',
      description: 'Ancient water spirit of wisdom and healing. Dive deep into spiritual knowledge and hidden truths.'
    }
  ], []);

  const handlePanelClick = useCallback((panelIndex) => {
    // Prevent multiple rapid clicks
    if (flipTimeouts[panelIndex]) {
      clearTimeout(flipTimeouts[panelIndex]);
    }

    setFlippedPanels(prev => {
      const newState = { ...prev };
      
      if (isMobile) {
        // Mobile: Only one panel flipped at a time
        if (newState[panelIndex]) {
          delete newState[panelIndex];
        } else {
          // Close all other panels first
          Object.keys(newState).forEach(key => {
            if (key !== panelIndex.toString()) {
              delete newState[key];
            }
          });
          newState[panelIndex] = true;
          
          const timeoutId = setTimeout(() => {
            setFlippedPanels(current => {
              const updated = { ...current };
              delete updated[panelIndex];
              return updated;
            });
          }, 5000);
          
          setFlipTimeouts(current => ({ ...current, [panelIndex]: timeoutId }));
        }
      } else {
        // Desktop: Single panel flip
        newState[panelIndex] = true;
        const timeoutId = setTimeout(() => {
          setFlippedPanels(current => ({ ...current, [panelIndex]: false }));
        }, 5000);
        setFlipTimeouts(current => ({ ...current, [panelIndex]: timeoutId }));
      }
      
      return newState;
    });
  }, [flipTimeouts, isMobile]);

  useEffect(() => {
    return () => {
      Object.values(flipTimeouts).forEach(clearTimeout);
    };
  }, [flipTimeouts]);

  // FIXED: Handle image errors without causing re-renders
  const handleImageError = useCallback((characterKey, size) => {
    const errorKey = `${characterKey}-${size}`;
    setImageErrors(prev => ({ ...prev, [errorKey]: true }));
  }, []);

  // FIXED: Stable CharacterImage component that doesn't cause reloads
  const CharacterImage = React.memo(({ character, size = "large" }) => {
    const errorKey = `${character.key}-${size}`;
    const hasError = imageErrors[errorKey];

    const handleError = useCallback(() => {
      handleImageError(character.key, size);
    }, [character.key, size]);

    if (hasError) {
      return (
        <div className={`character-image ${size}`}>
          <div className="image-fallback">
            {character.name.charAt(0)}
          </div>
        </div>
      );
    }

    return (
      <div className={`character-image ${size}`}>
        <img 
          src={character.thumbnailUrl} 
          alt={character.name}
          onError={handleError}
          // CRITICAL: Prevent re-loading by adding stable props
          loading="lazy"
          draggable={false}
          key={`${character.key}-${size}`} // Stable key
          style={{ imageRendering: 'crisp-edges' }} // Prevent browser reprocessing
        />
      </div>
    );
  });

  return (
    <div className="enhanced-characters-showcase">
      {mainCharacters.map((item, index) => (
        <div key={`panel-${item.character.key}`} className="character-panel-container">
          <div 
            className={`character-panel-flipper ${flippedPanels[index] ? 'flipped' : ''}`}
            onClick={() => handlePanelClick(index)}
            role="button"
            tabIndex={0}
            aria-label={`${item.character.name} panel - ${flippedPanels[index] ? 'Showing category' : 'Showing character'}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePanelClick(index);
              }
            }}
          >
            {/* Front Side */}
            <div className="character-panel front">
              <div className="category-label">
                {item.category.title}
              </div>
              
              <CharacterImage character={item.character} />
              
              <h3 className="character-name">{item.character.name}</h3>
              <p className="character-description">{item.description}</p>
              
              <Link 
                to="/register" 
                className="chat-link"
                onClick={(e) => e.stopPropagation()}
              >
                Chat with {item.character.name.split(' ')[0]}
              </Link>
              
              <div className="flip-hint">
                Click to see more {item.category.title.toLowerCase()}
              </div>
            </div>

            {/* Back Side */}
            <div className="character-panel back">
              <div className="category-label">
                {item.category.title}
              </div>
              
              <div className="category-characters-grid">
                {item.category.characters.slice(0, 6).map((char, charIndex) => (
                  <div key={`mini-${char.key}`} className="mini-character">
                    <CharacterImage character={char} size="small" />
                    <span className="mini-character-name">
                      {char.name.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
              
              <Link 
                to="/register" 
                className="chat-link category-link"
                onClick={(e) => e.stopPropagation()}
              >
                Explore {item.category.title}
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(EnhancedCharacterPanels);