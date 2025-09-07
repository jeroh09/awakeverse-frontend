// src/pages/ChatLauncherPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { characterCategories } from '../data/characterCategories';
import useInteractedCharacters from '../hooks/useInteractedCharacters';
import usePremiumCharacters from '../hooks/usePremiumCharacters';
import TemplateGallery from '../components/TemplateGallery';
import CharacterBuilder from '../components/CharacterBuilder';
import { usePremiumCharacterFlow } from '../hooks/usePremiumCharacterFlow';

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
  'warlords': '/images/sun_tzu.jpg',
  'pathfinders': '/images/christopher_columbus.jpg',
  'performers': '/images/harry_houdini.jpg',
  'my_characters': '/images/default-character.jpg' // My Characters representative
};

const SplitScreenLauncher = ({ onStartChat }) => {
  const { token } = useAuth();

  try {
    const premiumFlow = usePremiumCharacterFlow();
    console.log('🧪 Premium flow context available:', !!premiumFlow);
    console.log('🧪 Current view:', premiumFlow.currentView);
  } catch (error) {
    console.error('❌ Premium flow context error:', error);
  }

  const {
    isPremium,
    approvedCharacters,
    loading: premiumLoading,
    premiumStatus,
    characterTemplates,
    error: premiumError,
    userCharacters,  // ✅ REQUIRED HOOK VALUE
    grantTrial,
    canCreateCharacter,
    characterCount,
    refresh,
  } = usePremiumCharacters();

  const { user } = useUser();
  const {
    recentCharacters,
    shouldShowForYou,
    trackInteraction,
    hasActiveConversations
  } = useInteractedCharacters();

  const {
    showTemplateGallery,
    showCharacterBuilder,
    selectedTemplate,
    startTemplateFlow
  } = usePremiumCharacterFlow();

  // --- Debug helpers preserved (unchanged) ---
  const PremiumStatusDebugger = () => {
    const { user } = useUser();
    const {
      isPremium,
      loading,
      error,
      premiumStatus,
      userCharacters,
      characterCount,
      canCreateCharacter,
      grantTrial,
      refresh
    } = usePremiumCharacters();

    const [testResults, setTestResults] = useState({});
    const [testing, setTesting] = useState(false);

    const runAPITests = async () => {
      setTesting(true);
      const results = {};
      try {
        results.statusAPI = {
          userId: user?.id,
          isPremium,
          loading,
          error,
          premiumStatus: premiumStatus ? 'loaded' : 'null',
          characterCount
        };

        results.characterLimits = {
          canCreateCharacter,
          currentCount: characterCount,
          hasCharacters: userCharacters?.length > 0
        };

        if (!isPremium && !loading) {
          try {
            results.trialFunction = typeof grantTrial === 'function' ? 'available' : 'missing';
          } catch (e) {
            results.trialFunction = `error: ${e.message}`;
          }
        }

        setTestResults(results);
        console.log('🧪 API Test Results:', results);
      } catch (error) {
        console.error('🧪 API Test Failed:', error);
        setTestResults({ error: error.message });
      } finally {
        setTesting(false);
      }
    };

    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.9)',
        color: '#FFD700',
        padding: '1rem',
        borderRadius: '8px',
        fontSize: '0.8rem',
        maxWidth: '300px',
        zIndex: 9999,
        border: '1px solid #FFD700'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Premium API Debug Panel
        </div>

        <button
          onClick={runAPITests}
          disabled={testing}
          style={{
            background: '#FFD700',
            color: '#000',
            border: 'none',
            padding: '0.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '0.5rem'
          }}
        >
          {testing ? 'Testing...' : 'Run API Tests'}
        </button>

        <div style={{ fontSize: '0.7rem' }}>
          <div>User: {user?.id || 'Not loaded'}</div>
          <div>Premium: {loading ? 'Loading...' : isPremium ? 'Yes' : 'No'}</div>
          <div>Characters: {characterCount}</div>
          <div>Can Create: {canCreateCharacter ? 'Yes' : 'No'}</div>
          {error && <div style={{ color: '#ff6b6b' }}>Error: {error}</div>}
        </div>

        {Object.keys(testResults).length > 0 && (
          <pre style={{
            marginTop: '0.5rem',
            fontSize: '0.6rem',
            background: 'rgba(255,255,255,0.1)',
            padding: '0.5rem',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '150px'
          }}>
            {JSON.stringify(testResults, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  const SimpleDebugTest = () => {
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'red',
        color: 'white',
        padding: '10px',
        zIndex: 9999
      }}>
        DEBUG TEST VISIBLE
      </div>
    );
  };

  // --- Local state ---
  const [inputValue, setInputValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedChar, setSelectedChar] = useState(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile viewport
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

  // Enhanced categories (keep as-is: still uses approved for the category listing)
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
    console.log('🎭 Enhanced categories updated:', {
      totalCategories: allCategories.length,
      myCharactersIndex: myCharIndex,
      approvedCharactersCount: approvedCharacters.length,
      myCharactersCharacterCount: approvedCharacters.length
    });
    return allCategories;
  }, [approvedCharacters]);

  // Search (kept)
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
    trackInteraction(character.key);
    setSelectedChar({
      key: character.key,
      name: character.name,
      thumbnailUrl: character.thumbnailUrl,
      description: character.description,
      category: character.category
    });
  };

  const handleRecentCharacterSelect = (recentCharacter) => {
    trackInteraction(recentCharacter.character);
    onStartChat(recentCharacter.character);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowResults(false);
    setInputValue('');
  };

  const handleBackToCategories = () => setSelectedCategory(null);

  const currentPlaceholder = ORACLE_PROMPTS[placeholderIndex];

  // ========== MOBILE LAYOUT ==========
  if (isMobile) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        padding: '1rem',
        fontFamily: "'Georgia', serif",
        textTransform: 'none',
        background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 25%, #2C1810 50%, #0F1A2E 75%, #0B1426 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>

        {/* (Kept) Quick mobile banner test */}
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'red',
          color: 'white',
          padding: '20px',
          zIndex: 999999,
          fontSize: '16px'
        }}>
          MOBILE TEST
        </div>

        {/* Welcome */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', width: '100%', maxWidth: '500px' }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            textTransform: 'none',
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

        {/* Search */}
        <div style={{ width: '100%', maxWidth: '500px', position: 'relative', marginBottom: '1rem' }}>
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
              fontFamily: "'Georgia', serif",
              textTransform: 'none'
            }}
          />

          {/* Search dropdown (kept) */}
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
              <p style={{ color: 'rgba(255, 215, 0, 0.8)', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                No matches for "{inputValue}"
              </p>
              <small style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                Try searching for character names or themes
              </small>
            </div>
          )}
        </div>

        {/* Personalized Section (kept reference; if your component exists it will render) */}
        {shouldShowForYou && (
          <PersonalizedSection
            characters={recentCharacters}
            onCharacterSelect={handleRecentCharacterSelect}
            hasActiveConversations={hasActiveConversations}
            isMobile={true}
          />
        )}

        {/* Category tiles */}
        {!selectedCategory ? (
          <div style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
            marginTop: '1rem',
          }}>
            {enhancedCategories.map((category) => (
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
                  border: category.key === 'my_characters'
                    ? (isPremium ? '3px solid rgba(255, 215, 0, 0.4)' : '3px solid rgba(128, 128, 128, 0.4)')
                    : '3px solid rgba(255, 215, 0, 0.4)',
                  transition: 'all 0.3s ease',
                  background: 'rgba(0,0,0,0.3)',
                  position: 'relative'
                }}>
                  {category.key === 'my_characters' && !isPremium && (
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
                      ★
                    </div>
                  )}
                  {category.key === 'my_characters' ? (
                    premiumLoading ? (
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
                    ) : approvedCharacters.length > 0 ? (
                      <img
                        src={approvedCharacters[0].thumbnailUrl || '/images/default-character.jpg'}
                        alt="My Character"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(20%) contrast(1.1)' }}
                        onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        color: isPremium ? '#FFD700' : 'rgba(128, 128, 128, 0.7)'
                      }}>👤</div>
                    )
                  ) : (
                    <img
                      src={categoryRepresentatives[category.key]}
                      alt={category.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(20%) contrast(1.1)' }}
                      onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
                    />
                  )}
                </div>

                <h3 style={{
                  color: category.key === 'my_characters' && !isPremium ? 'rgba(128, 128, 128, 0.8)' : '#FFD700',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  margin: '0 0 0.3rem 0',
                  letterSpacing: '0.5px',
                  fontFamily: "'Georgia', serif",
                  textTransform: 'none',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  lineHeight: 1.1
                }}>
                  {category.title}
                </h3>

                <span style={{
                  color: category.key === 'my_characters' && !isPremium
                    ? 'rgba(128, 128, 128, 0.6)'
                    : 'rgba(255, 215, 0, 0.7)',
                  fontSize: '0.65rem',
                  background: category.key === 'my_characters' && !isPremium
                    ? 'rgba(128, 128, 128, 0.1)'
                    : 'rgba(255, 215, 0, 0.1)',
                  padding: '0.15rem 0.4rem',
                  borderRadius: '8px',
                  border: category.key === 'my_characters' && !isPremium
                    ? '1px solid rgba(128, 128, 128, 0.2)'
                    : '1px solid rgba(255, 215, 0, 0.2)'
                }}>
                  {category.key === 'my_characters'
                    ? (premiumLoading ? 'Loading...' :
                      !isPremium ? 'Premium' :
                      approvedCharacters.length > 0 ? `${approvedCharacters.length} custom` : 'Create')
                    : `${category.characters.length} guides`
                  }
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
                fontFamily: "'Playfair Display', serif",
                textTransform: 'none',
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
                  fontFamily: "'Georgia', serif",
                  textTransform: 'none'
                }}
              >
                ← Back
              </button>
            </div>

            {/* =============== MOBILE: My Characters PANEL (REPLACED) =============== */}
            {selectedCategory.key === 'my_characters' ? (
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
                {premiumLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '40px', height: '40px',
                      border: '3px solid rgba(255, 215, 0, 0.3)',
                      borderTop: '3px solid #FFD700',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ color: 'rgba(255, 215, 0, 0.8)', fontSize: '1rem', margin: 0 }}>
                      Loading your characters...
                    </p>
                  </div>
                ) : !isPremium ? (
                  <div style={{
                    maxWidth: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.5rem'
                  }}>
                    {/* Keep existing free user CTA content unchanged */}
                  </div>
                ) : userCharacters.length === 0 ? (
                  <div style={{
                    maxWidth: '300px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.5rem'
                  }}>
                    {/* Keep existing no characters content unchanged */}
                  </div>
                ) : (
                  <div style={{
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1rem',
                    marginTop: '1rem',
                  }}>
                    {userCharacters.map((character, index) => (
                      <div
                        key={character.id}
                        onClick={() => {
                          if (character.status === 'approved') {
                            console.log('Chat with character:', character.character_key);
                            onStartChat(character.character_key);
                          }
                        }}
                        style={{
                          background: character.status === 'approved'
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(255, 165, 0, 0.05)',
                          border: character.status === 'approved'
                            ? '1px solid rgba(255, 215, 0, 0.2)'
                            : '1px solid rgba(255, 165, 0, 0.3)',
                          borderRadius: '16px',
                          padding: '1rem',
                          cursor: character.status === 'approved' ? 'pointer' : 'default',
                          transition: 'all 0.3s ease',
                          opacity: character.status === 'approved' ? 1 : 0.8,
                          minHeight: '180px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          position: 'relative'
                        }}
                      >
                        {/* Status indicator */}
                        <div style={{
                          position: 'absolute',
                          top: '0.3rem',
                          right: '0.3rem',
                          background: character.status === 'approved' ? '#00FF88' :
                            character.status === 'pending' ? '#FFA500' : '#ff6b6b',
                          color: '#000',
                          fontSize: '0.5rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.4rem',
                          borderRadius: '8px',
                          textTransform: 'uppercase'
                        }}>
                          {character.status}
                        </div>

                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden',
                          marginBottom: '0.5rem',
                          border: character.status === 'approved'
                            ? '2px solid rgba(255, 215, 0, 0.3)'
                            : '2px solid rgba(255, 165, 0, 0.3)',
                          flexShrink: 0
                        }}>
                          <img
                            src={character.thumbnailUrl || character.avatar_url || '/images/default-character.jpg'}
                            alt={character.display_name}
                            style={{
                              width: '100%', height: '100%', objectFit: 'cover',
                              filter: character.status === 'approved' ? 'none' : 'grayscale(30%)'
                            }}
                            onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
                          />
                        </div>

                        <div style={{ textAlign: 'center' }}>
                          <h3 style={{
                            color: character.status === 'approved' ? '#FFD700' : '#FFA500',
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

                          {character.status === 'pending' && (
                            <p style={{
                              color: '#FFA500',
                              fontSize: '0.6rem',
                              margin: '0.3rem 0 0 0',
                              fontStyle: 'italic'
                            }}>
                              Awaiting approval...
                            </p>
                          )}

                          {character.status === 'rejected' && (
                            <p style={{
                              color: '#ff6b6b',
                              fontSize: '0.6rem',
                              margin: '0.3rem 0 0 0',
                              fontStyle: 'italic'
                            }}>
                              Needs revision
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Regular categories (kept)
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
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
            )}
          </>
        )}

        {/* Character Detail Modal (Mobile) (kept) */}
        {selectedChar && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, width: '100%', height: '100%',
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
                  width: '80px', height: '80px', borderRadius: '50%',
                  objectFit: 'cover', border: '3px solid rgba(255, 215, 0, 0.4)', marginBottom: '1rem'
                }}
                onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
              />

              <h2 style={{ color: '#FFD700', fontSize: '1.3rem', fontWeight: 600, margin: '0 0 0.5rem 0', letterSpacing: '1px' }}>
                {selectedChar.name}
              </h2>

              <p style={{ color: 'rgba(255, 215, 0, 0.7)', fontSize: '0.8rem', textTransform: 'none', letterSpacing: '0.5px', margin: '0 0 1rem 0' }}>
                {selectedChar.category}
              </p>

              <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
                {selectedChar.description}
              </p>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    trackInteraction(selectedChar.key);
                    onStartChat(selectedChar.key);
                  }}
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
                    fontFamily: "'Georgia', serif",
                    textTransform: 'none'
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
                    fontFamily: "'Georgia', serif",
                    textTransform: 'none'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modals (kept) */}
        {showTemplateGallery && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            zIndex: 3000, background: 'rgba(0, 0, 0, 0.95)', overflowY: 'auto'
          }}>
            <TemplateGallery userPremiumStatus={premiumStatus} />
          </div>
        )}

        {showCharacterBuilder && selectedTemplate && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            zIndex: 3000, background: 'rgba(0, 0, 0, 0.95)'
          }}>
            <CharacterBuilder userPremiumStatus={premiumStatus} />
          </div>
        )}
      </div>
    );
  }

  // ========== DESKTOP LAYOUT ==========
  console.log('Debug state:', { showTemplateGallery, showCharacterBuilder, selectedTemplate });

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      fontFamily: "'Georgia', serif",
      textTransform: 'none',
      background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 25%, #2C1810 50%, #0F1A2E 75%, #0B1426 100%)',
      overflow: 'hidden'
    }}>
      {/* Debug panel (kept) */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.9)',
        color: '#FFD700',
        padding: '1rem',
        borderRadius: '8px',
        fontSize: '0.8rem',
        maxWidth: '300px',
        zIndex: 9999,
        border: '1px solid #FFD700'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Premium API Debug Panel
        </div>
        <div style={{ fontSize: '0.7rem' }}>
          <div>User ID: {user?.id || 'Not loaded'}</div>
          <div>Premium: {premiumLoading ? 'Loading...' : isPremium ? 'Yes' : 'No'}</div>
          <div>Characters: {approvedCharacters?.length || 0}</div>
          <div>Templates: {characterTemplates?.length || 0}</div>
          <div>Status: {premiumStatus?.subscription_status || 'Unknown'}</div>
          <div>Error: {premiumError || 'None'}</div>
        </div>
        <button
          onClick={() => {
            console.log('Testing premium APIs...');
            console.log('Premium Status:', premiumStatus);
            console.log('Is Premium:', isPremium);
            console.log('Can Create Character:', canCreateCharacter);
            console.log('Character Count:', characterCount);
            console.log('Character Templates Count:', characterTemplates?.length);
            console.log('Character Templates Full Data:', JSON.stringify(characterTemplates, null, 2));
            console.log('User Characters:', userCharacters);
            console.log('Premium Error:', premiumError);
            console.log('Grant Trial Function:', typeof grantTrial === 'function');
            const testTemplateAPI = async () => {
              try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/premium/test-templates/44`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                const result = await response.text();
                console.log('Manual template test result:', result);
              } catch (error) {
                console.log('Manual template test failed:', error.message);
              }
            };
            testTemplateAPI();
          }}
          style={{
            background: '#FFD700',
            color: '#000',
            border: 'none',
            padding: '0.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '0.5rem',
            fontSize: '0.7rem'
          }}
        >
          Test All APIs
        </button>
      </div>

      {/* LEFT HALF */}
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
        {/* Welcome */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            textTransform: 'none',
            fontSize: '2.5rem',
            background: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)',
            backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent',
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

        {/* Search */}
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
              fontFamily: "'Georgia', serif",
              textTransform: 'none'
            }}
          />

          {/* Search dropdown (kept) */}
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
                      width: '40px', height: '40px', borderRadius: '50%',
                      objectFit: 'cover', border: '2px solid rgba(255, 215, 0, 0.3)'
                    }}
                    onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFD700', marginBottom: '0.25rem' }}>
                      {character.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255, 215, 0, 0.7)', textTransform: 'none', letterSpacing: '0.5px' }}>
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
              left: 0, right: 0,
              background: 'rgba(11, 20, 38, 0.95)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '15px',
              backdropFilter: 'blur(20px)',
              padding: '1rem',
              marginTop: '0.5rem',
              textAlign: 'center',
              zIndex: 1000
            }}>
              <p style={{ color: 'rgba(255, 215, 0, 0.8)', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                No matches for "{inputValue}"
              </p>
              <small style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                Try searching for character names or themes
              </small>
            </div>
          )}
        </div>

        {/* Personalized Section (kept) */}
        {shouldShowForYou && (
          <PersonalizedSection
            characters={recentCharacters}
            onCharacterSelect={handleRecentCharacterSelect}
            hasActiveConversations={hasActiveConversations}
            isMobile={false}
          />
        )}
      </div>

      {/* RIGHT HALF */}
      <div style={{ width: '50%', height: '100%', position: 'relative', perspective: '1000px' }}>
        {/* Categories grid (kept) */}
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
                animation: `categorySlideIn 0.6s ease-out ${index * 0.1}s forwards`,
                minHeight: '150px',
                maxHeight: '200px'
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
                width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', marginBottom: '0.7rem',
                border: category.key === 'my_characters'
                  ? (isPremium ? '3px solid rgba(255, 215, 0, 0.4)' : '3px solid rgba(128, 128, 128, 0.4)')
                  : '3px solid rgba(255, 215, 0, 0.4)',
                transition: 'all 0.3s ease',
                background: 'rgba(0,0,0,0.3)',
                position: 'relative'
              }}>
                {category.key === 'my_characters' && !isPremium && (
                  <div style={{
                    position: 'absolute', top: '-8px', right: '-8px',
                    width: '16px', height: '16px',
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    borderRadius: '50%',
                    fontSize: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#000', fontWeight: 'bold', zIndex: 1
                  }}>★</div>
                )}
                {category.key === 'my_characters' ? (
                  premiumLoading ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{
                        width: '20px', height: '20px',
                        border: '2px solid rgba(255, 215, 0, 0.3)',
                        borderTop: '2px solid #FFD700',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                    </div>
                  ) : approvedCharacters.length > 0 ? (
                    <img
                      src={approvedCharacters[0].thumbnailUrl || '/images/default-character.jpg'}
                      alt="My Character"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(20%) contrast(1.1)' }}
                      onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '24px', color: isPremium ? '#FFD700' : 'rgba(128, 128, 128, 0.7)'
                    }}>👤</div>
                  )
                ) : (
                  <img
                    src={categoryRepresentatives[category.key]}
                    alt={category.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(20%) contrast(1.1)' }}
                    onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
                  />
                )}
              </div>

              <h3 style={{
                color: category.key === 'my_characters' && !isPremium ? 'rgba(128, 128, 128, 0.8)' : '#FFD700',
                fontSize: '0.9rem', fontWeight: 600, margin: '0 0 0.3rem 0',
                letterSpacing: '0.5px', fontFamily: "'Georgia', serif",
                textTransform: 'none', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', lineHeight: 1.1
              }}>
                {category.title}
              </h3>

              <span style={{
                color: category.key === 'my_characters' && !isPremium ? 'rgba(128, 128, 128, 0.6)' : 'rgba(255, 215, 0, 0.7)',
                fontSize: '0.65rem',
                background: category.key === 'my_characters' && !isPremium ? 'rgba(128, 128, 128, 0.1)' : 'rgba(255, 215, 0, 0.1)',
                padding: '0.15rem 0.4rem',
                borderRadius: '8px',
                border: category.key === 'my_characters' && !isPremium ? '1px solid rgba(128, 128, 128, 0.2)' : '1px solid rgba(255, 215, 0, 0.2)'
              }}>
                {category.key === 'my_characters'
                  ? (premiumLoading ? 'Loading...' :
                    !isPremium ? 'Premium' :
                    approvedCharacters.length > 0 ? `${approvedCharacters.length} custom` : 'Create')
                  : `${category.characters.length} guides`
                }
              </span>
            </div>
          ))}
        </div>

        {/* =============== DESKTOP: Characters Panel =============== */}
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
                  textTransform: 'none',
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
                    fontFamily: "'Georgia', serif",
                    textTransform: 'none',
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

              {/* =============== DESKTOP: My Characters PANEL (REPLACED) =============== */}
              {selectedCategory.key === 'my_characters' ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`,
                  gap: '1rem',
                  maxHeight: 'calc(100vh - 200px)',
                  overflowY: 'auto',
                  paddingRight: '0.5rem'
                }}>
                  {userCharacters.map((character, index) => (
                    <div
                      key={character.id}
                      onClick={() => {
                        if (character.status === 'approved') {
                          console.log('Chat with character:', character.character_key);
                          onStartChat(character.character_key);
                        }
                      }}
                      style={{
                        background: character.status === 'approved'
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(255, 165, 0, 0.05)',
                        border: character.status === 'approved'
                          ? '1px solid rgba(255, 215, 0, 0.2)'
                          : '1px solid rgba(255, 165, 0, 0.3)',
                        borderRadius: '16px',
                        padding: '1rem',
                        cursor: character.status === 'approved' ? 'pointer' : 'default',
                        transition: 'all 0.3s ease',
                        opacity: character.status === 'approved' ? 1 : 0.8,
                        animation: `characterSlideIn 0.6s ease-out ${index * 0.05}s forwards`,
                        minHeight: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        if (character.status === 'approved') {
                          e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                          e.currentTarget.style.transform = 'translateY(-6px)';
                          e.currentTarget.style.boxShadow = '0 16px 32px rgba(255, 215, 0, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = character.status === 'approved'
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(255, 165, 0, 0.05)';
                        e.currentTarget.style.borderColor = character.status === 'approved'
                          ? 'rgba(255, 215, 0, 0.2)'
                          : 'rgba(255, 165, 0, 0.3)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Status indicator */}
                      <div style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: character.status === 'approved' ? '#00FF88' :
                          character.status === 'pending' ? '#FFA500' : '#ff6b6b',
                        color: '#000',
                        fontSize: '0.6rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '10px',
                        textTransform: 'uppercase'
                      }}>
                        {character.status}
                      </div>

                      <div style={{
                        width: '50px', height: '50px', borderRadius: '50%',
                        overflow: 'hidden', marginBottom: '0.75rem',
                        border: character.status === 'approved'
                          ? '3px solid rgba(255, 215, 0, 0.3)'
                          : '3px solid rgba(255, 165, 0, 0.3)',
                        flexShrink: 0
                      }}>
                        <img
                          src={character.thumbnailUrl || character.avatar_url || '/images/default-character.jpg'}
                          alt={character.display_name}
                          style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            filter: character.status === 'approved' ? 'none' : 'grayscale(30%)'
                          }}
                          onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
                        />
                      </div>

                      <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{
                          color: character.status === 'approved' ? '#FFD700' : '#FFA500',
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

                        {character.status === 'pending' && (
                          <p style={{
                            color: '#FFA500',
                            fontSize: '0.6rem',
                            margin: '0.5rem 0 0 0',
                            fontStyle: 'italic'
                          }}>
                            Awaiting approval...
                          </p>
                        )}

                        {character.status === 'rejected' && (
                          <p style={{
                            color: '#ff6b6b',
                            fontSize: '0.6rem',
                            margin: '0.5rem 0 0 0',
                            fontStyle: 'italic'
                          }}>
                            Needs revision
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Regular categories (kept)
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
                        opacity: 1,
                        animation: `characterSlideIn 0.6s ease-out ${index * 0.05}s forwards`,
                        minHeight: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative'
                      }}
                    >
                      <div style={{
                        width: '50px', height: '50px', borderRadius: '50%',
                        overflow: 'hidden', marginBottom: '0.75rem',
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
              )}
            </>
          )}
        </div>
      </div>

      {/* Desktop Detail Modal (kept) */}
      {selectedChar && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100%', height: '100%',
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
                width: '100px', height: '100px', borderRadius: '50%',
                objectFit: 'cover', border: '4px solid rgba(255, 215, 0, 0.4)',
                marginBottom: '1.5rem'
              }}
              onError={(e) => { e.target.src = '/images/default-character.jpg'; }}
            />

            <h2 style={{ color: '#FFD700', fontSize: '1.5rem', fontWeight: 600, margin: '0 0 0.5rem 0', letterSpacing: '1px' }}>
              {selectedChar.name}
            </h2>

            <p style={{ color: 'rgba(255, 215, 0, 0.7)', fontSize: '0.9rem', textTransform: 'none', letterSpacing: '0.5px', margin: '0 0 1.5rem 0' }}>
              {selectedChar.category}
            </p>

            <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '1rem', lineHeight: 1.6, margin: '0 0 2rem 0' }}>
              {selectedChar.description}
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
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
                  fontFamily: "'Georgia', serif",
                  textTransform: 'none'
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
                  fontFamily: "'Georgia', serif",
                  textTransform: 'none'
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

            {/* Keep debug widgets visible as before */}
            <SimpleDebugTest />
            <PremiumStatusDebugger />
            <div style={{
              position: 'fixed',
              top: '10px',
              right: '10px',
              background: 'red',
              color: 'white',
              padding: '20px',
              zIndex: 9999999999,
              fontSize: '16px'
            }}>
              SIMPLE TEST
            </div>
          </div>
        </div>
      )}

      <style>{`
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

        .scroll-area {
          background-color: #0a0a0a;
          color: inherit;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #444 #0a0a0a;
        }

        .scroll-area::-webkit-scrollbar { width: 8px; }
        .scroll-area::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        .scroll-area::-webkit-scrollbar-thumb {
          background-color: #444;
          border-radius: 4px;
          border: 2px solid #0a0a0a;
        }
      `}</style>
       
      {/* Template Gallery Modal */}
      {showTemplateGallery && console.log('Modal should render now')}
      {showTemplateGallery && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 3000,
          background: 'rgba(0, 0, 0, 0.95)',
          overflowY: 'auto' // Add this for mobile scrolling
        }}>
          <TemplateGallery
            userPremiumStatus={premiumStatus}
          />
        </div>
      )}

      {/* Character Builder Modal */}
      {showCharacterBuilder && selectedTemplate && (
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
            userPremiumStatus={premiumStatus}
          />
        </div>
      )}
    </div>
  );
};

/* =======================
   PersonalizedSection Component
   ======================= */
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
    e.currentTarget.style.boxShadow = '0 0 18px 4px rgba(255, 215, 0, 0.35)'; // golden glow
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
          fontFamily: "'Georgia', serif",
          textTransform: 'none' // Add this to prevent all caps
        }}>
        </h3>
        <span style={{
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))',
          border: '1px solid rgba(255, 215, 0, 0.4)',
          borderRadius: '12px',
          padding: '0.2rem 0.6rem',
          fontSize: '0.7rem',
          color: 'rgba(255, 215, 0, 0.9)',
          letterSpacing: '0.3px',
          textTransform: 'none'
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
                    width: '50px', // mobile avatar 50px
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
                    right: 'calc(50% - 25px - 2px)', // align to avatar edge
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
                    width: '45px', // desktop avatar 45px
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
export default SplitScreenLauncher;