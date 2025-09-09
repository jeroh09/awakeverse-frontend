// src/pages/ChatLauncherPage.jsx - Complete refactor with new premium architecture
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { usePremiumCapabilitiesContext } from '../contexts/PremiumCapabilitiesContext';
import useCharacterCreationFlow from '../hooks/useCharacterCreationFlow';
import useInteractedCharacters from '../hooks/useInteractedCharacters';
import usePremiumCharacters from '../hooks/usePremiumCharacters';

import TemplateGallery from '../components/TemplateGallery';
import CharacterBuilder from '../components/CharacterBuilder';
import CharacterCreationSuccess from '../components/CharacterCreationSuccess';
import { PremiumStateRenderer, CapabilityGate } from '../components/PremiumComponents';

import { characterCategories } from '../data/characterCategories';

// Enhanced semantic mappings for character search
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

// Category representatives for UI
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
  const { token } = useAuth();
  
  // Premium capabilities integration
  const {
    subscriptionState,
    canCreateCharacter,
    shouldShowTrial,
    shouldShowUpgrade,
    primaryAction,
    characterCount,
    characterLimit,
    isInitialized: capabilitiesInitialized,
    loading: capabilitiesLoading
  } = usePremiumCapabilitiesContext();
 useEffect(() => {
    console.log('Auth Debug:', {
      user: !!user,
      userId: user?.id,
      token: !!token
    });
  }, [user, token]);

  // ADD THIS: Don't render until authentication is ready
  if (!user || !token) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0B1426 0%, #2C1810 100%)',
        color: '#FFD700'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 215, 0, 0.3)',
            borderTop: '3px solid #FFD700',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Character creation flow integration
  const {
    flowStep,
    showTemplates,
    showBuilder,
    showSuccess,
    selectedTemplate,
    startFlow,
    selectTemplate,
    closeFlow,
    canStartFlow
  } = useCharacterCreationFlow();

  // Character data integration
  const { 
    approvedCharacters, 
    loading: charactersLoading 
  } = usePremiumCharacters();

  // User interaction tracking
  const {
    recentCharacters,
    shouldShowForYou,
    trackInteraction,
    hasActiveConversations
  } = useInteractedCharacters();

  // UI state management
  const [inputValue, setInputValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedChar, setSelectedChar] = useState(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Rotate placeholder text
  useEffect(() => {
    const interval = setInterval(
      () => setPlaceholderIndex(prev => (prev + 1) % ORACLE_PROMPTS.length),
      4000
    );
    return () => clearInterval(interval);
  }, []);

  // Enhanced categories with user's characters integration
  const enhancedCategories = useMemo(() => {
    const allCategories = [...characterCategories];
    
    const myCharIndex = allCategories.findIndex(cat => cat.key === 'my_characters');

    if (myCharIndex !== -1) {
      allCategories[myCharIndex] = {
        ...allCategories[myCharIndex],
        characters: approvedCharacters.map(char => ({
          key: char.character_key,
          name: char.display_name,
          description: char.short_description,
          thumbnailUrl: char.avatar_url || char.thumbnailUrl || '/images/default-character.jpg'
        }))
      };
    }

    return allCategories;
  }, [approvedCharacters]);

  // Search functionality
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

  // Event handlers
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

  // Character creation handlers
  const handleCreateCharacterClick = useCallback(() => {
    console.log('Create character clicked - checking capabilities...');
    if (canStartFlow) {
      startFlow();
    } else {
      console.log('Cannot start flow - missing capabilities');
    }
  }, [canStartFlow, startFlow]);

  const currentPlaceholder = ORACLE_PROMPTS[placeholderIndex];

  // Show loading state while capabilities are loading
  if (!capabilitiesInitialized || capabilitiesLoading) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 25%, #2C1810 50%, #0F1A2E 75%, #0B1426 100%)',
        color: '#FFD700'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 215, 0, 0.3)',
            borderTop: '3px solid #FFD700',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>Loading your character universe...</p>
        </div>
      </div>
    );
  }

  // Character Creation Flow Modals
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
        <CharacterCreationSuccess onClose={closeFlow} />
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
          onSelectTemplate={selectTemplate}
          onClose={closeFlow}
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
          onClose={closeFlow}
        />
      </div>
    );
  }

  // Mobile layout
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
                subscriptionState={subscriptionState}
                approvedCharacters={approvedCharacters}
                charactersLoading={charactersLoading}
                onCreateCharacter={handleCreateCharacterClick}
                canStartFlow={canStartFlow}
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
              <PremiumStateRenderer
                freeComponent={
                  <FreeMobileMyCharacters onStartFlow={handleCreateCharacterClick} />
                }
                trialActiveComponent={
                  <TrialActiveMobileMyCharacters 
                    characters={approvedCharacters}
                    onStartChat={onStartChat}
                    onCreateCharacter={handleCreateCharacterClick}
                    canStartFlow={canStartFlow}
                  />
                }
                trialExpiredComponent={
                  <TrialExpiredMobileMyCharacters 
                    characters={approvedCharacters}
                    onStartChat={onStartChat}
                  />
                }
                premiumActiveComponent={
                  <PremiumActiveMobileMyCharacters 
                    characters={approvedCharacters}
                    onStartChat={onStartChat}
                    onCreateCharacter={handleCreateCharacterClick}
                    canStartFlow={canStartFlow}
                  />
                }
                pendingApprovalComponent={
                  <PendingApprovalMobileMyCharacters />
                }
                loadingComponent={
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid rgba(255, 215, 0, 0.3)',
                      borderTop: '3px solid #FFD700',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 1rem'
                    }} />
                    <p style={{ color: 'rgba(255, 215, 0, 0.8)' }}>
                      Loading your characters...
                    </p>
                  </div>
                }
              />
            ) : (
              // Regular Categories - Mobile Characters Grid
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

  // Desktop layout
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

        {/* Search Section */}
        <div style={{ width: '100%', maxWidth: '400px', position: 'relative', marginBottom: '1rem' }}>
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
              fontFamily: "'Georgia', serif"
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
                    e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.2)';
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
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFD700', marginBottom: '0.25rem' }}>
                      {character.name}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 215, 0, 0.7)',
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
              <small style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                Try searching for character names or themes
              </small>
            </div>
          )}
        </div>

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
              subscriptionState={subscriptionState}
              approvedCharacters={approvedCharacters}
              charactersLoading={charactersLoading}
              onCreateCharacter={handleCreateCharacterClick}
              canStartFlow={canStartFlow}
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
                <PremiumStateRenderer
                  freeComponent={
                    <FreeDesktopMyCharacters onStartFlow={handleCreateCharacterClick} />
                  }
                  trialActiveComponent={
                    <TrialActiveDesktopMyCharacters 
                      characters={approvedCharacters}
                      onStartChat={onStartChat}
                      onCreateCharacter={handleCreateCharacterClick}
                      canStartFlow={canStartFlow}
                    />
                  }
                  trialExpiredComponent={
                    <TrialExpiredDesktopMyCharacters 
                      characters={approvedCharacters}
                      onStartChat={onStartChat}
                    />
                  }
                  premiumActiveComponent={
                    <PremiumActiveDesktopMyCharacters 
                      characters={approvedCharacters}
                      onStartChat={onStartChat}
                      onCreateCharacter={handleCreateCharacterClick}
                      canStartFlow={canStartFlow}
                    />
                  }
                  pendingApprovalComponent={
                    <PendingApprovalDesktopMyCharacters />
                  }
                  loadingComponent={
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '4rem 2rem'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid rgba(255, 215, 0, 0.3)',
                        borderTop: '3px solid #FFD700',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <p style={{
                        color: 'rgba(255, 215, 0, 0.8)',
                        fontSize: '1.1rem',
                        margin: 0
                      }}>
                        Loading your characters...
                      </p>
                    </div>
                  }
                />
              ) : (
                // Regular Categories - Desktop Characters Grid
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

// Helper Components

const CategoryCard = ({ 
  category, 
  onClick, 
  index = 0, 
  isMobile, 
  subscriptionState, 
  approvedCharacters, 
  charactersLoading, 
  onCreateCharacter, 
  canStartFlow 
}) => {
  const isMyCharacters = category.key === 'my_characters';
  const isPremiumUser = ['trial_active', 'premium_active'].includes(subscriptionState);
  const hasApprovedCharacters = approvedCharacters.length > 0;

  const handleClick = () => {
    if (isMyCharacters && !isPremiumUser && !hasApprovedCharacters) {
      // Free user clicking my characters - start character creation flow
      onCreateCharacter();
    } else {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: isMyCharacters && !isPremiumUser 
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
        e.currentTarget.style.borderColor = isMyCharacters && !isPremiumUser 
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
        border: isMyCharacters && !isPremiumUser 
          ? '3px solid rgba(255, 215, 0, 0.6)' 
          : '3px solid rgba(255, 215, 0, 0.4)',
        transition: 'all 0.3s ease',
        background: 'rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        {/* Premium indicator for free users on My Characters */}
        {isMyCharacters && !isPremiumUser && (
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
        
        {/* Avatar content */}
        {isMyCharacters ? (
          charactersLoading ? (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                borderTop: '2px solid #FFD700',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          ) : hasApprovedCharacters ? (
            <img
              src={approvedCharacters[0].avatar_url || '/images/default-character.jpg'}
              alt="My Character"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'sepia(20%) contrast(1.1)',
                transition: 'filter 0.3s ease'
              }}
              onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '20px' : '24px',
              color: isPremiumUser ? '#FFD700' : 'rgba(128, 128, 128, 0.7)'
            }}>
              👤
            </div>
          )
        ) : (
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
        )}
      </div>
      
      {/* Category Title */}
      <h3 style={{
        color: isMyCharacters && !isPremiumUser 
          ? '#FFD700' 
          : '#FFD700',
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
        color: isMyCharacters && !isPremiumUser 
          ? '#FFD700' 
          : 'rgba(255, 215, 0, 0.7)',
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        background: isMyCharacters && !isPremiumUser 
          ? 'rgba(255, 215, 0, 0.2)' 
          : 'rgba(255, 215, 0, 0.1)',
        padding: '0.15rem 0.4rem',
        borderRadius: '8px',
        border: isMyCharacters && !isPremiumUser 
          ? '1px solid rgba(255, 215, 0, 0.4)' 
          : '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        {isMyCharacters 
          ? (charactersLoading ? 'Loading...' : 
             !isPremiumUser ? 'Create Character' : 
             hasApprovedCharacters ? `${approvedCharacters.length} custom` : 'Create')
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
);

const PersonalizedSection = ({ characters, onCharacterSelect, hasActiveConversations, isMobile }) => {
  const maxCharacters = isMobile ? 3 : 4;

  const cardBase = {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 215, 0, 0.2)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(5px)',
    position: 'relative'
  };

  const handleEnter = (e) => {
    e.currentTarget.style.background = 'rgba(255, 215, 0, 0.10)';
    e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.55)';
    e.currentTarget.style.boxShadow = '0 0 18px 4px rgba(255, 215, 0, 0.35)';
    e.currentTarget.style.transform = 'translateY(-3px)';
  };
  const handleLeave = (e) => {
    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
    e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.2)';
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.transform = 'translateY(0)';
  };

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

      {/* Layout */}
      {isMobile ? (
        // Mobile: 3 in a single row, evenly distributed
        <div style={{
          display: 'flex',
          gap: '1rem',
          padding: '0.5rem 0',
          justifyContent: 'space-between'
        }}>
          {characters.slice(0, maxCharacters).map((character) => (
            <div
              key={character.character}
              onClick={() => onCharacterSelect(character)}
              style={{ ...cardBase, flex: '1', maxWidth: '100px', padding: '0.75rem 0.5rem' }}
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
            >
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <img
                  src={character.thumbnailUrl}
                  alt={character.name}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    border: '2px solid rgba(255, 215, 0, 0.3)',
                    objectFit: 'cover',
                    marginBottom: '0.5rem',
                    transition: 'all 0.3s ease'
                  }}
                  onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
                />
                {character.hasActiveConversation && (
                  <div style={{
                    position: 'absolute',
                    top: '-2px',
                    right: 'calc(50% - 25px - 2px)',
                    width: '12px',
                    height: '12px',
                    background: '#00FF88',
                    border: '2px solid #0B1426',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }} />
                )}
              </div>
              <span style={{
                fontSize: '0.7rem',
                color: 'rgba(255, 215, 0, 0.9)',
                textAlign: 'center',
                fontWeight: 500,
                lineHeight: 1.1,
                letterSpacing: '0.3px',
                display: 'block'
              }}>
                {String(character.name || '').split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      ) : (
        // Desktop: 2x2 grid for 4 characters
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
          padding: '0.5rem 0'
        }}>
          {characters.slice(0, maxCharacters).map((character) => (
            <div
              key={character.character}
              onClick={() => onCharacterSelect(character)}
              style={{ ...cardBase, padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={character.thumbnailUrl}
                  alt={character.name}
                  style={{
                    width: '45px',
                    height: '45px',
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
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', color: '#FFD700', fontWeight: 600 }}>
                  {String(character.name || '').split(' ')[0]}
                </span>
                {hasActiveConversations && character.hasActiveConversation && (
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
      )}
    </div>
  );
};

// Premium State Components for My Characters section

const FreeMobileMyCharacters = ({ onStartFlow }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    textAlign: 'center',
    padding: '1rem',
    width: '100%'
  }}>
    <div style={{
      maxWidth: '400px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.5rem'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))',
        border: '3px solid rgba(255, 215, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px'
      }}>
        ✨
      </div>

      <div>
        <h3 style={{
          color: '#FFD700',
          fontSize: '1.4rem',
          fontFamily: "'Playfair Display', serif",
          margin: '0 0 0.8rem 0',
          letterSpacing: '1px',
          textShadow: '0 0 15px rgba(255, 215, 0, 0.5)'
        }}>
          Create Your Own Character
        </h3>
        
        <p style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '0.9rem',
          lineHeight: 1.5,
          margin: '0 0 1.5rem 0',
          maxWidth: '300px'
        }}>
          Design a custom AI character with unique personality, expertise, and backstory.
        </p>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem',
        width: '100%',
        marginBottom: '1.5rem'
      }}>
        {[
          { icon: '🎭', title: 'Custom Personality' },
          { icon: '📚', title: 'Expert Knowledge' },
          { icon: '🏛️', title: 'Historical Context' }
        ].map((feature, index) => (
          <div key={index} style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '8px',
            padding: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem'
          }}>
            <div style={{ fontSize: '1.2rem' }}>
              {feature.icon}
            </div>
            <span style={{
              color: '#FFD700',
              fontSize: '0.8rem',
              fontWeight: 600
            }}>
              {feature.title}
            </span>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem',
        width: '100%'
      }}>
        <button
          onClick={onStartFlow}
          style={{
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            border: 'none',
            borderRadius: '20px',
            color: '#000',
            fontSize: '0.9rem',
            fontWeight: 700,
            padding: '0.8rem 1.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: "'Georgia', serif",
            boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
            width: '100%'
          }}
        >
          Start 3-Day Free Trial
        </button>
        
        <button
          style={{
            background: 'transparent',
            border: '2px solid rgba(255, 215, 0, 0.5)',
            borderRadius: '20px',
            color: '#FFD700',
            fontSize: '0.9rem',
            fontWeight: 600,
            padding: '0.8rem 1.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: "'Georgia', serif",
            width: '100%'
          }}
        >
          Learn More
        </button>
      </div>

      <p style={{
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '0.75rem',
        margin: '0.5rem 0 0 0',
        fontStyle: 'italic'
      }}>
        No credit card required • Cancel anytime
      </p>
    </div>
  </div>
);

const FreeDesktopMyCharacters = ({ onStartFlow }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    textAlign: 'center',
    padding: '2rem'
  }}>
    <div style={{
      maxWidth: '500px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2rem'
    }}>
      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))',
        border: '3px solid rgba(255, 215, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '48px',
        marginBottom: '1rem'
      }}>
        ✨
      </div>

      <div>
        <h3 style={{
          color: '#FFD700',
          fontSize: '1.8rem',
          fontFamily: "'Playfair Display', serif",
          margin: '0 0 1rem 0',
          letterSpacing: '1px',
          textShadow: '0 0 15px rgba(255, 215, 0, 0.5)'
        }}>
          Create Your Own Character
        </h3>
        
        <p style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '1.1rem',
          lineHeight: 1.6,
          margin: '0 0 2rem 0',
          maxWidth: '400px'
        }}>
          Design a custom AI character with unique personality, expertise, and backstory. 
          From historical figures to original creations - bring your vision to life.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        width: '100%',
        marginBottom: '2rem'
      }}>
        {[
          { icon: '🎭', title: 'Custom Personality', desc: 'Define unique traits and speaking style' },
          { icon: '📚', title: 'Expert Knowledge', desc: 'Specialized in any domain you choose' },
          { icon: '🏛️', title: 'Historical Context', desc: 'Set in any time period or culture' }
        ].map((feature, index) => (
          <div key={index} style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              {feature.icon}
            </div>
            <h4 style={{
              color: '#FFD700',
              fontSize: '0.9rem',
              margin: '0 0 0.5rem 0',
              fontWeight: 600
            }}>
              {feature.title}
            </h4>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.8rem',
              margin: 0,
              lineHeight: 1.4
            }}>
              {feature.desc}
            </p>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <button
          onClick={onStartFlow}
          style={{
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            border: 'none',
            borderRadius: '25px',
            color: '#000',
            fontSize: '1rem',
            fontWeight: 700,
            padding: '1rem 2rem',
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
          Start 3-Day Free Trial
        </button>
        
        <button
          style={{
            background: 'transparent',
            border: '2px solid rgba(255, 215, 0, 0.5)',
            borderRadius: '25px',
            color: '#FFD700',
            fontSize: '1rem',
            fontWeight: 600,
            padding: '1rem 2rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: "'Georgia', serif"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
          }}
        >
          Learn More
        </button>
      </div>

      <p style={{
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '0.85rem',
        margin: '1rem 0 0 0',
        fontStyle: 'italic'
      }}>
        No credit card required • Cancel anytime
      </p>
    </div>
  </div>
);

const TrialActiveMobileMyCharacters = ({ characters, onStartChat, onCreateCharacter, canStartFlow }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1rem',
    width: '100%'
  }}>
    {characters.length === 0 ? (
      <div style={{
        maxWidth: '300px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(255, 215, 0, 0.1)',
          border: '2px solid rgba(255, 215, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px'
        }}>
          🎨
        </div>

        <div>
          <h3 style={{
            color: '#FFD700',
            fontSize: '1.3rem',
            margin: '0 0 0.8rem 0',
            fontFamily: "'Playfair Display', serif"
          }}>
            Ready to Create?
          </h3>
          
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.9rem',
            lineHeight: 1.5,
            margin: '0 0 1.5rem 0'
          }}>
            You have trial access! Create your first custom character.
          </p>
        </div>

        <button
          onClick={onCreateCharacter}
          disabled={!canStartFlow}
          style={{
            background: canStartFlow 
              ? 'linear-gradient(135deg, #FFD700, #FFA500)' 
              : 'rgba(128, 128, 128, 0.3)',
            border: 'none',
            borderRadius: '20px',
            color: canStartFlow ? '#000' : 'rgba(255, 255, 255, 0.5)',
            fontSize: '1rem',
            fontWeight: 700,
            padding: '0.8rem 1.5rem',
            cursor: canStartFlow ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            fontFamily: "'Georgia', serif",
            boxShadow: canStartFlow ? '0 4px 15px rgba(255, 215, 0, 0.3)' : 'none',
            width: '100%',
            opacity: canStartFlow ? 1 : 0.6
          }}
        >
          Create Your Character
        </button>
      </div>
    ) : (
      <div style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        marginTop: '1rem',
      }}>
        {characters.map((character, index) => (
          <div
            key={character.id}
            onClick={() => onStartChat(character.character_key)}
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
              flexShrink: 0
            }}>
              <img
                src={character.avatar_url || '/images/default-character.jpg'}
                alt={character.display_name}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover'
                }}
                onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
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
                {character.display_name}
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
                {character.short_description}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const TrialActiveDesktopMyCharacters = ({ characters, onStartChat, onCreateCharacter, canStartFlow }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem'
  }}>
    {characters.length === 0 ? (
      <div style={{
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'rgba(255, 215, 0, 0.1)',
          border: '2px solid rgba(255, 215, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px'
        }}>
          🎨
        </div>

        <div>
          <h3 style={{
            color: '#FFD700',
            fontSize: '1.5rem',
            margin: '0 0 1rem 0',
            fontFamily: "'Playfair Display', serif"
          }}>
            Ready to Create?
          </h3>
          
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '1rem',
            lineHeight: 1.6,
            margin: '0 0 2rem 0'
          }}>
            You have trial access! Create your first custom character using our templates 
            and bring your unique vision to life.
          </p>
        </div>

        <button
          onClick={onCreateCharacter}
          disabled={!canStartFlow}
          style={{
            background: canStartFlow 
              ? 'linear-gradient(135deg, #FFD700, #FFA500)' 
              : 'rgba(128, 128, 128, 0.3)',
            border: 'none',
            borderRadius: '25px',
            color: canStartFlow ? '#000' : 'rgba(255, 255, 255, 0.5)',
            fontSize: '1.1rem',
            fontWeight: 700,
            padding: '1rem 2rem',
            cursor: canStartFlow ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            fontFamily: "'Georgia', serif",
            boxShadow: canStartFlow ? '0 4px 15px rgba(255, 215, 0, 0.3)' : 'none',
            opacity: canStartFlow ? 1 : 0.6
          }}
          onMouseEnter={(e) => {
            if (canStartFlow) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (canStartFlow) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.3)';
            }
          }}
        >
          Create Your Character
        </button>

        <p style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '0.8rem',
          margin: 0
        }}>
          1 character included with your trial access
        </p>
      </div>
    ) : (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto',
        paddingRight: '0.5rem',
        width: '100%'
      }}>
        {characters.map((character, index) => (
          <div
            key={character.id}
            onClick={() => onStartChat(character.character_key)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              borderRadius: '16px',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
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
                src={character.avatar_url || '/images/default-character.jpg'}
                alt={character.display_name}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover'
                }}
                onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
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
                {character.display_name}
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
                {character.short_description}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const PendingApprovalMobileMyCharacters = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    textAlign: 'center',
    padding: '1rem'
  }}>
    <div style={{
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      background: 'rgba(255, 165, 0, 0.1)',
      border: '2px solid rgba(255, 165, 0, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '32px',
      marginBottom: '1.5rem'
    }}>
      ⏳
    </div>

    <h3 style={{
      color: '#FFA500',
      fontSize: '1.3rem',
      margin: '0 0 1rem 0',
      fontFamily: "'Playfair Display', serif"
    }}>
      Character Under Review
    </h3>
    
    <p style={{
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '0.9rem',
      lineHeight: 1.5,
      margin: '0 0 1.5rem 0',
      maxWidth: '300px'
    }}>
      Your character is being reviewed by our team. You'll receive an email notification when it's approved, usually within 24-48 hours.
    </p>

    <div style={{
      background: 'rgba(255, 165, 0, 0.1)',
      border: '1px solid rgba(255, 165, 0, 0.3)',
      borderRadius: '8px',
      padding: '1rem',
      textAlign: 'center',
      maxWidth: '300px'
    }}>
      <p style={{
        color: 'rgba(255, 255, 255, 0.9)',
        margin: 0,
        fontSize: '0.85rem'
      }}>
        While you wait, explore our existing characters to start conversations!
      </p>
    </div>
  </div>
);

const PendingApprovalDesktopMyCharacters = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    textAlign: 'center',
    padding: '2rem'
  }}>
    <div style={{
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      background: 'rgba(255, 165, 0, 0.1)',
      border: '2px solid rgba(255, 165, 0, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '40px',
      marginBottom: '2rem'
    }}>
      ⏳
    </div>

    <h3 style={{
      color: '#FFA500',
      fontSize: '1.5rem',
      margin: '0 0 1rem 0',
      fontFamily: "'Playfair Display', serif"
    }}>
      Character Under Review
    </h3>
    
    <p style={{
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '1rem',
      lineHeight: 1.6,
      margin: '0 0 2rem 0',
      maxWidth: '400px'
    }}>
      Your character is being reviewed by our moderation team. You'll receive an email notification when it's approved, usually within 24-48 hours.
    </p>

    <div style={{
      background: 'rgba(255, 165, 0, 0.1)',
      border: '1px solid rgba(255, 165, 0, 0.3)',
      borderRadius: '12px',
      padding: '1.5rem',
      textAlign: 'center',
      maxWidth: '400px'
    }}>
      <p style={{
        color: 'rgba(255, 255, 255, 0.9)',
        margin: 0,
        fontSize: '0.9rem'
      }}>
        While you wait, explore our existing character library to start engaging conversations!
      </p>
    </div>
  </div>
);

const TrialExpiredMobileMyCharacters = ({ characters, onStartChat }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1rem',
    width: '100%'
  }}>
    {characters.length > 0 ? (
      <>
        <div style={{
          background: 'rgba(255, 165, 0, 0.1)',
          border: '1px solid rgba(255, 165, 0, 0.3)',
          borderRadius: '8px',
          padding: '1rem',
          textAlign: 'center',
          marginBottom: '1rem',
          width: '100%'
        }}>
          <p style={{
            color: '#FFA500',
            fontSize: '0.85rem',
            margin: 0
          }}>
            Trial expired. Upgrade to continue creating new characters.
          </p>
        </div>

        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem'
        }}>
          {characters.map((character) => (
            <div
              key={character.id}
              onClick={() => onStartChat(character.character_key)}
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
                flexShrink: 0
              }}>
                <img
                  src={character.avatar_url || '/images/default-character.jpg'}
                  alt={character.display_name}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover'
                  }}
                  onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
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
                  {character.display_name}
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
                  {character.short_description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </>
    ) : (
      <div style={{
        textAlign: 'center',
        padding: '2rem 1rem'
      }}>
        <h3 style={{
          color: '#FFA500',
          fontSize: '1.2rem',
          margin: '0 0 1rem 0'
        }}>
          Trial Expired
        </h3>
        <p style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '0.9rem',
          margin: 0
        }}>
          Upgrade to premium to create custom characters.
        </p>
      </div>
    )}
  </div>
);

const TrialExpiredDesktopMyCharacters = ({ characters, onStartChat }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem',
    width: '100%'
  }}>
    {characters.length > 0 ? (
      <>
        <div style={{
          background: 'rgba(255, 165, 0, 0.1)',
          border: '1px solid rgba(255, 165, 0, 0.3)',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'center',
          marginBottom: '2rem',
          width: '100%',
          maxWidth: '500px'
        }}>
          <p style={{
            color: '#FFA500',
            fontSize: '1rem',
            margin: 0
          }}>
            Trial expired. Upgrade to continue creating new characters and unlock premium features.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          maxHeight: 'calc(100vh - 300px)',
          overflowY: 'auto',
          paddingRight: '0.5rem',
          width: '100%'
        }}>
          {characters.map((character, index) => (
            <div
              key={character.id}
              onClick={() => onStartChat(character.character_key)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                borderRadius: '16px',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
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
                  src={character.avatar_url || '/images/default-character.jpg'}
                  alt={character.display_name}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover'
                  }}
                  onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
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
                  {character.display_name}
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
                  {character.short_description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </>
    ) : (
      <div style={{
        textAlign: 'center',
        padding: '4rem 2rem'
      }}>
        <h3 style={{
          color: '#FFA500',
          fontSize: '1.5rem',
          margin: '0 0 1rem 0',
          fontFamily: "'Playfair Display', serif"
        }}>
          Trial Expired
        </h3>
        <p style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '1rem',
          margin: 0
        }}>
          Upgrade to premium to create custom characters and unlock advanced features.
        </p>
      </div>
    )}
  </div>
);

// Premium Active components are similar to Trial Active but without trial messaging
const PremiumActiveMobileMyCharacters = TrialActiveMobileMyCharacters;
const PremiumActiveDesktopMyCharacters = TrialActiveDesktopMyCharacters;

export default ChatLauncherPage;