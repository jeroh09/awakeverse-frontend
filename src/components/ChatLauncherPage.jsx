// src/pages/ChatLauncherPage.jsx - Complete implementation with character status handling
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import useInteractedCharacters from '../hooks/useInteractedCharacters';
import CharacterDetailPanel from '../components/CharacterDetailPanel/CharacterDetailPanel';
import TemplateGallery from '../components/TemplateGallery';
import CharacterBuilder from '../components/CharacterBuilder';
import CharacterCreationSuccess from '../components/CharacterCreationSuccess';

// Import helper components
import {
  CategoryCard,
  CharacterCard,
  MyCharactersPanel,
  PersonalizedSection,
  CharacterStatusModal,
  categoryRepresentatives
} from '../components/ChatLauncherHelpers';

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

const ChatLauncherPage = ({ onStartChat }) => {
  const { user } = useUser();
  const { token } = useAuth();

  // Character creation flow state
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // NEW: Premium character state management
  const [userCharacters, setUserCharacters] = useState([]);
  const [charactersLoading, setCharactersLoading] = useState(false);
  const [charactersError, setCharactersError] = useState(null);

  // NEW: Character status modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatusCharacter, setSelectedStatusCharacter] = useState(null);

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

  // NEW: Load user's custom characters
  const loadUserCharacters = useCallback(async () => {
    if (!token) return;

    try {
      setCharactersLoading(true);
      setCharactersError(null);

      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/premium/characters`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('User characters loaded:', data);
        setUserCharacters(data.characters || []);
      } else {
        console.warn('Failed to load user characters:', response.status);
        setUserCharacters([]);
      }
    } catch (error) {
      console.error('Error loading user characters:', error);
      setCharactersError('Failed to load your characters');
      setUserCharacters([]);
    } finally {
      setCharactersLoading(false);
    }
  }, [token]);

  // Load user characters on mount and token change
  useEffect(() => {
    loadUserCharacters();
  }, [loadUserCharacters]);

  // Enhanced categories with user characters
  const enhancedCategories = useMemo(() => {
    const baseCategories = [...characterCategories];
    
    // Find and update my_characters category
    const myCharactersIndex = baseCategories.findIndex(cat => cat.key === 'my_characters');
    if (myCharactersIndex !== -1) {
      baseCategories[myCharactersIndex] = {
        ...baseCategories[myCharactersIndex],
        characters: userCharacters.map(char => ({
          key: char.character_key,
          name: char.display_name,
          description: char.short_description,
          thumbnailUrl: char.avatar_url || '/images/default-character.jpg',
          status: char.status,
          rejection_reason: char.rejection_reason
        })),
        characterCount: userCharacters.length,
        pendingCount: userCharacters.filter(c => c.status === 'pending').length,
        rejectedCount: userCharacters.filter(c => c.status === 'rejected').length,
        approvedCount: userCharacters.filter(c => c.status === 'approved').length
      };
    }
    
    return baseCategories;
  }, [userCharacters]);

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

  // ENHANCED: Character selection with status checking
  const handleCharacterSelect = useCallback((character) => {
    // Check if this is a custom character (user_xxx format)
    const isCustomCharacter = character.key?.startsWith('user_');
    
    if (isCustomCharacter) {
      // For custom characters, check status before allowing chat
      const characterStatus = character.status || 'approved';
      
      if (characterStatus === 'pending' || characterStatus === 'rejected') {
        // Block chat access and show status modal
        setSelectedStatusCharacter({
          ...character,
          status: characterStatus,
          rejection_reason: character.rejection_reason
        });
        setShowStatusModal(true);
        return;
      }
    }
    
    // Allow chat for approved custom characters and all existing characters
    trackInteraction(character.key);
    setSelectedChar({
      key: character.key,
      name: character.name,
      thumbnailUrl: character.thumbnailUrl,
      description: character.description,
      category: character.category,
      status: character.status
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

  // NEW: Status modal handlers
  const handleStatusModalClose = useCallback(() => {
    setShowStatusModal(false);
    setSelectedStatusCharacter(null);
  }, []);

  const handleCreateNewCharacter = useCallback(() => {
    setShowStatusModal(false);
    setSelectedStatusCharacter(null);
    setShowTemplates(true);
  }, []);

  const handleUpgradeFlow = useCallback(() => {
    setShowStatusModal(false);
    setSelectedStatusCharacter(null);
    window.location.href = '/subscribe';
  }, []);

  // Character creation handlers
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
    // Reload user characters to show the new one
    loadUserCharacters();
  }, [loadUserCharacters]);

  const handleCloseCreationFlow = useCallback(() => {
    console.log('Closing character creation flow');
    setShowTemplates(false);
    setShowBuilder(false);
    setShowSuccess(false);
    setSelectedTemplate(null);
  }, []);

  const currentPlaceholder = ORACLE_PROMPTS[placeholderIndex];

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
                    marginBottom: index < searchResults.length - 1 ? '0.5rem' : 0,
                    position: 'relative'
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
                      border: '2px solid rgba(255, 215, 0, 0.3)',
                      opacity: character.status === 'rejected' ? 0.6 : 1
                    }}
                    onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: character.status === 'approved' ? '#FFD700' : '#FFA500',
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
                userCharacters={userCharacters}
                charactersLoading={charactersLoading}
                charactersError={charactersError}
                onCreateCharacter={handleCreateCharacterClick}
                onCharacterSelect={handleCharacterSelect}
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
                    showStatusIndicator={character.key?.startsWith('user_')}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Character Detail Modal (Mobile) */}
        {selectedChar && (
          <CharacterDetailPanel
            character={selectedChar}
            onStartChat={handleStartChatFromSelection}
            onClose={() => setSelectedChar(null)}
            isMobile={true}
          />
        )}

        {/* Character Status Modal */}
        {showStatusModal && selectedStatusCharacter && (
          <CharacterStatusModal
            character={selectedStatusCharacter}
            onClose={handleStatusModalClose}
            onCreateNew={handleCreateNewCharacter}
            onUpgrade={handleUpgradeFlow}
          />
        )}
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

          {/* Search Results (Desktop) */}
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
                    marginBottom: index < searchResults.length - 1 ? '0.5rem' : 0,
                    position: 'relative'
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
                      border: '2px solid rgba(255, 215, 0, 0.3)',
                      opacity: character.status === 'rejected' ? 0.6 : 1
                    }}
                    onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 600, 
                      color: character.status === 'approved' ? '#FFD700' : '#FFA500', 
                      marginBottom: '0.25rem' 
                    }}>
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
            zIndex: 3,
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
                  userCharacters={userCharacters}
                  charactersLoading={charactersLoading}
                  charactersError={charactersError}
                  onCreateCharacter={handleCreateCharacterClick}
                  onCharacterSelect={handleCharacterSelect}
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
                      showStatusIndicator={character.key?.startsWith('user_')}
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
        <CharacterDetailPanel
          character={selectedChar}
          onStartChat={handleStartChatFromSelection}
          onClose={() => setSelectedChar(null)}
          isMobile={false}
        />
      )}

      {/* Character Status Modal */}
      {showStatusModal && selectedStatusCharacter && (
        <CharacterStatusModal
          character={selectedStatusCharacter}
          onClose={handleStatusModalClose}
          onCreateNew={handleCreateNewCharacter}
          onUpgrade={handleUpgradeFlow}
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

export default ChatLauncherPage;