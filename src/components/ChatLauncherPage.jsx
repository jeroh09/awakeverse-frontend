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

// Import helper components
import {
  CategoryCard,
  CharacterCard,
  MyCharactersPanel,
  PersonalizedSection,
  categoryRepresentatives
} from '../components/ChatLauncherHelpers';

import { characterCategories } from '../data/characterCategories';


// Enhanced semantic mappings for character search
const ENHANCED_SEMANTIC_MAPPINGS = {
  truth: ['truthweavers', 'thinkers'],
  meaning: ['thinkers', 'veilwalkers'],
  power: ['warlords', 'goldhands'],
  war: ['warlords'],
  strategy: ['warlords', 'goldhands'],
  battle: ['warlords'],
  leadership: ['warlords', 'goldhands'],
  create: ['makers', 'heartstrings'],
  invent: ['makers'],
  art: ['makers', 'heartstrings'],
  innovation: ['makers'],
  technology: ['makers'],
  money: ['goldhands'],
  business: ['goldhands'],
  success: ['goldhands', 'warlords'],
  love: ['heartstrings'],
  romance: ['heartstrings'],
  betrayal: ['heartstrings', 'veilwalkers'],
  prophecy: ['stargazers'],
  future: ['stargazers'],
  stars: ['stargazers'],
  fate: ['stargazers', 'truthweavers'],
  mystery: ['veilwalkers', 'sleuths'],
  secrets: ['veilwalkers'],
  revolution: ['truthweavers', 'warlords'],
  rebellion: ['truthweavers', 'warlords'],
  freedom: ['truthweavers', 'warlords'],
  explore: ['pathfinders', 'stargazers'],
  journey: ['pathfinders', 'truthweavers'],
  performance: ['performers', 'heartstrings'],
  magic: ['performers', 'veilwalkers'],
  code: ['makers', 'thinkers'],
  logic: ['thinkers', 'sleuths'],
  deduction: ['sleuths'],
  justice: ['truthweavers', 'sleuths'],
  literature: ['heartstrings', 'truthweavers'],
  poetry: ['heartstrings', 'truthweavers'],
  empire: ['warlords', 'goldhands'],
  trade: ['goldhands'],
  legends: ['truthweavers', 'pathfinders'],
  myth: ['veilwalkers', 'truthweavers']
};

// Oracle prompts for rotating placeholder text
const ORACLE_PROMPTS = [
  'Ask Sherlock to untangle a decision.',
  'Consult a stargazer about your next move.',
  'Invite a warlord to critique your strategy.',
  'Ask a truthweaver to reframe your story.',
  'Test an inventor with your wildest idea.'
];

const ChatLauncherPage = ({ onStartChat, discoveredCharacters = [] }) => {
  const { user } = useUser();

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
      () => setPlaceholderIndex((prev) => (prev + 1) % ORACLE_PROMPTS.length),
      4000
    );
    return () => clearInterval(interval);
  }, []);

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

      if (!response.ok) {
        throw new Error('Failed to load your characters');
      }

      const data = await response.json();
      setUserCharacters(Array.isArray(data.characters) ? data.characters : []);
    } catch (error) {
      console.error('Error loading user characters:', error);
      setCharactersError(
        error.message || 'Unable to load your characters. Please try again later.'
      );
    } finally {
      setCharactersLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUserCharacters();
    } else {
      setUserCharacters([]);
    }
  }, [user, loadUserCharacters]);

  // Build enhanced categories including my characters & discovered characters
  const enhancedCategories = useMemo(() => {
    const baseCategories = characterCategories.map((category) => ({
      ...category,
      characters: category.characters.map((character) => ({
        ...character,
        source: character.source || 'template',
        expertise_domain: character.expertise_domain || null,
        creator: character.creator || null
      }))
    }));

    // Find and update my_characters category
    const myCharactersIndex = baseCategories.findIndex(
      (cat) => cat.key === 'my_characters'
    );
    if (myCharactersIndex !== -1) {
      baseCategories[myCharactersIndex] = {
        ...baseCategories[myCharactersIndex],
        characters: userCharacters.map((char) => ({
          key: char.character_key,
          name: char.display_name,
          description: char.short_description,
          thumbnailUrl: char.avatar_url || char.thumbnailUrl || null,
          status: char.status,
          rejection_reason: char.rejection_reason
        })),
        characterCount: userCharacters.length,
        pendingCount: userCharacters.filter((c) => c.status === 'pending').length,
        rejectedCount: userCharacters.filter((c) => c.status === 'rejected').length,
        approvedCount: userCharacters.filter((c) => c.status === 'approved').length
      };
    }

    // NEW: Check if discovered category already exists in base
    const existingDiscoveredIndex = baseCategories.findIndex(
      (cat) => cat.key === 'discovered'
    );

    // Add or update discovered characters category
    if (discoveredCharacters && discoveredCharacters.length > 0) {
      const discoveredCategory = {
        key: 'discovered',
        title: 'Discovered',
        characters: discoveredCharacters.map((char) => ({
          key: char.character_key,
          name: char.display_name || char.name,
          description: char.short_description || char.description,
          thumbnailUrl: char.avatar_url || char.thumbnailUrl || null,
          status: char.status || 'approved',
          source: 'discovered',
          expertise_domain: char.expertise_domain,
          creator: char.creator
        })),
        characterCount: discoveredCharacters.length,
        icon: '✨',
        description: 'Characters you unlocked from the Hub and special sessions.'
      };

      if (existingDiscoveredIndex !== -1) {
        baseCategories[existingDiscoveredIndex] = {
          ...baseCategories[existingDiscoveredIndex],
          ...discoveredCategory
        };
      } else {
        baseCategories.push(discoveredCategory);
      }
    }

    // Recalculate characterCount where needed
    baseCategories.forEach((category) => {
      if (!category.characterCount && category.characters) {
        category.characterCount = category.characters.length;
      }
    });

    return baseCategories;
  }, [userCharacters.length, discoveredCharacters.length, userCharacters, discoveredCharacters]);

  // NEW: Enhanced search to include discovered characters
  const performSemanticSearch = useMemo(() => {
    return (query) => {
      if (!query.trim()) return [];
      const searchTerm = query.toLowerCase().trim();
      const results = [];

      enhancedCategories.forEach((category) => {
        category.characters.forEach((character) => {
          const nameMatch = character.name.toLowerCase().includes(searchTerm);
          const descMatch = character.description.toLowerCase().includes(searchTerm);
          const nameParts = character.name.toLowerCase().split(' ');
          const partialNameMatch = nameParts.some(
            (part) => part.includes(searchTerm) || searchTerm.includes(part)
          );

          // NEW: Also search expertise domain for discovered characters
          const domainMatch =
            character.expertise_domain &&
            character.expertise_domain.toLowerCase().includes(searchTerm);

          if (nameMatch || descMatch || partialNameMatch || domainMatch) {
            results.push({
              ...character,
              category: category.title,
              categoryKey: category.key,
              source: character.source,
              expertise_domain: character.expertise_domain,
              creator: character.creator
            });
          }
        });
      });

      // Semantic boost by mapping keywords to likely categories
      Object.entries(ENHANCED_SEMANTIC_MAPPINGS).forEach(([keyword, mappedCategories]) => {
        if (searchTerm.includes(keyword)) {
          mappedCategories.forEach((catKey) => {
            const category = enhancedCategories.find((c) => c.key === catKey);
            if (category) {
              category.characters.forEach((character) => {
                results.push({
                  ...character,
                  category: category.title,
                  categoryKey: category.key,
                  source: character.source,
                  expertise_domain: character.expertise_domain,
                  creator: character.creator
                });
              });
            }
          });
        }
      });

      // Deduplicate by character key
      const uniqueResults = [];
      const seenKeys = new Set();

      results.forEach((character) => {
        const key = character.key || `${character.categoryKey}-${character.name}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueResults.push(character);
        }
      });

      // Reduce noise: prefer exact matches + discovered + my characters
      return uniqueResults.slice(0, 30);
    };
  }, [enhancedCategories]);

  const handleInputChange = useCallback(
    (text) => {
      setInputValue(text);
      if (text.length >= 2) {
        const results = performSemanticSearch(text);
        setSearchResults(results);
        setShowResults(true);
      } else {
        setShowResults(false);
        setSearchResults([]);
      }
    },
    [performSemanticSearch]
  );

  // Character selection with status checking
  const handleCharacterSelect = useCallback(
    (character) => {
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
            rejection_reason: character.rejection_reason || null
          });
          setShowStatusModal(true);
          return;
        }
      }

      // Normal behavior: open character detail
      setSelectedChar(character);
      trackInteraction({
        characterKey: character.key,
        name: character.name,
        categoryKey: character.categoryKey || character.category,
        source: character.source, // Track source for discovered characters
        expertise_domain: character.expertise_domain,
        creator: character.creator
      });
    },
    [trackInteraction]
  );

  const handleRecentCharacterSelect = useCallback(
    (recentCharacter) => {
      trackInteraction(recentCharacter.character);
      onStartChat(recentCharacter.character);
    },
    [trackInteraction, onStartChat]
  );

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
    setShowSuccess(false);
    setShowBuilder(false);
    setShowTemplates(false);
    setSelectedTemplate(null);
  }, []);

  // Mobile-only early return
  if (isMobile) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: '100vh',
          background: '#020617',
          color: '#f9fafb'
        }}
      >
        <MobileCharacterView
          selectedCategory={selectedCategory}
          userCharacters={userCharacters}
          charactersLoading={charactersLoading}
          charactersError={charactersError}
          onCreateCharacter={handleCreateCharacterClick}
          onCharacterSelect={handleCharacterSelect}
          user_id={user?.id}
        />

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

  // Success screen
  if (showSuccess) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 4000,
          background: 'rgba(0, 0, 0, 0.95)'
        }}
      >
        <CharacterCreationSuccess onClose={handleCloseCreationFlow} />
      </div>
    );
  }

  // Template gallery overlay
  if (showTemplates) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 3000,
          background: 'rgba(0, 0, 0, 0.95)',
          overflowY: 'auto'
        }}
      >
        <TemplateGallery
          onSelectTemplate={handleTemplateSelect}
          onClose={handleCloseCreationFlow}
        />
      </div>
    );
  }

  // Builder overlay
  if (showBuilder) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 3000,
          background: 'rgba(0, 0, 0, 0.95)',
          overflowY: 'auto'
        }}
      >
        <CharacterBuilder
          template={selectedTemplate}
          onClose={handleCloseCreationFlow}
          onComplete={handleCharacterCreationComplete}
        />
      </div>
    );
  }

  // DESKTOP LAYOUT - Minimal two-pane launcher
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        background: 'radial-gradient(circle at top, #111827 0, #020617 55%, #000 100%)',
        color: '#f2e8d5',
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1160px',
          minHeight: '620px',
          background: '#020617',
          borderRadius: 28,
          padding: 20,
          border: '1px solid rgba(15, 23, 42, 0.9)',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.8)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.38fr) minmax(0, 0.62fr)',
          gap: 18,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* LEFT PANE: Search + Personalized */}
        <section
          style={{
            background: '#0b1220',
            borderRadius: 24,
            padding: '18px 16px',
            border: '1px solid rgba(31, 41, 55, 1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#6b7280'
              }}
            >
              Chat launcher
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  margin: 0
                }}
              >
                Awaken a legend
              </h1>
            </div>
            <p
              style={{
                fontSize: 12,
                color: '#cbd5f5',
                margin: '2px 0 0 0'
              }}
            >
              Pick up a conversation where you left off, or switch smoothly to another
              legend.
            </p>
            <p
              style={{
                fontSize: 11,
                color: '#9ca3af',
                margin: '2px 0 0 0'
              }}
            >
              Showing your recent legends
              {recentCharacters && recentCharacters.length
                ? ` · ${recentCharacters.length} tracked`
                : ''}
              {hasActiveConversations ? ' · active sessions running' : ''}
            </p>
          </header>

          {/* Search input + semantic results overlay */}
          <div style={{ marginTop: 6, position: 'relative' }}>
            <input
              type="search"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={ORACLE_PROMPTS[placeholderIndex]}
              style={{
                width: '100%',
                borderRadius: 999,
                border: '1px solid rgba(148, 163, 184, 0.35)',
                background: 'rgba(15, 23, 42, 0.85)',
                padding: '8px 12px',
                fontSize: 12,
                color: '#f2e8d5',
                outline: 'none'
              }}
            />
            <p
              style={{
                fontSize: 10,
                color: '#6b7280',
                marginTop: 4
              }}
            >
              Type at least 2 letters to filter across created, templates and discovered
              characters.
            </p>

            {/* Search results dropdown */}
            {showResults && searchResults.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  maxHeight: 300,
                  overflowY: 'auto',
                  background: 'rgba(15, 23, 42, 0.98)',
                  border: '1px solid rgba(207, 174, 92, 0.5)',
                  borderRadius: 14,
                  backdropFilter: 'blur(18px)',
                  padding: '10px 10px',
                  marginTop: 8,
                  zIndex: 999
                }}
              >
                {searchResults.map((character, index) => (
                  <div
                    key={`${character.key}-${index}`}
                    onClick={() => {
                      handleCharacterSelect(character);
                      setShowResults(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 9px',
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(31, 41, 55, 0.9)',
                      borderRadius: 10,
                      cursor: 'pointer',
                      marginBottom: index < searchResults.length - 1 ? 8 : 0
                    }}
                  >
                    {/* Thumbnail / avatar */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid rgba(207, 174, 92, 0.4)',
                        flexShrink: 0
                      }}
                    >
                      <img
                        src={character.thumbnailUrl || '/images/default-character.jpg'}
                        alt={character.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.onError = null;
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent && !parent.querySelector('.text-fallback')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'text-fallback';
                            fallback.style.cssText =
                              'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,1);color:#FBBF24;font-size:1.1rem;font-weight:bold;border-radius:50%;';
                            fallback.textContent = (character.name || 'C')
                              .charAt(0)
                              .toUpperCase();
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: character.status === 'approved' ? '#fbbf24' : '#fb923c',
                          marginBottom: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <span
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {character.name}
                        </span>
                        {character.source === 'market_hub' && (
                          <span
                            style={{
                              fontSize: 9,
                              padding: '2px 6px',
                              borderRadius: 999,
                              border: '1px solid rgba(59, 130, 246, 0.7)',
                              color: '#bfdbfe'
                            }}
                          >
                            Hub
                          </span>
                        )}
                        {character.source === 'discovered' && (
                          <span
                            style={{
                              fontSize: 9,
                              padding: '2px 6px',
                              borderRadius: 999,
                              border: '1px solid rgba(34, 197, 94, 0.7)',
                              color: '#bbf7d0'
                            }}
                          >
                            Discovered
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#9ca3af',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {character.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showResults && searchResults.length === 0 && inputValue.length >= 2 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'rgba(15, 23, 42, 0.98)',
                  border: '1px solid rgba(207, 174, 92, 0.4)',
                  borderRadius: 14,
                  backdropFilter: 'blur(18px)',
                  padding: '10px 10px',
                  marginTop: 8,
                  textAlign: 'center',
                  zIndex: 999
                }}
              >
                <p
                  style={{
                    color: 'rgba(248, 250, 252, 0.9)',
                    margin: '0 0 4px 0',
                    fontSize: 13
                  }}
                >
                  No matches for "{inputValue}"
                </p>
                <small style={{ color: 'rgba(148, 163, 184, 0.9)', fontSize: 11 }}>
                  Try searching for character names, themes or expertise.
                </small>
              </div>
            )}
          </div>

          {/* Personalized suggestions */}
          {shouldShowForYou && (
            <div style={{ marginTop: 10 }}>
              <PersonalizedSection
                characters={recentCharacters}
                onCharacterSelect={handleRecentCharacterSelect}
                hasActiveConversations={hasActiveConversations}
                isMobile={false}
              />
            </div>
          )}
        </section>

        {/* RIGHT PANE: Categories + Character grid */}
        <section
          style={{
            background: 'rgba(15, 23, 42, 0.98)',
            borderRadius: 24,
            padding: '18px 16px',
            border: '1px solid rgba(31, 41, 55, 1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            overflow: 'hidden'
          }}
        >
          <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#6b7280'
              }}
            >
              Browse by archetype
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 12
              }}
            >
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  margin: 0
                }}
              >
                Discover a legend
              </h2>
              <p
                style={{
                  fontSize: 11,
                  color: '#cbd5f5',
                  margin: 0
                }}
              >
                Tap a category to explore templates and your own characters from that
                group.
              </p>
            </div>

            {/* Category strip */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                marginTop: 4
              }}
            >
              {enhancedCategories.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => handleCategorySelect(category)}
                  style={{
                    borderRadius: 999,
                    border:
                      selectedCategory && selectedCategory.key === category.key
                        ? '1px solid rgba(207, 174, 92, 0.8)'
                        : '1px solid rgba(148, 163, 184, 0.6)',
                    padding: '5px 9px',
                    fontSize: 11,
                    background:
                      selectedCategory && selectedCategory.key === category.key
                        ? 'rgba(15, 23, 42, 0.9)'
                        : 'rgba(15, 23, 42, 0.7)',
                    color:
                      selectedCategory && selectedCategory.key === category.key
                        ? '#fbbf24'
                        : '#e5e7eb',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  {category.icon && <span>{category.icon}</span>}
                  <span>{category.title}</span>
                  {typeof category.characterCount === 'number' && (
                    <span
                      style={{
                        fontSize: 10,
                        color: '#9ca3af'
                      }}
                    >
                      · {category.characterCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </header>

          {/* Category or character view */}
          <div
            style={{
              marginTop: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              flex: 1,
              minHeight: 0
            }}
          >
            {!selectedCategory && (
              <div
                style={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                  marginTop: 4
                }}
              >
                {enhancedCategories.map((category, index) => (
                  <CategoryCard
                    key={category.key}
                    category={category}
                    onClick={() => handleCategorySelect(category)}
                    isMobile={false}
                    index={index}
                    onCreateCharacter={handleCreateCharacterClick}
                  />
                ))}
              </div>
            )}

            {selectedCategory && (
              <div
                style={{
                  marginTop: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  flex: 1,
                  minHeight: 0
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 16,
                        fontWeight: 600
                      }}
                    >
                      {selectedCategory.title}
                    </h3>
                    {selectedCategory.description && (
                      <p
                        style={{
                          margin: '4px 0 0 0',
                          fontSize: 11,
                          color: '#9ca3af'
                        }}
                      >
                        {selectedCategory.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleBackToCategories}
                    style={{
                      fontSize: 11,
                      padding: '4px 9px',
                      borderRadius: 999,
                      border: '1px solid rgba(148, 163, 184, 0.7)',
                      background: 'transparent',
                      color: '#e5e7eb',
                      cursor: 'pointer'
                    }}
                  >
                    ← Back to categories
                  </button>
                </div>

                {/* My Characters special handling */}
                {selectedCategory.key === 'my_characters' ? (
                  <MyCharactersPanel
                    userCharacters={userCharacters}
                    charactersLoading={charactersLoading}
                    charactersError={charactersError}
                    onCreateCharacter={handleCreateCharacterClick}
                    onCharacterSelect={handleCharacterSelect}
                    user_id={user?.id}
                  />
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: 10,
                      maxHeight: 'calc(100vh - 260px)',
                      overflowY: 'auto',
                      paddingRight: 4
                    }}
                  >
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
              </div>
            )}
          </div>
        </section>

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

        {/* Upgrade Modal */}
        <DualPathUpgradeSystem
          isOpen={upgradeModalOpen}
          onClose={handleCloseUpgradeModal}
          triggerReason={upgradeReason}
          currentUsage={null}
        />
      </div>
    </div>
  );
};

export default ChatLauncherPage;
