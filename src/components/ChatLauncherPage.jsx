// src/pages/ChatLauncherPage.jsx - PRODUCTION READY
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import useInteractedCharacters from '../hooks/useInteractedCharacters';
import CharacterDetailPanel from '../components/CharacterDetailPanel/CharacterDetailPanel';
import TemplateGallery from '../components/TemplateGallery';
import CharacterBuilder from '../components/CharacterBuilder';
import CharacterStatusModal from '../components/CharacterStatusModal';
import CharacterCreationSuccess from '../components/CharacterCreationSuccess';
import DualPathUpgradeSystem from '../components/DualPathUpgradeSystem';
import MobileCharacterView from '../components/MobileCharacterView';
import PremiumOracleSearch from '../components/PremiumOracleSearch';
import PremiumCategoryCard from './PremiumCategoryCard';
import { useAppView, VIEW_STATES } from '../contexts/AppViewContext';
import PremiumCharacterCard from '../components/PremiumCharacterCard';
import theme from '../design-system/tokens';


// Import helper components
import {
  CharacterCard,
  MyCharactersPanel,
  PersonalizedSection,
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

// ADD THE NEW CATEGORY CARD COMPONENT RIGHT HERE
export const CategoryCard = (props) => {
  const { category, isMobile } = props;
  
  // Use premium card for regular categories
  if (category.key !== 'my_characters') {
    return <PremiumCategoryCard {...props} />;
  }
  
  // Keep your existing my_characters card logic
  return (
    <div 
      onClick={props.onClick}
      style={{
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.1) 100%)',
        border: '2px solid rgba(255, 215, 0, 0.4)',
        borderRadius: '15px',
        padding: isMobile ? '1rem' : '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: isMobile ? '120px' : '150px'
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.25) 0%, rgba(255, 165, 0, 0.2) 100%)';
          e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.6)';
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(255, 215, 0, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.1) 100%)';
          e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.4)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <div style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', marginBottom: '0.5rem' }}>
        {category.icon || '👤'}
      </div>
      <h3 style={{
        color: '#FFD700',
        fontSize: isMobile ? '1rem' : '1.2rem',
        margin: '0 0 0.5rem 0',
        fontWeight: 600,
        fontFamily: "'Playfair Display', serif"
      }}>
        {category.title}
      </h3>
      <p style={{
        color: 'rgba(255, 215, 0, 0.8)',
        fontSize: isMobile ? '0.8rem' : '0.9rem',
        margin: 0,
        opacity: 0.9
      }}>
        {category.characterCount || 0} character{category.characterCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

// NEW: Updated to accept iscoveredCharacters prop
const ChatLauncherPage = ({ onStartChat, discoveredCharacters = [] }) => {
  const { user } = useUser();
  // In your component:
  const { switchView } = useAppView();

  // Character creation flow state
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Premium character state management
  const [userCharacters, setUserCharacters] = useState([]);
  const [charactersLoading, setCharactersLoading] = useState(false);
  const [charactersError, setCharactersError] = useState(null);

  // Character status modal state
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
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('general');

  const handleShowUpgradeModal = useCallback((reason = 'general') => {
    setUpgradeReason(reason);
    setUpgradeModalOpen(true);
  }, []);

  const handleCloseUpgradeModal = useCallback(() => {
    setUpgradeModalOpen(false);
    setUpgradeReason('general');
  }, []);
  

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

  // Load user's custom characters
   // Load user's custom characters (opaque-cookie auth)
  const loadUserCharacters = useCallback(async () => {
    if (!user) return;

    try {
      setCharactersLoading(true);
      setCharactersError(null);

      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/premium/characters`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
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
  }, [user]);


  // Load user characters on mount and token change
  useEffect(() => {
    loadUserCharacters();
  }, [loadUserCharacters]);

  // NEW: Enhanced categories with user characters AND discovered characters
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
          thumbnailUrl: char.avatar_url || char.thumbnailUrl || null,
          status: char.status,
          rejection_reason: char.rejection_reason
        })),
        characterCount: userCharacters.length,
        pendingCount: userCharacters.filter(c => c.status === 'pending').length,
        rejectedCount: userCharacters.filter(c => c.status === 'rejected').length,
        approvedCount: userCharacters.filter(c => c.status === 'approved').length,
        sceneImage: '/images/categories/creator.jpeg' 
      };
    }

    // NEW: Check if discovered category already exists in base
    const existingDiscoveredIndex = baseCategories.findIndex(cat => cat.key === 'discovered');
    
    // Add or update discovered characters category
    if (discoveredCharacters && discoveredCharacters.length > 0) {
      const discoveredCategory = {
        key: 'discovered',
        title: 'Discovered',
        characters: discoveredCharacters.map(char => ({
          key: char.character_key,
          name: char.display_name || char.name,
          description: char.short_description || char.description || '',
          thumbnailUrl: char.avatar_url || char.thumbnailUrl || `/images/${char.character_key}.jpg`,
          source: 'market_hub',
          expertise_domain: char.expertise_domain,
          creator: char.creator
        })),
        characterCount: discoveredCharacters.length,
        sceneImage: '/images/categories/discover.jpeg',  // ADD THIS LINE
        icon: '',
        description: 'Characters you\'ve discovered from the Market Hub'
      };
      
      if (existingDiscoveredIndex !== -1) {
        // Update existing discovered category
        baseCategories[existingDiscoveredIndex] = discoveredCategory;
      } else {
        // Insert after my_characters (position 12)
        baseCategories.splice(12, 0, discoveredCategory);
      }
    } else if (existingDiscoveredIndex !== -1) {
      // Remove discovered category if no characters and it exists
      baseCategories.splice(existingDiscoveredIndex, 1);
    }
    
    return baseCategories;
  }, [userCharacters.length, discoveredCharacters.length]);

  // NEW: Enhanced search to include discovered characters
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

          // NEW: Also search expertise domain for discovered characters
          const domainMatch = character.expertise_domain && 
            character.expertise_domain.toLowerCase().includes(searchTerm);

          if (nameMatch || descMatch || partialNameMatch || domainMatch) {
            results.push({
              ...character,
              category: category.title,
              categoryKey: category.key,
              relevance: nameMatch ? 100 : (partialNameMatch ? 90 : (domainMatch ? 85 : 80))
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

  // Character selection with status checking
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
    
    // Allow chat for approved custom characters, discovered characters, and all existing characters
    trackInteraction(character.key);
    setSelectedChar({
      key: character.key,
      name: character.name,
      thumbnailUrl: character.thumbnailUrl,
      description: character.description,
      category: character.category,
      status: character.status,
      source: character.source, // NEW: Track source for discovered characters
      expertise_domain: character.expertise_domain,
      creator: character.creator
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

  // Status modal handlers
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
    setShowTemplates(true);
  }, []);

  const handleTemplateSelect = useCallback((template) => {
    setSelectedTemplate(template);
    setShowTemplates(false);
    setShowBuilder(true);
  }, []);

  const handleCharacterCreationComplete = useCallback(() => {
    setShowBuilder(false);
    setShowSuccess(true);
    // Reload user characters to show the new one
    loadUserCharacters();
  }, [loadUserCharacters]);

  const handleCloseCreationFlow = useCallback(() => {
    setShowTemplates(false);
    setShowBuilder(false);
    setShowSuccess(false);
    setSelectedTemplate(null);
  }, []);

  // Add this new handler
  const handleCharacterPublishToggle = useCallback((updatedCharacter) => {  
  // Update the character in userCharacters array
    setUserCharacters(prevChars => 
      prevChars.map(char => 
        char.id === updatedCharacter.id
          ? { ...char, is_market_featured: updatedCharacter.is_market_featured }
          : char
      )
    );
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

  // MOBILE LAYOUT - Enhanced with discovered characters
  if (isMobile) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        padding: '1rem',
        fontFamily: "'Georgia', serif",
        background: theme.colors.background.canvas, // NEW: #0A0F1A
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
            fontFamily: theme.typography.fonts.display,
            fontSize: '32px', // Smaller for mobile
            fontWeight: theme.typography.weights.bold,
            color: theme.colors.brand.ivory,
            letterSpacing: '-0.5px',
            marginBottom: '8px'
          }}>
            Welcome, {user?.first_name || 'Seeker'}
          </h1>
          <p style={{
            fontFamily: theme.typography.fonts.body,
            fontSize: '16px', // Smaller for mobile
            color: theme.colors.text.secondary,
            fontStyle: 'italic',
            marginBottom: '24px'
          }}>
            {currentPlaceholder}
          </p>

          {discoveredCharacters.length > 0 && (
          <div style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: theme.colors.brand.ivory + '1A', // 10% opacity hex
            border: `1px solid ${theme.colors.brand.ivory}33`, // 20% opacity hex
            borderRadius: '15px',
            fontSize: '0.9rem',
            color: theme.colors.brand.ivory,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backdropFilter: 'blur(10px)'
          }}>
            ✨ {discoveredCharacters.length} character{discoveredCharacters.length !== 1 ? 's' : ''} discovered from Market Hub
          </div>
        )}
        </div>

        {/* Search Section */}
        <div style={{
          width: '100%',
          maxWidth: '500px',
          position: 'relative',
          marginBottom: '1rem'
        }}>
          <PremiumOracleSearch
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => inputValue.length >= 2 && setShowResults(true)}
            onBlur={() => {
              setTimeout(() => setShowResults(false), 200);
            }}
          />

          {/* Enhanced Search Results with source indicators */}
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
              zIndex: 999
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
                    onError={(e) => { 
                      e.currentTarget.onError = null;
                      e.currentTarget.style.display = 'none';

                      const parent = e.currentTarget.parentElement;
                      if (!parent.querySelector('.text-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'text-fallback';
                        fallback.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(255,215,0,0.2);color:#FFD700;font-size:1.2rem;font-weight:bold;border-radius:50%;';
                        fallback.textContent = (character.name || 'C').charAt(0).toUpperCase();
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: character.status === 'approved' ? '#FFD700' : '#FFA500',
                      marginBottom: '0.25rem'
                    }}>
                      {character.name}
                      {/* NEW: Source indicator */}
                      {character.source === 'market_hub' && (
                        <span style={{
                          marginLeft: '0.5rem',
                          fontSize: '0.7rem',
                          background: 'rgba(255, 215, 0, 0.2)',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '6px',
                          color: 'rgba(255, 215, 0, 0.9)'
                        }}>
                          ✨ Discovered
                        </span>
                      )}
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
              zIndex: 999
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
                textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {selectedCategory.icon && (
                  <span style={{ fontSize: '1.2rem' }}>{selectedCategory.icon}</span>
                )}
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

            {/* Mobile Character View */}
            <MobileCharacterView
              selectedCategory={selectedCategory}
              userCharacters={userCharacters}
              charactersLoading={charactersLoading}
              charactersError={charactersError}
              onCreateCharacter={handleCreateCharacterClick}
              onCharacterSelect={handleCharacterSelect}
              user_id={user?.id}
            />
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

  // DESKTOP LAYOUT - Enhanced with discovered characters
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      fontFamily: "'Georgia', serif",
      background: theme.colors.background.canvas, // NEW: #0A0F1A
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
            fontFamily: theme.typography.fonts.display,
            fontSize: '30',
            fontWeight: theme.typography.weights.bold,
            color: theme.colors.brand.ivory,
            letterSpacing: '-1px',
            marginBottom: '8px'
          }}>
            Welcome, {user?.displayName || 'Seeker'}
          </h1>
          <p style={{
            fontFamily: theme.typography.fonts.body,
            fontSize: '12px',
            color: theme.colors.text.secondary,
            fontStyle: 'italic',
            marginBottom: '22px'
          }}>
            {currentPlaceholder}
          </p>

          {/* NEW: Show discovered count if any */}
          {discoveredCharacters.length > 0 && (
            <div style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '15px',
              fontSize: '0.9rem',
              color: 'rgba(255, 215, 0, 0.9)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backdropFilter: 'blur(10px)'
            }}>
              ✨ {discoveredCharacters.length} character{discoveredCharacters.length !== 1 ? 's' : ''} discovered from Market Hub
            </div>
          )}
        </div>

        {/* Search Section */}
        <div style={{ width: '100%', maxWidth: '400px', position: 'relative', marginBottom: '1rem' }}>
          <PremiumOracleSearch
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => inputValue.length >= 2 && setShowResults(true)}
            onBlur={() => {
              setTimeout(() => setShowResults(false), 200);
            }}
          />
          {/* Enhanced Search Results (Desktop) with source indicators */}
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
                    onError={(e) => { 
                      e.currentTarget.onError = null;
                      e.currentTarget.style.display = 'none';

                      const parent = e.currentTarget.parentElement;
                      if (!parent.querySelector('.text-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'text-fallback';
                        fallback.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(255,215,0,0.2);color:#FFD700;font-size:1.2rem;font-weight:bold;border-radius:50%;';
                        fallback.textContent = (character.name || 'C').charAt(0).toUpperCase();
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 600, 
                      color: character.status === 'approved' ? '#FFD700' : '#FFA500', 
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {character.name}
                      {/* NEW: Source indicator */}
                      {character.source === 'market_hub' && (
                        <span style={{
                          fontSize: '0.7rem',
                          background: 'rgba(255, 215, 0, 0.2)',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '6px',
                          color: 'rgba(255, 215, 0, 0.9)'
                        }}>
                          ✨ Discovered
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 215, 0, 0.7)',
                      letterSpacing: '0.5px'
                    }}>
                      {character.category}
                      {character.expertise_domain && character.source === 'market_hub' && (
                        <span style={{ margin: '0 0.3rem', color: 'rgba(255, 255, 255, 0.5)' }}>•</span>
                      )}
                      {character.expertise_domain && character.source === 'market_hub' && (
                        <span style={{ color: 'rgba(255, 215, 0, 0.6)' }}>
                          {character.expertise_domain}
                        </span>
                      )}
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
              zIndex: 999
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
        {/* ADD BUTTONS CONTAINER RIGHT HERE */}
        <div style={{
          display: 'flex',
          gap: theme.spacing.md,
          marginTop: theme.spacing.lg,
          width: '100%',
          maxWidth: '400px'
        }}>
          {/* CREATE Button - Opens My Characters Panel */}
          <button
            onClick={() => {
              const myCharsCategory = enhancedCategories.find(c => c.key === 'my_characters');
              if (myCharsCategory) {
                handleCategorySelect(myCharsCategory);
              }
            }}
            style={{
              flex: 1,
              padding: `${theme.spacing.md} ${theme.spacing.lg}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.sizes.body,
              fontWeight: theme.typography.weights.semibold,
              fontFamily: theme.typography.fonts.body,
              cursor: 'pointer',
              transition: theme.transitions.normal,
              border: 'none',
              outline: 'none',
              background: `linear-gradient(135deg, ${theme.colors.accent.primary} 0%, ${theme.colors.accent.hover} 100%)`,
              color: '#fff',
              boxShadow: theme.shadows.elevation02
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `${theme.shadows.elevation03}, ${theme.shadows.glow}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = theme.shadows.elevation02;
            }}
          >
            Create
          </button>

          {/* DISCOVER Button - Opens Market Hub */}
          <button
            onClick={() => switchView(VIEW_STATES.MARKET_HUB)}
            style={{
              flex: 1,
              padding: `${theme.spacing.md} ${theme.spacing.lg}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.sizes.body,
              fontWeight: theme.typography.weights.semibold,
              fontFamily: theme.typography.fonts.body,
              cursor: 'pointer',
              transition: theme.transitions.normal,
              border: `1px solid ${theme.colors.border.strong}`,
              outline: 'none',
              background: theme.colors.background.interactive,
              color: theme.colors.text.primary,
              boxShadow: theme.shadows.elevation01
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = theme.colors.background.peak;
              e.currentTarget.style.borderColor = theme.colors.accent.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = theme.colors.background.interactive;
              e.currentTarget.style.borderColor = theme.colors.border.strong;
            }}
          >
            Discover
          </button>
        </div>
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
          {/* ADD THIS SECTION HERE - BEFORE the category grid */}
          <div style={{
            marginBottom: '24px',
            padding: '0 16px' // Optional padding for alignment
          }}>
            <h2 style={{
              fontFamily: theme.typography.fonts.display,
              fontSize: theme.typography.sizes.h2,
              fontWeight: theme.typography.weights.bold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.sm,
              letterSpacing: '-0.5px'
            }}>
              Explore by Category
            </h2>
            <p style={{
              fontFamily: theme.typography.fonts.body,
              fontSize: theme.typography.sizes.bodySmall,
              color: theme.colors.text.secondary
            }}>
              Discover characters across different domains of knowledge
            </p>
          </div>
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
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {selectedCategory.icon && (
                    <span style={{ fontSize: '1.5rem' }}>{selectedCategory.icon}</span>
                  )}
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
                  onCharacterPublishToggle={handleCharacterPublishToggle}  // ← ADD THIS
                  isMobile={false}
                  user_id={user?.id}
                  onShowUpgradeModal={handleShowUpgradeModal}
                />
                ) : selectedCategory.key === 'discovered' ? (
                  /* Special handling for discovered characters */
                  <div>
                    {selectedCategory.description && (
                      <p style={{
                        color: 'rgba(255, 215, 0, 0.8)',
                        fontSize: '1rem',
                        marginBottom: '1.5rem',
                        textAlign: 'center',
                        fontStyle: 'italic'
                      }}>
                        {selectedCategory.description}
                      </p>
                    )}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                      gap: '24px',
                      maxHeight: 'calc(100vh - 200px)',
                      overflowY: 'auto',
                      paddingRight: '0.5rem'
                    }}>
                      {selectedCategory.characters.map((character, index) => (
                        <div key={character.key} style={{ position: 'relative' }}>
                          <PremiumCharacterCard
                            character={character}
                            onClick={() => handleCharacterSelect(character)}
                            isMobile={false}
                            showBadge={true}
                          />
                          {/* Discovered badge */}
                        </div>
                      ))}
                    </div>

                    {selectedCategory.characters.length === 0 && (
                      <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: 'rgba(255, 215, 0, 0.7)'
                      }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>
                          No characters discovered yet
                        </h3>
                        <p style={{ margin: 0, fontSize: '1rem' }}>
                          Explore the Market Hub to find interesting characters and add them to this collection!
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                // REPLACE WITH:
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '24px',
                  maxHeight: 'calc(100vh - 200px)',
                  overflowY: 'auto',
                  paddingRight: '0.5rem'
                }}>
                  {selectedCategory.characters.map((character, index) => (
                    <PremiumCharacterCard
                      key={character.key}
                      character={character}
                      onClick={() => handleCharacterSelect(character)}
                      isMobile={false}
                      showBadge={true}
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
        <div style={{ zIndex: 2500 }}>
          <CharacterDetailPanel
            character={selectedChar}
            onStartChat={handleStartChatFromSelection}
            onClose={() => setSelectedChar(null)}
            isMobile={false}
          />
        </div>
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
        
        /* Z-INDEX HIERARCHY */
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
          position: relative;
          z-index: 500;
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
        
        .character-panel {
          position: relative;
          z-index: 600;
        }
        
        .character-panel * {
          position: relative;
          z-index: auto;
        }
        
        @media (max-width: 768px) {
          div[style*="animation"][style*="characterSlideIn"] {
            opacity: 1 !important;
            animation: none !important;
            visibility: visible !important;
            transform: none !important;
          }
          
          div[style*="gridTemplateColumns: repeat(2, 1fr)"] {
            position: relative;
            z-index: 1;
          }
        }
        
        @media (max-width: 768px) {
          button {
            pointer-events: auto !important;
            z-index: 999999999999 !important;
            position: relative !important;
            touch-action: manipulation !important;
            min-height: 44px !important;
            cursor: pointer !important;
            user-select: none !important;
            -webkit-user-select: none !important;
          }
          
          div[style*="position: absolute"][style*="zIndex: 999"] {
            z-index: 950 !important;
          }
        }
      `}</style>

      {/* Upgrade Modal */}
      <DualPathUpgradeSystem
        isOpen={upgradeModalOpen}
        onClose={handleCloseUpgradeModal}
        triggerReason={upgradeReason}
        currentUsage={null}
      />
    </div>
  );
};

export default ChatLauncherPage;