import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import { characterCategories } from '../data/characterCategories';

// Enhanced semantic mappings for your complete character set
const ENHANCED_SEMANTIC_MAPPINGS = {
  'truth': ['truthweavers', 'thinkers'],
  'meaning': ['thinkers', 'veilwalkers'],
  'power': ['warlords', 'goldhands'],
  'war': ['warlords'],
  'strategy': ['warlords', 'goldhands'],
  'battle': ['warlords'],
  'leadership': ['warlords', 'goldhands'],
  'create': ['makers', 'heartstrings'],
  'invent': ['makers'],
  'art': ['makers', 'heartstrings'],
  'innovation': ['makers'],
  'technology': ['makers'],
  'money': ['goldhands'],
  'business': ['goldhands'],
  'success': ['goldhands', 'warlords'],
  'wealth': ['goldhands'],
  'entrepreneur': ['goldhands'],
  'spiritual': ['veilwalkers', 'stargazers'],
  'magic': ['veilwalkers'],
  'destiny': ['stargazers', 'veilwalkers'],
  'future': ['stargazers', 'veilwalkers'],
  'stars': ['stargazers'],
  'astrology': ['stargazers'],
  'detective': ['sleuths'],
  'mystery': ['sleuths'],
  'investigation': ['sleuths'],
  'love': ['heartstrings'],
  'romance': ['heartstrings'],
  'passion': ['heartstrings'],
  'philosophy': ['thinkers'],
  'wisdom': ['thinkers', 'veilwalkers'],
  'science': ['makers', 'thinkers'],
  'invention': ['makers'],
  'engineering': ['makers'],
  'enlightenment': ['thinkers', 'truthweavers'],
  'revolution': ['truthweavers', 'warlords'],
  'mysticism': ['veilwalkers'],
  'prophecy': ['stargazers', 'veilwalkers'],
  'trade': ['goldhands'],
  'empire': ['warlords', 'goldhands'],
  'poetry': ['heartstrings', 'truthweavers'],
  'literature': ['heartstrings', 'truthweavers'],
  'justice': ['truthweavers', 'sleuths'],
  'deduction': ['sleuths'],
  'logic': ['thinkers', 'sleuths'],
  'mathematics': ['makers', 'thinkers'],
  'alchemy': ['veilwalkers', 'makers'],
  'medicine': ['veilwalkers', 'makers'],
  'astronomy': ['stargazers', 'makers'],
  'exploration': ['truthweavers', 'makers'],
  'adventure': ['truthweavers', 'warlords'],
  'rebellion': ['truthweavers', 'warlords'],
  'freedom': ['truthweavers', 'warlords'],
  'honor': ['warlords', 'truthweavers'],
  'courage': ['warlords', 'truthweavers'],
  'beauty': ['heartstrings'],
  'seduction': ['heartstrings'],
  'desire': ['heartstrings'],
  'mythology': ['veilwalkers', 'stargazers'],
  'legend': ['veilwalkers', 'warlords'],
  'folklore': ['veilwalkers', 'truthweavers'],
  'economics': ['goldhands'],
  'finance': ['goldhands'],
  'industry': ['goldhands', 'makers'],
  'innovation': ['makers'],
  'discovery': ['makers', 'truthweavers'],
  'genius': ['makers', 'thinkers'],
  'military': ['warlords'],
  'tactics': ['warlords'],
  'conquest': ['warlords'],
  'diplomacy': ['warlords', 'goldhands'],
  'espionage': ['sleuths', 'warlords'],
  'spy': ['sleuths'],
  'crime': ['sleuths'],
  'mystery': ['sleuths', 'veilwalkers'],
  'puzzle': ['sleuths', 'thinkers'],
  'riddle': ['sleuths', 'veilwalkers'],
  'secret': ['sleuths', 'veilwalkers'],
  'hidden': ['sleuths', 'veilwalkers'],
  'ancient': ['veilwalkers', 'stargazers', 'thinkers'],
  'classical': ['thinkers', 'heartstrings'],
  'renaissance': ['makers', 'heartstrings'],
  'medieval': ['veilwalkers', 'warlords'],
  'modern': ['makers', 'goldhands'],
  'contemporary': ['makers', 'goldhands']
};

const ORACLE_PROMPTS = [
  "Who do you want to talk to?",
  "Seek wisdom from...",
  "Who would you counsel with?",
  "what subject do you which to discuss?",
  "Find your mentor...",
];

// Category representatives - most famous face for each category
const categoryRepresentatives = {
  'sleuths': '/images/sherlock.jpg',
  'stargazers': '/images/nostradamus.jpg',
  'truthweavers': '/images/dante.jpg',
  'veilwalkers': '/images/rasputin.jpg',
  'goldhands': '/images/mansa_musa.jpg',
  'heartstrings': '/images/shakespeare.jpg',
  'thinkers': '/images/socrates.jpg',
  'makers': '/images/da_vinci.jpg',
  'warlords': '/images/sun_tzu.jpg'
};

const SplitScreenLauncher = ({ onStartChat }) => {
  const { user } = useUser();
  const [inputValue, setInputValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedChar, setSelectedChar] = useState(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Rotate placeholder text
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % ORACLE_PROMPTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Search function (simplified without semantic mappings)
  const performSemanticSearch = useMemo(() => {
    return (query) => {
      if (!query.trim()) return [];

      const searchTerm = query.toLowerCase().trim();
      const results = [];

      // Direct character name/description search
      characterCategories.forEach(category => {
        category.characters.forEach(character => {
          const nameMatch = character.name.toLowerCase().includes(searchTerm);
          const descMatch = character.description.toLowerCase().includes(searchTerm);
          
          const nameParts = character.name.toLowerCase().split(' ');
          const partialNameMatch = nameParts.some(part => 
            part.includes(searchTerm) || searchTerm.includes(part)
          );
          
          if (nameMatch || descMatch || partialNameMatch) {
            results.push({
              ...character,
              category: category.title,
              categoryKey: category.key,
              relevance: nameMatch ? 100 : (partialNameMatch ? 90 : 80)
            });
          }
        });
      });

      return results
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 8);
    };
  }, []);

  // Handle search input
  const handleInputChange = (text) => {
    setInputValue(text);
    
    if (text.length >= 2) {
      const results = performSemanticSearch(text);
      setSearchResults(results);
      setShowResults(true);
    } else {
      setShowResults(false);
      setSearchResults([]);
    }
  };

  const handleCharacterSelect = (character) => {
    setSelectedChar({
      key: character.key,
      name: character.name,
      thumbnailUrl: character.thumbnailUrl,
      description: character.description,
      category: character.category
    });
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowResults(false);
    setInputValue('');
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  const currentPlaceholder = ORACLE_PROMPTS[placeholderIndex];

  // Mobile layout
  if (isMobile) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        padding: '1rem',
        fontFamily: "'Cinzel', serif",
        background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 25%, #2C1810 50%, #0F1A2E 75%, #0B1426 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Welcome Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          width: '100%',
          maxWidth: '500px',
        }}>
          <h1 style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: '1.8rem',
            background: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            margin: '0 0 1rem 0',
            textShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
            letterSpacing: '1px',
            fontWeight: 700
          }}>
            Welcome, {user?.displayName || 'Seeker'}
          </h1>
          
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255, 215, 0, 0.8)',
            fontStyle: 'italic',
            letterSpacing: '0.5px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
            margin: 0,
            transition: 'opacity 0.5s ease',
            opacity: showResults ? 0.5 : 1
          }}>
            {currentPlaceholder}
          </p>
        </div>

        {/* Search Section */}
        <div style={{
          width: '100%',
          maxWidth: '500px',
          position: 'relative',
          marginBottom: '1rem'
        }}>
          <input
            type="text"
            placeholder="Search characters..."
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => inputValue.length >= 2 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '25px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#FFD700',
              outline: 'none',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              fontFamily: "'Cinzel', serif"
            }}
          />

          {/* Search Results */}
          {showResults && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              maxHeight: '300px',
              overflowY: 'auto',
              background: 'rgba(11, 20, 38, 0.95)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '15px',
              backdropFilter: 'blur(20px)',
              padding: '1rem',
              marginTop: '0.5rem',
              zIndex: 1000
            }}>
              {searchResults.map((character, index) => (
                <div
                  key={character.key}
                  onClick={() => handleCharacterSelect(character)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    marginBottom: index < searchResults.length - 1 ? '0.5rem' : 0
                  }}
                >
                  <img
                    src={character.thumbnailUrl}
                    alt={character.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid rgba(255, 215, 0, 0.3)'
                    }}
                    onError={(e) => {
                      e.target.src = '/images/default-character.jpg';
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#FFD700',
                      marginBottom: '0.25rem'
                    }}>
                      {character.name}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 215, 0, 0.7)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {character.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showResults && searchResults.length === 0 && inputValue.length >= 2 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'rgba(11, 20, 38, 0.95)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '15px',
              backdropFilter: 'blur(20px)',
              padding: '1rem',
              marginTop: '0.5rem',
              textAlign: 'center',
              zIndex: 1000
            }}>
              <p style={{
                color: 'rgba(255, 215, 0, 0.8)',
                margin: '0 0 0.5rem 0',
                fontSize: '1rem'
              }}>
                No matches for "{inputValue}"
              </p>
              <small style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.85rem'
              }}>
                Try searching for character names or themes
              </small>
            </div>
          )}
        </div>

        {/* Categories or Characters View */}
        {!selectedCategory ? (
          <div style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
            marginTop: '1rem',
          }}>
            {characterCategories.map((category) => (
              <div
                key={category.key}
                onClick={() => handleCategorySelect(category)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '16px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  aspectRatio: '1',
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  marginBottom: '0.7rem',
                  border: '2px solid rgba(255, 215, 0, 0.4)',
                  background: 'rgba(0,0,0,0.3)'
                }}>
                  <img
                    src={categoryRepresentatives[category.key]}
                    alt={category.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: 'sepia(20%) contrast(1.1)',
                    }}
                    onError={(e) => {
                      e.target.src = '/images/default-character.jpg';
                    }}
                  />
                </div>
                
                <h3 style={{
                  color: '#FFD700',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  margin: '0 0 0.3rem 0',
                  letterSpacing: '0.5px',
                  fontFamily: "'Cinzel', serif",
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  lineHeight: 1.1
                }}>
                  {category.title}
                </h3>
                
                <span style={{
                  color: 'rgba(255, 215, 0, 0.7)',
                  fontSize: '0.6rem',
                  background: 'rgba(255, 215, 0, 0.1)',
                  padding: '0.1rem 0.3rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 215, 0, 0.2)'
                }}>
                  {category.characters.length} guides
                </span>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Category Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              maxWidth: '500px',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(255, 215, 0, 0.3)'
            }}>
              <h2 style={{
                color: '#FFD700',
                fontSize: '1.5rem',
                fontFamily: "'Cinzel Decorative', serif",
                margin: 0,
                letterSpacing: '1px',
                textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
              }}>
                {selectedCategory.title}
              </h2>
              
              <button
                onClick={handleBackToCategories}
                style={{
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  borderRadius: '6px',
                  color: '#FFD700',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '0.3rem 0.8rem',
                  cursor: 'pointer',
                  fontFamily: "'Cinzel', serif"
                }}
              >
                ← Back
              </button>
            </div>

            {/* Characters Grid */}
            <div style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              marginTop: '1rem',
            }}>
              {selectedCategory.characters.map((character) => (
                <div
                  key={character.key}
                  onClick={() => handleCharacterSelect(character)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    borderRadius: '16px',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minHeight: '180px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    marginBottom: '0.5rem',
                    border: '2px solid rgba(255, 215, 0, 0.3)',
                  }}>
                    <img
                      src={character.thumbnailUrl}
                      alt={character.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.src = '/images/default-character.jpg';
                      }}
                    />
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{
                      color: '#FFD700',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      margin: '0 0 0.3rem 0',
                      letterSpacing: '0.5px',
                      lineHeight: 1.2
                    }}>
                      {character.name}
                    </h3>
                    
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontSize: '0.65rem',
                      lineHeight: 1.3,
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {character.description.slice(0, 80)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Character Detail Modal */}
        {selectedChar && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(11, 20, 38, 0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '16px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '400px',
              backdropFilter: 'blur(20px)',
              textAlign: 'center',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <img
                src={selectedChar.thumbnailUrl}
                alt={selectedChar.name}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid rgba(255, 215, 0, 0.4)',
                  marginBottom: '1rem'
                }}
                onError={(e) => {
                  e.target.src = '/images/default-character.jpg';
                }}
              />
              
              <h2 style={{
                color: '#FFD700',
                fontSize: '1.3rem',
                fontWeight: 600,
                margin: '0 0 0.5rem 0',
                letterSpacing: '1px'
              }}>
                {selectedChar.name}
              </h2>
              
              <p style={{
                color: 'rgba(255, 215, 0, 0.7)',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: '0 0 1rem 0'
              }}>
                {selectedChar.category}
              </p>
              
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                margin: '0 0 1.5rem 0'
              }}>
                {selectedChar.description}
              </p>
              
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => onStartChat(selectedChar.key)}
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))',
                    border: '2px solid rgba(255, 215, 0, 0.5)',
                    borderRadius: '8px',
                    color: '#FFD700',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    padding: '0.6rem 1.2rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: "'Cinzel', serif"
                  }}
                >
                  Start Chat
                </button>
                
                <button
                  onClick={() => setSelectedChar(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    padding: '0.6rem 1.2rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: "'Cinzel', serif"
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout (original code with minor adjustments)
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      fontFamily: "'Cinzel', serif",
      background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 25%, #2C1810 50%, #0F1A2E 75%, #0B1426 100%)',
      overflow: 'hidden'
    }}>
      
      {/* LEFT HALF - Search Section */}
      <div style={{
        width: '50%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: '4rem 2rem 2rem 2rem',
        position: 'relative',
        borderRight: '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        {/* Welcome Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          <h1 style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: '2.5rem',
            background: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            margin: '0 0 1rem 0',
            textShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
            letterSpacing: '2px',
            fontWeight: 700
          }}>
            Welcome, {user?.displayName || 'Seeker'}
          </h1>
          
          <p style={{
            fontSize: '1.2rem',
            color: 'rgba(255, 215, 0, 0.8)',
            fontStyle: 'italic',
            letterSpacing: '1px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
            margin: 0,
            transition: 'opacity 0.5s ease',
            opacity: showResults ? 0.5 : 1
          }}>
            {currentPlaceholder}
          </p>
        </div>

        {/* Search Section */}
        <div style={{
          width: '100%',
          maxWidth: '400px',
          position: 'relative',
          marginBottom: '1rem'
        }}>
          <input
            type="text"
            placeholder="Search characters..."
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => inputValue.length >= 2 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              fontSize: '1.1rem',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '25px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#FFD700',
              outline: 'none',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              fontFamily: "'Cinzel', serif"
            }}
          />

          {/* Search Results */}
          {showResults && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              maxHeight: '300px',
              overflowY: 'auto',
              background: 'rgba(11, 20, 38, 0.95)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '15px',
              backdropFilter: 'blur(20px)',
              padding: '1rem',
              marginTop: '0.5rem',
              zIndex: 1000
            }}>
              {searchResults.map((character, index) => (
                <div
                  key={character.key}
                  onClick={() => handleCharacterSelect(character)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    marginBottom: index < searchResults.length - 1 ? '0.5rem' : 0
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 215, 0, 0.1)';
                    e.target.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.target.style.borderColor = 'rgba(255, 215, 0, 0.2)';
                  }}
                >
                  <img
                    src={character.thumbnailUrl}
                    alt={character.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid rgba(255, 215, 0, 0.3)'
                    }}
                    onError={(e) => {
                      e.target.src = '/images/default-character.jpg';
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#FFD700',
                      marginBottom: '0.25rem'
                    }}>
                      {character.name}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 215, 0, 0.7)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {character.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showResults && searchResults.length === 0 && inputValue.length >= 2 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'rgba(11, 20, 38, 0.95)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '15px',
              backdropFilter: 'blur(20px)',
              padding: '1rem',
              marginTop: '0.5rem',
              textAlign: 'center',
              zIndex: 1000
            }}>
              <p style={{
                color: 'rgba(255, 215, 0, 0.8)',
                margin: '0 0 0.5rem 0',
                fontSize: '1rem'
              }}>
                No matches for "{inputValue}"
              </p>
              <small style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.85rem'
              }}>
                Try searching for character names or themes
              </small>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT HALF - Categories/Characters */}
      <div style={{
        width: '50%',
        height: '100%',
        position: 'relative',
        perspective: '1000px'
      }}>
        
        {/* Categories Grid */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          padding: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          alignContent: 'center',
          transform: selectedCategory ? 'rotateY(-90deg)' : 'rotateY(0deg)',
          transition: 'transform 0.6s ease-in-out',
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden'
        }}>
          {characterCategories.map((category, index) => (
            <div
              key={category.key}
              onClick={() => handleCategorySelect(category)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                borderRadius: '16px',
                padding: '1.5rem',
                backdropFilter: 'blur(10px)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                aspectRatio: '1',
                opacity: 0,
                animation: `categorySlideIn 0.6s ease-out ${index * 0.1}s forwards`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.6)';
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(255, 215, 0, 0.2)';
                
                const img = e.currentTarget.querySelector('img');
                if (img) {
                  img.style.filter = 'sepia(0%) contrast(1.2) brightness(1.1)';
                  img.parentElement.style.borderColor = 'rgba(255, 215, 0, 0.8)';
                  img.parentElement.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                
                const img = e.currentTarget.querySelector('img');
                if (img) {
                  img.style.filter = 'sepia(20%) contrast(1.1)';
                  img.parentElement.style.borderColor = 'rgba(255, 215, 0, 0.4)';
                  img.parentElement.style.boxShadow = 'none';
                }
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                overflow: 'hidden',
                marginBottom: '0.7rem',
                border: '3px solid rgba(255, 215, 0, 0.4)',
                transition: 'all 0.3s ease',
                background: 'rgba(0,0,0,0.3)'
              }}>
                <img
                  src={categoryRepresentatives[category.key]}
                  alt={category.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'sepia(20%) contrast(1.1)',
                    transition: 'filter 0.3s ease'
                  }}
                  onError={(e) => {
                    e.target.src = '/images/default-character.jpg';
                  }}
                />
              </div>
              
              <h3 style={{
                color: '#FFD700',
                fontSize: '0.9rem',
                fontWeight: 600,
                margin: '0 0 0.3rem 0',
                letterSpacing: '0.5px',
                fontFamily: "'Cinzel', serif",
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                lineHeight: 1.1
              }}>
                {category.title}
              </h3>
              
              <span style={{
                color: 'rgba(255, 215, 0, 0.7)',
                fontSize: '0.65rem',
                background: 'rgba(255, 215, 0, 0.1)',
                padding: '0.15rem 0.4rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 215, 0, 0.2)'
              }}>
                {category.characters.length} guides
              </span>
            </div>
          ))}
        </div>

        {/* Characters Panel */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          padding: '2rem',
          transform: selectedCategory ? 'rotateY(0deg)' : 'rotateY(90deg)',
          transition: 'transform 0.6s ease-in-out',
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          overflowY: 'auto'
        }}>
          {selectedCategory && (
            <>
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                paddingBottom: '1rem',
                borderBottom: '2px solid rgba(255, 215, 0, 0.3)'
              }}>
                <h2 style={{
                  color: '#FFD700',
                  fontSize: '2rem',
                  fontFamily: "'Cinzel Decorative', serif",
                  margin: 0,
                  letterSpacing: '2px',
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.5)'
                }}>
                  {selectedCategory.title}
                </h2>
                
                <button
                  onClick={handleBackToCategories}
                  style={{
                    background: 'rgba(255, 215, 0, 0.1)',
                    border: '2px solid rgba(255, 215, 0, 0.4)',
                    borderRadius: '8px',
                    color: '#FFD700',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: "'Cinzel', serif"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.4)';
                  }}
                >
                  ← Back
                </button>
              </div>

              {/* Characters Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`,
                gap: '1rem',
                maxHeight: 'calc(100vh - 200px)',
                overflowY: 'auto',
                paddingRight: '0.5rem'
              }}>
                {selectedCategory.characters.map((character, index) => (
                  <div
                    key={character.key}
                    onClick={() => handleCharacterSelect(character)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 215, 0, 0.2)',
                      borderRadius: '16px',
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      opacity: 0,
                      animation: `characterSlideIn 0.6s ease-out ${index * 0.05}s forwards`,
                      minHeight: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.boxShadow = '0 16px 32px rgba(255, 215, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.2)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      marginBottom: '0.75rem',
                      border: '3px solid rgba(255, 215, 0, 0.3)',
                      flexShrink: 0
                    }}>
                      <img
                        src={character.thumbnailUrl}
                        alt={character.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.src = '/images/default-character.jpg';
                        }}
                      />
                    </div>
                    
                    <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{
                        color: '#FFD700',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        margin: '0 0 0.5rem 0',
                        letterSpacing: '0.5px',
                        lineHeight: 1.2
                      }}>
                        {character.name}
                      </h3>
                      
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.85)',
                        fontSize: '0.7rem',
                        lineHeight: 1.3,
                        margin: 0,
                        flex: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {character.description.slice(0, 100)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Character Detail Modal */}
      {selectedChar && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(11, 20, 38, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            backdropFilter: 'blur(20px)',
            textAlign: 'center',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <img
              src={selectedChar.thumbnailUrl}
              alt={selectedChar.name}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid rgba(255, 215, 0, 0.4)',
                marginBottom: '1.5rem'
              }}
              onError={(e) => {
                e.target.src = '/images/default-character.jpg';
              }}
            />
            
            <h2 style={{
              color: '#FFD700',
              fontSize: '1.5rem',
              fontWeight: 600,
              margin: '0 0 0.5rem 0',
              letterSpacing: '1px'
            }}>
              {selectedChar.name}
            </h2>
            
            <p style={{
              color: 'rgba(255, 215, 0, 0.7)',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: '0 0 1.5rem 0'
            }}>
              {selectedChar.category}
            </p>
            
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '1rem',
              lineHeight: 1.6,
              margin: '0 0 2rem 0'
            }}>
              {selectedChar.description}
            </p>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => onStartChat(selectedChar.key)}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))',
                  border: '2px solid rgba(255, 215, 0, 0.5)',
                  borderRadius: '8px',
                  color: '#FFD700',
                  fontSize: '1rem',
                  fontWeight: 600,
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: "'Cinzel', serif"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.2))';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Start Chat
              </button>
              
              <button
                onClick={() => setSelectedChar(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: "'Cinzel', serif"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Cinzel+Decorative:wght@400;700&display=swap');
        
        /* Global scrollbar theme for ChatLauncher */
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 215, 0, 0.6) rgba(255, 215, 0, 0.1);
        }

        /* Webkit scrollbar styling (Chrome, Safari, Edge) */
        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        *::-webkit-scrollbar-track {
          background: rgba(255, 215, 0, 0.1);
          border-radius: 4px;
        }

        *::-webkit-scrollbar-thumb {
          background: rgba(255, 215, 0, 0.5);
          border-radius: 4px;
          border: 1px solid rgba(255, 215, 0, 0.2);
        }

        *::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 215, 0, 0.7);
          box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
        }

        *::-webkit-scrollbar-corner {
          background: rgba(255, 215, 0, 0.1);
        }

        /* Mobile specific scrollbars - thinner for touch */
        @media (max-width: 768px) {
          *::-webkit-scrollbar {
            width: 4px;
            height: 4px;
          }
          
          *::-webkit-scrollbar-thumb {
            background: rgba(255, 215, 0, 0.6);
            border-radius: 2px;
          }
          
          *::-webkit-scrollbar-track {
            background: rgba(255, 215, 0, 0.1);
            border-radius: 2px;
          }
        }
        
        @keyframes categorySlideIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.7);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes characterSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default SplitScreenLauncher;