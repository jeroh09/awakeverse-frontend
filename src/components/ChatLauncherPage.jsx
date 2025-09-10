// src/pages/ChatLauncherPage.jsx - Simplified with no premium dependencies
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import useInteractedCharacters from '../hooks/useInteractedCharacters';

import TemplateGallery from '../components/TemplateGallery';
import CharacterBuilder from '../components/CharacterBuilder';
import CharacterCreationSuccess from '../components/CharacterCreationSuccess';

import { characterCategories } from '../data/characterCategories';

// Enhanced semantic mappings for character search (unchanged)
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
  'discovery': ['makers', 'truthweavers'],
  'genius': ['makers', 'thinkers'],
  'military': ['warlords'],
  'tactics': ['warlords'],
  'conquest': ['warlords'],
  'diplomacy': ['warlords', 'goldhands'],
  'espionage': ['sleuths', 'warlords'],
  'spy': ['sleuths'],
  'crime': ['sleuths'],
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
  "Which guide calls to you?",
  "Who would you counsel with?",
  "Find your mentor...",
];

// Category representatives for UI (unchanged)
const categoryRepresentatives = {
  'sleuths': '/images/sherlock.jpg',
  'stargazers': '/images/nostradamus.jpg', 
  'truthweavers': '/images/dante.jpg',
  'veilwalkers': '/images/rasputin.jpg',
  'goldhands': '/images/mansa_musa.jpg',
  'heartstrings': '/images/shakespeare.jpg',
  'thinkers': '/images/socrates.jpg',
  'makers': '/images/da_vinci.jpg',
  'warlords': '/images/sun_tzu.jpg',
  'pathfinders': '/images/christopher_columbus.jpg',
  'performers': '/images/harry_houdini.jpg',
  'my_characters': '/images/default-character.jpg'
};

const ChatLauncherPage = ({ onStartChat }) => {
  const { user } = useUser();

  // Character creation flow state (moved from hooks to local state)
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // User interaction tracking (kept - no premium dependencies)
  const {
    recentCharacters,
    shouldShowForYou,
    trackInteraction,
    hasActiveConversations
  } = useInteractedCharacters();

  // UI state management (unchanged)
  const [inputValue, setInputValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedChar, setSelectedChar] = useState(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection (unchanged)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Rotate placeholder text (unchanged)
  useEffect(() => {
    const interval = setInterval(
      () => setPlaceholderIndex(prev => (prev + 1) % ORACLE_PROMPTS.length),
      4000
    );
    return () => clearInterval(interval);
  }, []);

  // Enhanced categories - simplified without premium character integration
  const enhancedCategories = useMemo(() => {
    return characterCategories; // Use base categories without premium modifications
  }, []);

  // Search functionality (unchanged)
  const performSemanticSearch = useMemo(() => {
    return (query) => {
      if (!query.trim()) return [];
      const searchTerm = query.toLowerCase().trim();
      const results = [];

      enhancedCategories.forEach(category => {
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
      
      return results.sort((a, b) => b.relevance - a.relevance).slice(0, 8);
    };
  }, [enhancedCategories]);

  // Event handlers (simplified - no premium state management)
  const handleInputChange = useCallback((text) => {
    setInputValue(text);
    if (text.length >= 2) {
      const results = performSemanticSearch(text);
      setSearchResults(results);
      setShowResults(true);
    } else {
      setShowResults(false);
      setSearchResults([]);
    }
  }, [performSemanticSearch]);

  const handleCharacterSelect = useCallback((character) => {
    trackInteraction(character.key);
    setSelectedChar({
      key: character.key,
      name: character.name,
      thumbnailUrl: character.thumbnailUrl,
      description: character.description,
      category: character.category
    });
  }, [trackInteraction]);

  const handleRecentCharacterSelect = useCallback((recentCharacter) => {
    trackInteraction(recentCharacter.character);
    onStartChat(recentCharacter.character);
  }, [trackInteraction, onStartChat]);

  const handleCategorySelect = useCallback((category) => {
    setSelectedCategory(category);
    setShowResults(false);
    setInputValue('');
  }, []);

  const handleBackToCategories = useCallback(() => {
    setSelectedCategory(null);
  }, []);

  const handleStartChatFromSelection = useCallback(() => {
    if (selectedChar) {
      trackInteraction(selectedChar.key);
      onStartChat(selectedChar.key);
    }
  }, [selectedChar, trackInteraction, onStartChat]);

  // Character creation handlers (simplified - no premium checks)
  const handleCreateCharacterClick = useCallback(() => {
    console.log('Create character clicked - starting template selection');
    setShowTemplates(true);
  }, []);

  const handleTemplateSelect = useCallback((template) => {
    console.log('Template selected:', template.name);
    setSelectedTemplate(template);
    setShowTemplates(false);
    setShowBuilder(true);
  }, []);

  const handleCharacterCreationComplete = useCallback(() => {
    console.log('Character creation completed');
    setShowBuilder(false);
    setShowSuccess(true);
  }, []);

  const handleCloseCreationFlow = useCallback(() => {
    console.log('Closing character creation flow');
    setShowTemplates(false);
    setShowBuilder(false);
    setShowSuccess(false);
    setSelectedTemplate(null);
  }, []);

  const currentPlaceholder = ORACLE_PROMPTS[placeholderIndex];

  // Character Creation Flow Modals (moved from hooks to local state)
  if (showSuccess) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 4000,
        background: 'rgba(0, 0, 0, 0.95)'
      }}>
        <CharacterCreationSuccess onClose={handleCloseCreationFlow} />
      </div>
    );
  }

  if (showTemplates) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 3000,
        background: 'rgba(0, 0, 0, 0.95)',
        overflowY: 'auto'
      }}>
        <TemplateGallery 
          onSelectTemplate={handleTemplateSelect}
          onClose={handleCloseCreationFlow}
        />
      </div>
    );
  }

  if (showBuilder && selectedTemplate) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 3000,
        background: 'rgba(0, 0, 0, 0.95)'
      }}>
        <CharacterBuilder 
          template={selectedTemplate}
          onClose={handleCloseCreationFlow}
          onSuccess={handleCharacterCreationComplete}
        />
      </div>
    );
  }

  // Mobile layout (simplified - removed premium state components)
  if (isMobile) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        padding: '1rem',
        fontFamily: "'Georgia', serif",
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
            fontFamily: "'Playfair Display', serif",
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
              fontFamily: "'Georgia', serif"
            }}
          />

          {/* Search Results (unchanged) */}
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
                    onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
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

        {/* Personalized Section (Mobile) */}
        {shouldShowForYou && (
          <PersonalizedSection 
            characters={recentCharacters}
            onCharacterSelect={handleRecentCharacterSelect}
            hasActiveConversations={hasActiveConversations}
            isMobile={true}
          />
        )}

        {/* Categories or Characters View */}
        {!selectedCategory ? (
          <div style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
            marginTop: '1rem',
          }}>
            {enhancedCategories.map((category) => (
              <CategoryCard
                key={category.key}
                category={category}
                onClick={() => handleCategorySelect(category)}
                isMobile={true}
                onCreateCharacter={handleCreateCharacterClick}
              />
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
                fontFamily: "'Playfair Display', serif",
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
                  fontFamily: "'Georgia', serif"
                }}
              >
                ← Back
              </button>
            </div>

            {/* Mobile Characters Content Area */}
            {selectedCategory.key === 'my_characters' ? (
              <MyCharactersPanel 
                onCreateCharacter={handleCreateCharacterClick}
                isMobile={true}
              />
            ) : (
              <div style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                marginTop: '1rem',
              }}>
                {selectedCategory.characters.map((character) => (
                  <CharacterCard
                    key={character.key}
                    character={character}
                    onClick={() => handleCharacterSelect(character)}
                    isMobile={true}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Character Detail Modal (Mobile) */}
        {selectedChar && (
          <CharacterDetailModal
            character={selectedChar}
            onStartChat={handleStartChatFromSelection}
            onClose={() => setSelectedChar(null)}
            isMobile={true}
          />
        )}

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Desktop layout (simplified - removed premium state components)
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      fontFamily: "'Georgia', serif",
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
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
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

        {/* Search Section - rest of desktop implementation unchanged */}
        {/* ... search input, results, personalized section ... */}

        {/* Personalized Section (Desktop) */}
        {shouldShowForYou && (
          <PersonalizedSection 
            characters={recentCharacters}
            onCharacterSelect={handleRecentCharacterSelect}
            hasActiveConversations={hasActiveConversations}
            isMobile={false}
          />
        )}
      </div>

      {/* RIGHT HALF - Categories/Characters */}
      <div style={{ width: '50%', height: '100%', position: 'relative', perspective: '1000px' }}>

        {/* Categories Grid */}
        <div 
          className="categories-grid-container"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            padding: '2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(4, 1fr)',
            gap: '1rem',
            alignContent: 'start',
            justifyContent: 'center',
            transform: selectedCategory ? 'rotateY(-90deg)' : 'rotateY(0deg)',
            transition: 'transform 0.6s ease-in-out',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            overflowY: 'auto',
            overflowX: 'hidden',
            maxHeight: '100%',
            paddingRight: '2.5rem'
          }}
        >
          {enhancedCategories.map((category, index) => (
            <CategoryCard
              key={category.key}
              category={category}
              onClick={() => handleCategorySelect(category)}
              index={index}
              isMobile={false}
              onCreateCharacter={handleCreateCharacterClick}
            />
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
        }} className="character-panel">
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
                  fontFamily: "'Playfair Display', serif",
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
                    fontFamily: "'Georgia', serif"
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

              {/* Desktop Content Area */}
              {selectedCategory.key === 'my_characters' ? (
                <MyCharactersPanel 
                  onCreateCharacter={handleCreateCharacterClick}
                  isMobile={false}
                />
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                  maxHeight: 'calc(100vh - 200px)',
                  overflowY: 'auto',
                  paddingRight: '0.5rem'
                }}>
                  {selectedCategory.characters.map((character, index) => (
                    <CharacterCard
                      key={character.key}
                      character={character}
                      onClick={() => handleCharacterSelect(character)}
                      index={index}
                      isMobile={false}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Character Detail Modal (Desktop) */}
      {selectedChar && (
        <CharacterDetailModal
          character={selectedChar}
          onStartChat={handleStartChatFromSelection}
          onClose={() => setSelectedChar(null)}
          isMobile={false}
        />
      )}

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Cinzel+Decorative:wght@400;700&display=swap');
        
        @keyframes categorySlideIn {
          from { opacity: 0; transform: translateY(30px) scale(0.7); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        @keyframes characterSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideInFromLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.7; transform: scale(1.1); }
        }

        .recent-characters::-webkit-scrollbar { display: none; }
        
        .character-panel::-webkit-scrollbar { width: 6px; }
        .character-panel::-webkit-scrollbar-track {
          background: rgba(255, 215, 0, 0.1);
          border-radius: 3px;
        }
        
        .character-panel::-webkit-scrollbar-thumb {
          background: rgba(255, 215, 0, 0.5);
          border-radius: 3px;
        }
        .character-panel::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 215, 0, 0.7);
        }
        
        .categories-grid-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 215, 0, 0.6) rgba(11, 20, 38, 0.8);
        }

        .categories-grid-container::-webkit-scrollbar {
          width: 8px;
        }

        .categories-grid-container::-webkit-scrollbar-track {
          background: rgba(11, 20, 38, 0.8);
          border-radius: 4px;
          border: 1px solid rgba(255, 215, 0, 0.1);
        }

        .categories-grid-container::-webkit-scrollbar-thumb {
          background: linear-gradient(
            180deg, 
            rgba(255, 215, 0, 0.8) 0%, 
            rgba(255, 215, 0, 0.6) 50%,
            rgba(255, 215, 0, 0.4) 100%
          );
          border-radius: 4px;
          border: 1px solid rgba(255, 215, 0, 0.3);
          transition: all 0.3s ease;
        }

        .categories-grid-container::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            180deg, 
            rgba(255, 215, 0, 1) 0%, 
            rgba(255, 215, 0, 0.8) 50%,
            rgba(255, 215, 0, 0.6) 100%
          );
          box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
        }
      `}</style>
    </div>
  );
};

// Helper Components - Simplified without premium dependencies

const CategoryCard = ({ category, onClick, index = 0, isMobile, onCreateCharacter }) => {
  const isMyCharacters = category.key === 'my_characters';

  const handleClick = () => {
    if (isMyCharacters) {
      // For my characters, show the panel which will handle creation flow
      onClick();
    } else {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: isMyCharacters 
          ? '1px solid rgba(255, 215, 0, 0.4)' 
          : '1px solid rgba(255, 215, 0, 0.2)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        aspectRatio: '1',
        opacity: 0,
        animation: `categorySlideIn 0.6s ease-out ${index * 0.1}s forwards`,
        minHeight: isMobile ? '120px' : '150px',
        maxHeight: isMobile ? '160px' : '200px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 215, 0, 0.08)';
        e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.6)';
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(255, 215, 0, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.borderColor = isMyCharacters 
          ? 'rgba(255, 215, 0, 0.4)' 
          : 'rgba(255, 215, 0, 0.2)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Category Avatar */}
      <div style={{
        width: isMobile ? '48px' : '56px',
        height: isMobile ? '48px' : '56px',
        borderRadius: '50%',
        overflow: 'hidden',
        marginBottom: '0.7rem',
        border: isMyCharacters 
          ? '3px solid rgba(255, 215, 0, 0.6)' 
          : '3px solid rgba(255, 215, 0, 0.4)',
        transition: 'all 0.3s ease',
        background: 'rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        {/* Premium indicator for My Characters */}
        {isMyCharacters && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            width: '16px',
            height: '16px',
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            borderRadius: '50%',
            fontSize: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            fontWeight: 'bold',
            zIndex: 1
          }}>
            ⭐
          </div>
        )}
        
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
          onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
        />
      </div>
      
      {/* Category Title */}
      <h3 style={{
        color: '#FFD700',
        fontSize: isMobile ? '0.85rem' : '0.9rem',
        fontWeight: 600,
        margin: '0 0 0.3rem 0',
        letterSpacing: '0.5px',
        fontFamily: "'Georgia', serif",
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
        lineHeight: 1.1
      }}>
        {category.title}
      </h3>
      
      {/* Category Badge */}
      <span style={{
        color: isMyCharacters 
          ? '#FFD700' 
          : 'rgba(255, 215, 0, 0.7)',
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        background: isMyCharacters 
          ? 'rgba(255, 215, 0, 0.2)' 
          : 'rgba(255, 215, 0, 0.1)',
        padding: '0.15rem 0.4rem',
        borderRadius: '8px',
        border: isMyCharacters 
          ? '1px solid rgba(255, 215, 0, 0.4)' 
          : '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        {isMyCharacters 
          ? 'Create Character'
          : `${category.characters.length} guides`
        }
      </span>
    </div>
  );
};

const CharacterCard = ({ character, onClick, index = 0, isMobile }) => (
  <div
    onClick={() => onClick(character)}
    style={{
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 215, 0, 0.2)',
      borderRadius: '16px',
      padding: '1rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      opacity: 0,
      animation: `characterSlideIn 0.6s ease-out ${index * 0.05}s forwards`,
      minHeight: isMobile ? '140px' : '200px',
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
      width: isMobile ? '40px' : '50px',
      height: isMobile ? '40px' : '50px',
      borderRadius: '50%',
      overflow: 'hidden',
      marginBottom: '0.75rem',
      border: '3px solid rgba(255, 215, 0, 0.3)',
      flexShrink: 0
    }}>
      <img
        src={character.thumbnailUrl}
        alt={character.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
      />
    </div>
    
    <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <h3 style={{
        color: '#FFD700',
        fontSize: isMobile ? '0.8rem' : '0.85rem',
        fontWeight: 600,
        margin: '0 0 0.5rem 0',
        letterSpacing: '0.5px',
        lineHeight: 1.2
      }}>
        {character.name}
      </h3>
      
      <p style={{
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        lineHeight: 1.3,
        margin: 0,
        flex: 1,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {character.description.slice(0, isMobile ? 80 : 100)}...
      </p>
    </div>
  </div>
);

const CharacterDetailModal = ({ character, onStartChat, onClose, isMobile }) => (
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
    padding: isMobile ? '1rem' : '2rem'
  }}>
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      border: '2px solid rgba(255, 215, 0, 0.3)',
      borderRadius: isMobile ? '16px' : '20px',
      padding: isMobile ? '1.5rem' : '2rem',
      width: '100%',
      maxWidth: isMobile ? '400px' : '500px',
      backdropFilter: 'blur(20px)',
      textAlign: 'center',
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      <img
        src={character.thumbnailUrl}
        alt={character.name}
        style={{
          width: isMobile ? '80px' : '100px',
          height: isMobile ? '80px' : '100px',
          borderRadius: '50%',
          objectFit: 'cover',
          border: isMobile ? '3px solid rgba(255, 215, 0, 0.4)' : '4px solid rgba(255, 215, 0, 0.4)',
          marginBottom: '1.5rem'
        }}
        onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
      />
      
      <h2 style={{
        color: '#FFD700',
        fontSize: isMobile ? '1.3rem' : '1.5rem',
        fontWeight: 600,
        margin: '0 0 0.5rem 0',
        letterSpacing: '1px'
      }}>
        {character.name}
      </h2>
      
      <p style={{
        color: 'rgba(255, 215, 0, 0.7)',
        fontSize: isMobile ? '0.8rem' : '0.9rem',
        letterSpacing: '0.5px',
        margin: '0 0 1.5rem 0'
      }}>
        {character.category}
      </p>
      
      <p style={{
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: isMobile ? '0.9rem' : '1rem',
        lineHeight: 1.6,
        margin: '0 0 2rem 0'
      }}>
        {character.description}
      </p>
      
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button
          onClick={onStartChat}
          style={{
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))',
            border: '2px solid rgba(255, 215, 0, 0.5)',
            borderRadius: '8px',
            color: '#FFD700',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: 600,
            padding: isMobile ? '0.6rem 1.2rem' : '0.75rem 1.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: "'Georgia', serif"
          }}
        >
          Start Chat
        </button>
        
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: 600,
            padding: isMobile ? '0.6rem 1.2rem' : '0.75rem 1.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: "'Georgia', serif"
          }}
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

const PersonalizedSection = ({ characters, onCharacterSelect, hasActiveConversations, isMobile }) => {
  const maxCharacters = isMobile ? 3 : 4;

  return (
    <div style={{
      width: '100%',
      maxWidth: isMobile ? '500px' : '400px',
      margin: '1rem 0',
      animation: 'slideInFromLeft 0.6s ease-out'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        padding: '0 0.5rem'
      }}>
        <h3 style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: '#FFD700',
          fontWeight: 600,
          letterSpacing: '0.5px',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
          margin: 0,
          fontFamily: "'Georgia', serif"
        }}>
          For You
        </h3>
        <span style={{
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))',
          border: '1px solid rgba(255, 215, 0, 0.4)',
          borderRadius: '12px',
          padding: '0.2rem 0.6rem',
          fontSize: '0.7rem',
          color: 'rgba(255, 215, 0, 0.9)',
          letterSpacing: '0.3px'
        }}>
          Recent
        </span>
      </div>

      {/* Character List */}
      <div style={{
        display: isMobile ? 'flex' : 'grid',
        gridTemplateColumns: isMobile ? 'none' : 'repeat(2, 1fr)',
        gap: isMobile ? '1rem' : '0.75rem',
        padding: '0.5rem 0',
        justifyContent: isMobile ? 'space-between' : 'normal'
      }}>
        {characters.slice(0, maxCharacters).map((character) => (
          <div
            key={character.character}
            onClick={() => onCharacterSelect(character)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(5px)',
              position: 'relative',
              padding: isMobile ? '0.75rem 0.5rem' : '0.75rem',
              flex: isMobile ? '1' : 'none',
              maxWidth: isMobile ? '100px' : 'none',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              gap: isMobile ? '0.5rem' : '0.6rem'
            }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={character.thumbnailUrl}
                alt={character.name}
                style={{
                  width: isMobile ? '50px' : '45px',
                  height: isMobile ? '50px' : '45px',
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 215, 0, 0.3)',
                  objectFit: 'cover'
                }}
                onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
              />
              {character.hasActiveConversation && (
                <div style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '12px',
                  height: '12px',
                  background: '#00FF88',
                  border: '2px solid #0B1426',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }} />
              )}
            </div>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              textAlign: isMobile ? 'center' : 'left',
              minWidth: 0,
              flex: 1
            }}>
              <span style={{
                fontSize: isMobile ? '0.7rem' : '0.85rem',
                color: '#FFD700',
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: '0.3px'
              }}>
                {String(character.name || '').split(' ')[0]}
              </span>
              {!isMobile && hasActiveConversations && character.hasActiveConversation && (
                <span style={{
                  fontSize: '0.65rem',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  Active now
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MyCharactersPanel = ({ onCreateCharacter, isMobile }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: isMobile ? '300px' : '400px',
    textAlign: 'center',
    padding: isMobile ? '1rem' : '2rem',
    width: '100%'
  }}>
    <div style={{
      maxWidth: isMobile ? '300px' : '400px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: isMobile ? '1.5rem' : '2rem'
    }}>
      <div style={{
        width: isMobile ? '80px' : '100px',
        height: isMobile ? '80px' : '100px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))',
        border: '3px solid rgba(255, 215, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: isMobile ? '32px' : '40px'
      }}>
        ✨
      </div>

      <div>
        <h3 style={{
          color: '#FFD700',
          fontSize: isMobile ? '1.3rem' : '1.5rem',
          fontFamily: "'Playfair Display', serif",
          margin: '0 0 1rem 0',
          letterSpacing: '1px',
          textShadow: '0 0 15px rgba(255, 215, 0, 0.5)'
        }}>
          Create Your Own Character
        </h3>
        
        <p style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: isMobile ? '0.9rem' : '1rem',
          lineHeight: 1.6,
          margin: '0 0 2rem 0',
          maxWidth: isMobile ? '300px' : '400px'
        }}>
          Design a custom AI character with unique personality, expertise, and backstory. 
          From historical figures to original creations - bring your vision to life.
        </p>
      </div>

      <button
        onClick={onCreateCharacter}
        style={{
          background: 'linear-gradient(135deg, #FFD700, #FFA500)',
          border: 'none',
          borderRadius: isMobile ? '20px' : '25px',
          color: '#000',
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: 700,
          padding: isMobile ? '0.8rem 1.5rem' : '1rem 2rem',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          fontFamily: "'Georgia', serif",
          boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.3)';
        }}
      >
        Start Creating
      </button>

      <p style={{
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '0.8rem',
        margin: 0
      }}>
        Character creation available through premium access
      </p>
    </div>
  </div>
);

export default ChatLauncherPage;