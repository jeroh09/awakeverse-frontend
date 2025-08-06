// src/components/FloatingCharacterHub/FloatingCharacterHub.js
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { characterCategories } from '../../data/characterCategories';
import useInteractedCharacters from '../../hooks/useInteractedCharacters';
import './FloatingCharacterHub.css';

const FloatingCharacterHub = ({ 
  current, 
  onSelect, 
  enabled = true 
}) => {
  const { interactedCharacters, loading } = useInteractedCharacters();
  const [isExpanded, setIsExpanded] = useState(false);
  const hubRef = useRef(null);

  // Get category icons - MOVED BEFORE useMemo
  const getCategoryIcon = (categoryName) => {
    const icons = {
      'Detectives': '🔍',
      'Astrologers': '⭐',
      'Truthseekers': '🎯',
      'Mystics': '🔮',
      'Entrepreneurs': '💰',
      'Cupids': '💕',
      'Philosophers': '🤔',
      'Inventors': '🔬',
      'Strategos': '⚔️'
    };
    return icons[categoryName] || '💭';
  };

  // Get categorized characters (same logic as ChatSidebar) - ALWAYS call hooks
  const categorizedCharacters = useMemo(() => {
    if (!enabled || loading || interactedCharacters.length === 0) {
      return {};
    }
    const result = {};
    let totalFound = 0;

    characterCategories.forEach(category => {
      const charsInCategory = category.characters.filter(char => {
        if (!char.key) return false;
        const charKeyNormalized = char.key.toLowerCase().trim();
        return interactedCharacters.some(interactedKey => {
          const interactedKeyNormalized = String(interactedKey).toLowerCase().trim();
          return interactedKeyNormalized === charKeyNormalized;
        });
      });

      if (charsInCategory.length > 0) {
        const categoryName = category.name || category.title;
        result[categoryName] = charsInCategory;
        totalFound += charsInCategory.length;
      }
    });

    return result;
  }, [interactedCharacters]);

  // Get recent characters for collapsed view (max 4) - ALWAYS call hooks
  const recentCharacters = useMemo(() => {
    if (!enabled || loading || interactedCharacters.length === 0) {
      return [];
    }
    const allChars = Object.values(categorizedCharacters).flat();
    return allChars.slice(0, 4);
  }, [categorizedCharacters, enabled, loading, interactedCharacters.length]);

  // Get category stats for prestige display - ALWAYS call hooks
  const categoryStats = useMemo(() => {
    if (!enabled || loading || interactedCharacters.length === 0) {
      return {};
    }
    const stats = {};
    Object.entries(categorizedCharacters).forEach(([categoryName, chars]) => {
      const category = characterCategories.find(cat => 
        (cat.name || cat.title) === categoryName
      );
      if (category) {
        stats[categoryName] = {
          count: chars.length,
          total: category.characters.length,
          completion: chars.length / category.characters.length,
          icon: getCategoryIcon(categoryName)
        };
      }
    });
    return stats;
  }, [categorizedCharacters, enabled, loading, interactedCharacters.length, getCategoryIcon]);

  // Handle character selection
  const handleCharacterSelect = (characterKey) => {
    onSelect(characterKey);
    setIsExpanded(false);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (hubRef.current && !hubRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  const totalCharacters = Object.values(categorizedCharacters).flat().length;
  const totalCategories = Object.keys(categorizedCharacters).length;

  // Early return AFTER all hooks have been called
  if (!enabled || loading || interactedCharacters.length === 0) {
    return null;
  }

  return (
    <div 
      ref={hubRef}
      className={`floating-character-hub ${isExpanded ? 'expanded' : 'collapsed'}`}
    >
      {/* Collapsed State: Just dots */}
      {!isExpanded && (
        <div className="hub-collapsed">
          {recentCharacters.map((char, index) => (
            <div
              key={char.key}
              className={`character-dot ${current === char.key ? 'active' : ''}`}
              onClick={() => handleCharacterSelect(char.key)}
              title={char.name}
              style={{ '--delay': `${index * 0.1}s` }}
            >
              <img 
                src={char.thumbnailUrl} 
                alt={char.name}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          ))}
          
          {totalCharacters > 4 && (
            <div 
              className="more-dot"
              onClick={() => setIsExpanded(true)}
              title={`+${totalCharacters - 4} more characters`}
            >
              +{totalCharacters - 4}
            </div>
          )}
        </div>
      )}

      {/* Expanded State: Prestige display */}
      {isExpanded && (
        <div className="hub-expanded">
          <div className="prestige-header">
            <h3>Your Intellectual Profile</h3>
            <button 
              className="close-btn"
              onClick={() => setIsExpanded(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="prestige-stats">
            <div className="stat">
              <span className="stat-number">{totalCharacters}</span>
              <span className="stat-label">Characters</span>
            </div>
            <div className="stat">
              <span className="stat-number">{totalCategories}</span>
              <span className="stat-label">Domains</span>
            </div>
          </div>

          <div className="categories-list">
            {Object.entries(categorizedCharacters).map(([categoryName, chars]) => {
              const stats = categoryStats[categoryName];
              return (
                <div key={categoryName} className="category-section">
                  <div className="category-header">
                    <span className="category-icon">{stats?.icon}</span>
                    <span className="category-name">{categoryName}</span>
                    <span className="category-count">({chars.length}/{stats?.total})</span>
                  </div>
                  
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${(stats?.completion || 0) * 100}%` }}
                    />
                  </div>

                  <div className="characters-grid">
                    {chars.map(char => (
                      <div
                        key={char.key}
                        className={`character-bubble ${current === char.key ? 'active' : ''}`}
                        onClick={() => handleCharacterSelect(char.key)}
                        title={char.name}
                      >
                        <img 
                          src={char.thumbnailUrl} 
                          alt={char.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <span className="character-name">{char.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingCharacterHub;