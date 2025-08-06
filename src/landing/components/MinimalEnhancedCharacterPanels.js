// src/landing/components/MinimalEnhancedCharacterPanels.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { characterCategories } from '../../data/characterCategories';
import './MinimalEnhancedCharacterPanels.css';

const MinimalEnhancedCharacterPanels = () => {
  const [flippedPanels, setFlippedPanels] = useState({});
  const [flipTimeouts, setFlipTimeouts] = useState({});

  // Get category by key
  const getCategoryByKey = (key) => {
    return characterCategories.find(cat => cat.key === key);
  };

  // Main characters for display (keeping your exact original setup)
  const mainCharacters = [
    {
      character: getCategoryByKey('sleuths').characters[0], // Sherlock
      category: getCategoryByKey('sleuths'),
      tagline: 'Solve mysteries',
      description: 'Master of deduction and logical reasoning. Uncover hidden truths through observation and analytical thinking.'
    },
    {
      character: getCategoryByKey('makers').characters[0], // Da Vinci
      category: getCategoryByKey('makers'),
      tagline: 'Innovate',
      description: 'Renaissance genius of art, science, and invention. Explore creativity and push the boundaries of possibility.'
    },
    {
      character: getCategoryByKey('heartstrings').characters[0], // Helen
      category: getCategoryByKey('heartstrings'),
      tagline: 'Explore love',
      description: 'Legendary beauty whose love launched a thousand ships. Discover the power and complexity of human desire.'
    },
    {
      character: getCategoryByKey('veilwalkers').characters[0], // Mami Wata
      category: getCategoryByKey('veilwalkers'),
      tagline: 'Unlock mysteries',
      description: 'Ancient water spirit of wisdom and healing. Dive deep into spiritual knowledge and hidden truths.'
    }
  ];

  // Handle panel flip
  const handlePanelClick = (panelIndex) => {
    // Clear any existing timeout for this panel
    if (flipTimeouts[panelIndex]) {
      clearTimeout(flipTimeouts[panelIndex]);
    }

    // Flip only this panel (close others)
    const newFlippedState = { [panelIndex]: true };
    setFlippedPanels(newFlippedState);

    // Set timeout to flip back after 5 seconds
    const timeoutId = setTimeout(() => {
      setFlippedPanels(prev => ({ ...prev, [panelIndex]: false }));
    }, 5000);

    setFlipTimeouts(prev => ({ ...prev, [panelIndex]: timeoutId }));
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(flipTimeouts).forEach(clearTimeout);
    };
  }, [flipTimeouts]);

  return (
    <div className="characters-showcase">
      {mainCharacters.map((item, index) => (
        <div key={index} className="character-panel-wrapper">
          <div 
            className={`character-panel-flipper ${flippedPanels[index] ? 'flipped' : ''}`}
            onClick={() => handlePanelClick(index)}
          >
            {/* Front Side - EXACT COPY of your original panel */}
            <div className="character-panel front">
              {/* Category Label - small and subtle */}
              <div className="category-label">
                {item.category.title}
              </div>
              
              <div className="character-image">
                <img 
                  src={item.character.thumbnailUrl} 
                  alt={item.character.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="image-fallback" style={{ display: 'none' }}>
                  {item.character.name.charAt(0)}
                </div>
              </div>
              
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

            {/* Back Side - 6 characters in 2x3 grid */}
            <div className="character-panel back">
              <div className="category-label">
                {item.category.title}
              </div>
              
              <div className="category-characters-grid">
                {item.category.characters.slice(0, 6).map((char, charIndex) => (
                  <div key={charIndex} className="mini-character">
                    <div className="mini-character-image">
                      <img
                        src={char.thumbnailUrl}
                        alt={char.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="mini-image-fallback" style={{ display: 'none' }}>
                        {char.name.charAt(0)}
                      </div>
                    </div>
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
              
              <div className="flip-hint">
                Flips back automatically in 5s
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MinimalEnhancedCharacterPanels;