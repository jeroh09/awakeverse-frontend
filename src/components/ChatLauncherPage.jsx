// src/pages/ChatLauncherPage.jsx - PRODUCTION READY
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import { useSearchParams } from 'react-router-dom'; // ✨ QUIZ INTEGRATION
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
import ScrollShell from '../components/ScrollShell';
import NetflixRightPanel from '../components/NetflixRightPanel';
import LegendsMapPanel from '../components/LegendsMapPanel/LegendsMapPanel';




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

const PlusChevronIcon = ({ size = 18, className, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
    style={{ display: 'block', ...style }}
  >
    <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      {/* base north (top-right-ish) */}
      <path d="M12.6 4.7v2.8M11.2 6.1h2.8" />
      {/* tip south (bottom-right-ish) */}
      <path d="M12.6 10.5v2.8M11.2 11.9h2.8" />
      {/* pointy edge (left point) */}
      <path d="M4.9 7.6v2.8M3.5 9h2.8" />
    </g>
  </svg>
);


// ADD THE NEW CATEGORY CARD COMPONENT RIGHT HERE
export const CategoryCard = (props) => {
  const { category, isMobile } = props;

  // Normal categories use PremiumCategoryCard
  if (category.key !== 'my_characters') {
    return <PremiumCategoryCard {...props} />;
  }

  // -------------------------------
  // MY CHARACTERS CARD
  // -------------------------------
    // MY CHARACTERS CARD — AWAKEVERSE DESIGN SYSTEM
  const bgImage = category.sceneImage || '/images/categories/creators.jpeg';

  return (
    <div
      onClick={props.onClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: theme.borderRadius.lg,
        cursor: 'pointer',
        minHeight: isMobile ? '130px' : '170px',
        border: `1.5px solid ${theme.colors.accent.primary}55`,
        background: theme.colors.background.surface,
        boxShadow: theme.shadows.elevation02,
        transition: theme.transitions.normal
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = theme.shadows.elevation03;
          e.currentTarget.style.borderColor = theme.colors.accent.primary;
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(0px)';
          e.currentTarget.style.boxShadow = theme.shadows.elevation02;
          e.currentTarget.style.borderColor = `${theme.colors.accent.primary}55`;
        }
      }}
    >
      {/* Background Image */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.62)'
        }}
      />

      {/* Dark overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.85) 100%)'
        }}
      />

      {/* Content Layer */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: isMobile ? '0.75rem' : '1.25rem',
          textAlign: 'center',
          color: theme.colors.accent.primary
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: isMobile ? '1.6rem' : '2.1rem',
            marginBottom: '0.25rem'
          }}
        >
          👤
        </div>

        {/* Title (Syne) */}
        <h3
          style={{
            margin: 0,
            fontFamily: theme.typography.fonts.display,
            fontSize: isMobile ? '1.05rem' : '1.35rem',
            fontWeight: 700,
            letterSpacing: '0.5px'
          }}
        >
          My Characters
        </h3>

        {/* Count (Inter) */}
        <p
          style={{
            margin: '0.25rem 0 0 0',
            fontFamily: theme.typography.fonts.body,
            fontSize: isMobile ? '0.78rem' : '0.9rem',
            opacity: 0.9,
            color: theme.colors.accent.primary
          }}
        >
          {category.characterCount || 0} created
        </p>
      </div>
    </div>
  );
};

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

  // ✨ QUIZ: URL params and loading state
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoadingQuizTemplate, setIsLoadingQuizTemplate] = useState(false);
  const [quizTemplateError, setQuizTemplateError] = useState(null);

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

  //map constt
  const [mapOpen, setMapOpen]               = useState(false);
  const [mapSelectedChar, setMapSelectedChar] = useState(null);
  

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

  // ✨ QUIZ INTEGRATION: Auto-load template from quiz session
  useEffect(() => {
    const handleQuizRedirect = async () => {
      const quizSessionId = searchParams.get('quiz_session');
      const view = searchParams.get('view');

      if (!quizSessionId || view !== 'create') {
        return;
      }

      console.log('🎭 Quiz session detected:', quizSessionId);
      setIsLoadingQuizTemplate(true);
      setQuizTemplateError(null);

      try {
        const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

        const response = await fetch(
          `${API_BASE}/api/quiz/generate-template?session_id=${quizSessionId}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if (response.ok) {
          const data = await response.json();

          if (data.status === 'success' && data.template) {
            console.log('✅ Quiz template loaded:', data.template.name);

            setSelectedTemplate(data.template);
            setShowBuilder(true);

            searchParams.delete('quiz_session');
            searchParams.delete('view');
            setSearchParams(searchParams, { replace: true });
          } else {
            throw new Error('Invalid template response');
          }
        } else {
          throw new Error(`Template fetch failed: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Failed to load quiz template:', error);
        setQuizTemplateError(error.message);

        setTimeout(() => {
          setShowTemplates(true);
          setQuizTemplateError(null);
        }, 2000);
      } finally {
        setIsLoadingQuizTemplate(false);
      }
    };

    handleQuizRedirect();
  }, [searchParams, setSearchParams]);
  // NEW: Enhanced categories with user characters AND discovered characters
  const enhancedCategories = useMemo(() => {    
    const baseCategories = [...characterCategories];
    
    // Find and update my_characters category
    const myCharactersIndex = baseCategories.findIndex(cat => cat.key === 'my_characters');
    if (myCharactersIndex !== -1) {
      baseCategories[myCharactersIndex] = {
        ...baseCategories[myCharactersIndex],
        // CHANGE TO:
        characters: userCharacters.map(char => ({
          key: char.character_key,
          id: char.id,                                    // ← ADD
          name: char.display_name,
          description: char.short_description,
          thumbnailUrl: char.avatar_url || char.thumbnailUrl || null,
          status: char.status,
          rejection_reason: char.rejection_reason,
          is_market_featured: char.is_market_featured || false,  // ← ADD
          market_published_at: char.market_published_at || null  // ← ADD
        })),
        characterCount: userCharacters.length,
        pendingCount: userCharacters.filter(c => c.status === 'pending').length,
        rejectedCount: userCharacters.filter(c => c.status === 'rejected').length,
        approvedCount: userCharacters.filter(c => c.status === 'approved').length,
        sceneImage: '/images/categories/creators.jpeg' 
        
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
  }, [userCharacters, discoveredCharacters]);

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
  // CHANGE TO:
  const handleCharacterPublishToggle = useCallback((updatedCharacter) => {
    setUserCharacters(prevChars =>
      prevChars.map(char =>
        (char.id === updatedCharacter.id || char.character_key === updatedCharacter.character_key)
          ? { ...char, is_market_featured: updatedCharacter.is_market_featured, market_published_at: updatedCharacter.market_published_at }
          : char
      )
    );
  }, []);

  const currentPlaceholder = ORACLE_PROMPTS[placeholderIndex];

  // ✨ QUIZ: Loading state
  if (isLoadingQuizTemplate) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
        background: theme.colors.background.canvas,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: theme.typography.fonts.body
      }}>
        <div style={{
          fontSize: '80px',
          marginBottom: '24px',
          animation: 'bounce 1s ease-in-out infinite'
        }}>
          🎭
        </div>

        <h2 style={{
          fontFamily: theme.typography.fonts.display,
          fontSize: theme.typography.sizes.h2,
          fontWeight: theme.typography.weights.bold,
          color: theme.colors.text.primary,
          margin: '0 0 8px 0'
        }}>
          Creating Your Character
        </h2>

        <p style={{
          fontSize: theme.typography.sizes.body,
          color: theme.colors.text.secondary,
          margin: '0 0 24px 0'
        }}>
          Loading your quiz results...
        </p>

        <div style={{
          width: '40px',
          height: '40px',
          border: `3px solid ${theme.colors.background.surface}`,
          borderTop: `3px solid ${theme.colors.accent.primary}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
      </div>
    );
  }

  // ✨ QUIZ: Error state
  if (quizTemplateError) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
        background: theme.colors.background.canvas,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: theme.typography.fonts.body,
        padding: '20px'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>

        <h2 style={{
          fontFamily: theme.typography.fonts.display,
          fontSize: theme.typography.sizes.h3,
          fontWeight: theme.typography.weights.bold,
          color: theme.colors.semantic.warning,
          margin: '0 0 8px 0'
        }}>
          Quiz Session Expired
        </h2>

        <p style={{
          fontSize: theme.typography.sizes.body,
          color: theme.colors.text.secondary,
          margin: '0 0 16px 0',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          Your quiz session has expired. Opening template gallery...
        </p>
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
            Welcome, {user?.displayName || user?.display_name || 'Seeker'}
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
            <div
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: theme.colors.brand.ivory + '1A', // 10% opacity
                border: `1px solid ${theme.colors.brand.ivory}33`, // 20% opacity
                borderRadius: '15px',
                fontSize: '0.9rem',
                color: theme.colors.brand.ivory,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backdropFilter: 'blur(10px)'
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '18px',
                  height: '18px',
                  flex: '0 0 18px'
                }}
              >
                <PlusChevronIcon size={18} />
              </span>

              {discoveredCharacters.length} character
              {discoveredCharacters.length !== 1 ? 's' : ''} discovered from Market Hub
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
            onChange={(e) => handleInputChange(e.target.value)}  // ← Change this line
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
              background: theme.colors.background.surface,
              border: `1px solid ${theme.colors.accent.primary}33`, // 20% opacity
              borderRadius: theme.borderRadius.lg,
              backdropFilter: 'blur(20px)',
              padding: theme.spacing.md,
              marginTop: theme.spacing.sm,
              boxShadow: theme.shadows.elevation04,
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
                      border: `2px solid ${
                        character.source === 'market_hub' 
                          ? theme.colors.accent.primary 
                          : theme.colors.border.medium
                      }`,
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
                        <span
                          style={{
                            fontSize: theme.typography.sizes.caption,
                            background: theme.colors.accent.glow,
                            padding: '0.1rem 0.4rem',
                            borderRadius: theme.borderRadius.sm,
                            color: theme.colors.accent.primary,
                            fontWeight: theme.typography.weights.semibold,
                            fontFamily: theme.typography.fonts.body,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '12px',
                              height: '12px',
                              flex: '0 0 12px'
                            }}
                          >
                            <PlusChevronIcon size={12} />
                          </span>
                          Discovered
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
        {/* Categories / Characters — Netflix rows (mobile) */}
        <NetflixRightPanel
          categories={enhancedCategories}
          onCharacterSelect={handleCharacterSelect}
          onCreateCharacter={handleCreateCharacterClick}
          selectedChar={selectedChar}
          userCharacters={userCharacters}
          charactersLoading={charactersLoading}
          charactersError={charactersError}
          onCharacterPublishToggle={handleCharacterPublishToggle}
          user_id={user?.id}
          onShowUpgradeModal={handleShowUpgradeModal}
          isMobile={true}
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
            Welcome, {user?.displayName || user?.display_name || 'Seeker'}
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

          {/* Show discovered count if any */}
          {discoveredCharacters.length > 0 && (
            <div style={{
              marginTop: theme.spacing.md,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              background: `linear-gradient(135deg, ${theme.colors.accent.glow} 0%, rgba(99, 102, 241, 0.15) 100%)`,
              border: `1px solid ${theme.colors.accent.primary}40`,
              borderRadius: theme.borderRadius.lg,
              fontSize: theme.typography.sizes.bodySmall,
              color: theme.colors.accent.primary,
              display: 'inline-flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              backdropFilter: 'blur(10px)',
              fontFamily: theme.typography.fonts.body,
              fontWeight: theme.typography.weights.semibold,
              boxShadow: theme.shadows.elevation02,
              transition: theme.transitions.normal,
              cursor: 'default'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `${theme.shadows.elevation03}, ${theme.shadows.glow}`;
              e.currentTarget.style.borderColor = theme.colors.accent.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = theme.shadows.elevation02;
              e.currentTarget.style.borderColor = `${theme.colors.accent.primary}40`;
            }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '18px',
                  height: '18px',
                  flex: '0 0 18px',
                  animation: 'pulse 2s infinite',
                  filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.4))'
                }}
              >
                <PlusChevronIcon size={18} />
              </span>
              {discoveredCharacters.length} character{discoveredCharacters.length !== 1 ? 's' : ''} discovered from Market Hub
            </div>
          )}
        </div>

        {/* Search Section */}
        <div style={{ width: '100%', maxWidth: '400px', position: 'relative', marginBottom: '1rem' }}>
          <PremiumOracleSearch
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}  // ← Change this line
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
              background: theme.colors.background.surface,
              border: `1px solid ${theme.colors.accent.primary}33`, // 20% opacity
              borderRadius: theme.borderRadius.lg,
              backdropFilter: 'blur(20px)',
              padding: theme.spacing.md,
              marginTop: theme.spacing.sm,
              zIndex: 1000,
              boxShadow: theme.shadows.elevation04
            }}>
              {searchResults.map((character, index) => (
                <div
                  key={character.key}
                  onClick={() => handleCharacterSelect(character)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.md,
                    padding: theme.spacing.md,
                    background: theme.colors.background.interactive,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: theme.borderRadius.md,
                    cursor: 'pointer',
                    transition: theme.transitions.normal,
                    marginBottom: index < searchResults.length - 1 ? theme.spacing.sm : 0,
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme.colors.background.peak;
                    e.currentTarget.style.borderColor = theme.colors.accent.primary;
                    e.currentTarget.style.boxShadow = theme.shadows.elevation03;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = theme.colors.background.interactive;
                    e.currentTarget.style.borderColor = theme.colors.border.medium;
                    e.currentTarget.style.boxShadow = 'none';
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
                      fontSize: theme.typography.sizes.body,
                      fontWeight: theme.typography.weights.semibold,
                      color: character.status === 'approved' 
                        ? theme.colors.accent.primary  // Approved = indigo
                        : character.status === 'pending'
                          ? theme.colors.semantic.warning  // Pending = amber
                          : theme.colors.text.primary,  // Default = white
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {character.name}
                      {/* Source indicator */}
                      {character.source === 'market_hub' && (
                        <span
                          style={{
                            fontSize: theme.typography.sizes.caption, // 12px
                            background: theme.colors.accent.glow, // rgba(99, 102, 241, 0.2)
                            padding: `${theme.spacing.xs} ${theme.spacing.sm}`, // 4px 8px
                            borderRadius: theme.borderRadius.sm, // 8px
                            color: theme.colors.accent.primary, // #6366F1
                            fontWeight: theme.typography.weights.semibold, // 600
                            fontFamily: theme.typography.fonts.body, // 'Inter'
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginLeft: theme.spacing.xs // 4px
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '14px',
                              height: '14px',
                              flex: '0 0 14px',
                              animation: 'pulse 2s infinite'
                            }}
                          >
                            <PlusChevronIcon size={14} />
                          </span>
                          Discovered
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: theme.typography.sizes.body,
                      fontWeight: theme.typography.weights.semibold,
                      color: character.status === 'approved' 
                        ? theme.colors.accent.primary  // Approved = indigo
                        : character.status === 'pending'
                          ? theme.colors.semantic.warning  // Pending = amber
                          : theme.colors.text.primary,  // Default = white
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
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
              background: theme.colors.background.surface,
              border: `1px solid ${theme.colors.border.medium}`,
              borderRadius: theme.borderRadius.lg,
              backdropFilter: 'blur(20px)',
              padding: theme.spacing.md,
              marginTop: theme.spacing.sm,
              textAlign: 'center',
              zIndex: 999,
              boxShadow: theme.shadows.elevation03
            }}>
              <p style={{
                color: theme.colors.text.primary,
                margin: `0 0 ${theme.spacing.sm} 0`,
                fontSize: theme.typography.sizes.body,
                fontFamily: theme.typography.fonts.body
              }}>
                No matches for "{inputValue}"
              </p>
              <small style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.sizes.caption,
                fontFamily: theme.typography.fonts.body
              }}>
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
          maxWidth: '400px',
          alignItems: 'center',
        }}>
          {/* CREATE Button */}
          <button
            onClick={() => {
              const myCharsCategory = enhancedCategories.find(c => c.key === 'my_characters');
              if (myCharsCategory) {
                handleCreateCharacterClick();
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
              boxShadow: theme.shadows.elevation02,
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
 
          {/* DISCOVER Button */}
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
              boxShadow: theme.shadows.elevation01,
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
 
          {/* 🌍 LEGENDS MAP — icon only, tooltip on hover, same row as Create/Discover */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setMapOpen(true)}
              aria-label="Open Legends Map"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.accent.primary}55`,
                background: theme.colors.accent.glow,
                color: theme.colors.accent.hover,
                fontSize: '1.1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: theme.transitions.normal,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background  = theme.colors.accent.glowStrong;
                e.currentTarget.style.borderColor = theme.colors.accent.primary;
                e.currentTarget.style.transform   = 'scale(1.08)';
                const tip = e.currentTarget.parentElement.querySelector('[data-tip]');
                if (tip) { tip.style.opacity = '1'; tip.style.transform = 'translateX(-50%) translateY(0)'; }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background  = theme.colors.accent.glow;
                e.currentTarget.style.borderColor = `${theme.colors.accent.primary}55`;
                e.currentTarget.style.transform   = 'scale(1)';
                const tip = e.currentTarget.parentElement.querySelector('[data-tip]');
                if (tip) { tip.style.opacity = '0'; tip.style.transform = 'translateX(-50%) translateY(4px)'; }
              }}
            >
              🌍
            </button>
            {/* Tooltip */}
            <div
              data-tip="true"
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: '50%',
                transform: 'translateX(-50%) translateY(4px)',
                background: theme.colors.background.surface,
                border: `1px solid ${theme.colors.accent.primary}55`,
                borderRadius: theme.borderRadius.sm,
                padding: '4px 10px',
                whiteSpace: 'nowrap',
                fontSize: theme.typography.sizes.caption,
                fontFamily: theme.typography.fonts.body,
                fontWeight: theme.typography.weights.medium,
                color: theme.colors.accent.hover,
                opacity: 0,
                pointerEvents: 'none',
                transition: theme.transitions.fast,
                boxShadow: theme.shadows.elevation02,
                zIndex: 10,
              }}
            >
              Legends Map
            </div>
          </div>
         </div>
        </div>
        {/* ── END BUTTONS CONTAINER ── */}

      {/* RIGHT HALF - Categories/Characters */}
      {/* RIGHT HALF - Netflix-style rows */}
      <div style={{ width: '50%', height: '100%', overflow: 'hidden' }}>
        <NetflixRightPanel
          categories={enhancedCategories}
          onCharacterSelect={handleCharacterSelect}
          onCreateCharacter={handleCreateCharacterClick}
          selectedChar={selectedChar}
          userCharacters={userCharacters}
          charactersLoading={charactersLoading}
          charactersError={charactersError}
          onCharacterPublishToggle={handleCharacterPublishToggle}
          user_id={user?.id}
          onShowUpgradeModal={handleShowUpgradeModal}
        />
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
      <LegendsMapPanel
        isOpen={mapOpen}
        onClose={() => {
          setMapOpen(false);
          setMapSelectedChar(null);
        }}
        onCharacterSelect={(char) => {
          setMapSelectedChar(char);
        }}
      />
        {mapSelectedChar && (
        <div style={{ zIndex: 2500 }}>
          <CharacterDetailPanel
            character={mapSelectedChar}
            onClose={() => setMapSelectedChar(null)}
            onStartChat={(char) => {
              setMapSelectedChar(null);
              setMapOpen(false);
              trackInteraction(char.key || char.character_key);
              onStartChat(char.key || char.character_key);   
            }}
            showDiscoverAction={false}
            isMobile={false}
          />
        </div>
      )}     
    </div>
  );
};

export default ChatLauncherPage;