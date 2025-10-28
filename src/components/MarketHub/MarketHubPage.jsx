// src/components/MarketHub/MarketHubPage.jsx - FIXED ScenarioChatWindow Integration
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, TrendingUp, Trophy, Users, Star, Shield, Zap } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import EnhancedCharacterCard from './EnhancedCharacterCard';
import FeaturedCarousel from './FeaturedCarousel';
import LeaderboardSection from './LeaderboardSection';
import CharacterDetailPanel from '../CharacterDetailPanel/CharacterDetailPanel';
import useMarketHub, { useCharacterEngagement, useScenarioEngagement } from '../../hooks/useMarketHub';
import { useFeaturedCharacters } from '../../hooks/useFeaturedCharacters';
import { getSafeAvatarUrl, createImageErrorHandler } from '../../utils/imageUtils';
import usePremiumCharacters from '../../hooks/usePremiumCharacters';
import ScenarioDetailModal from '../../components/MarketHub/ScenarioDetailModal';
import UnifiedContentCard from '../../components/MarketHub/UnifiedContentCard';
import styles from './MarketHubPage.module.css';

// 🆕 UPDATE: Import the CORRECT ScenarioChatWindow from ScenariosTab
import ScenarioChatWindow from '../../components/ScenariosTab/ScenarioChatWindow';


const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

// NEW: Updated to accept props for character selection callbacks
const MarketHubPage = ({ 
  onCharacterSelect, 
  onStartChat,
  onScenarioSelect,
  isViewMode = false // Flag to indicate if called from ChatApp view switching
}) => {
  const navigate = useNavigate();
  const { user } = useUser();

  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // NEW: When in view mode (called from ChatApp), always show authenticated version
  // When standalone route, use authentication check with educational fallback
  if (isViewMode) {
    // Called from ChatApp view switching - always show authenticated version
    return (
      <AuthenticatedMarketHub 
        onCharacterSelect={onCharacterSelect}
        onStartChat={onStartChat}
        onScenarioSelect={onScenarioSelect}
        isViewMode={true}
      />
    );
  }

  // Standalone route - check authentication
  if (!isAuthenticated) {
    return <AnonymousMarketHub />;
  }

  // Standalone authenticated route
  return <AuthenticatedMarketHub />;
};

// Anonymous/Public Market Hub View (Educational Modal)
const AnonymousMarketHub = () => {
  const navigate = useNavigate();
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  // ✅ ADD THIS - Get user's custom characters
  const { userCharacters = [] } = usePremiumCharacters();
  
  // Get featured characters for public preview (limited data)
  const { 
    featuredCharacters, 
    loading: featuredLoading 
  } = useFeaturedCharacters({ publicView: true });

  const handleLoginPrompt = () => {
    navigate('/login?redirect=/market-hub');
  };

  const handleRegisterPrompt = () => {
    navigate('/register?redirect=/market-hub');
  };

  const handleCharacterPreview = (character) => {
    setSelectedCharacter({
      ...character,
      isPreview: true // Flag for limited preview mode
    });
  };

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Discover Extraordinary Characters
          </h1>
          <p className={styles.heroSubtitle}>
            Chat with history's greatest minds, explore fascinating personalities, 
            and connect with characters created by our vibrant community
          </p>
          
          <div className={styles.heroActions}>
            <button 
              className={styles.primaryCta}
              onClick={handleRegisterPrompt}
            >
              Start Exploring
            </button>
            <button 
              className={styles.secondaryCta}
              onClick={handleLoginPrompt}
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Featured Characters Preview */}
      <section className={styles.featuredPreview}>
        <div className={styles.sectionContent}>
          <div className={styles.sectionHeader}>
            <TrendingUp className={styles.sectionIcon} size={24} />
            <h2>Featured This Week</h2>
            <p className={styles.sectionSubtext}>
              Discover the most engaging characters in our community
            </p>
          </div>

          {featuredLoading ? (
            <div className={styles.loadingGrid}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.loadingCard} />
              ))}
            </div>
          ) : featuredCharacters?.length > 0 ? (
            <div className={styles.previewGrid}>
              {featuredCharacters.slice(0, 6).map(character => (
                <div 
                  key={character.character_key}
                  className={styles.previewCard}
                  onClick={() => handleCharacterPreview(character)}
                >
                  {getSafeAvatarUrl(character) ? (
                    <img
                      src={getSafeAvatarUrl(character)}
                      alt={character.display_name}
                      onError={createImageErrorHandler(character.display_name)}
                    />
                  ) : (
                    <div className="text-fallback" style={{
                      width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(255, 215, 0, 0.2)', color: '#FFD700',
                      fontSize: '1.2rem', fontWeight: 'bold', borderRadius: '50%'
                    }}>
                      {(character.display_name || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={styles.previewInfo}>
                    <h3 className={styles.previewName}>{character.display_name}</h3>
                    <p className={styles.previewDomain}>{character.expertise_domain}</p>
                    <div className={styles.previewStats}>
                      <span className={styles.previewStat}>
                        <Star size={12} />
                        {character.engagement_30d?.total_likes || 0}
                      </span>
                      <span className={styles.previewCreator}>
                        by {character.creator?.display_name || 'Creator'}
                      </span>
                    </div>
                  </div>
                  <div className={styles.previewOverlay}>
                    <span>Sign in to chat</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.comingSoon}>
              <h3>Featured Characters Coming Soon</h3>
              <p>Our community is creating amazing characters. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorks}>
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>How Market Hub Works</h2>
          
          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <div className={styles.stepIcon}>
                <Search size={24} />
              </div>
              <h3>Discover</h3>
              <p>
                Browse thousands of characters created by our community. 
                From historical figures to original creations, find personalities that fascinate you.
              </p>
            </div>
            
            <div className={styles.step}>
              <div className={styles.stepIcon}>
                <Zap size={24} />
              </div>
              <h3>Engage</h3>
              <p>
                Chat with characters and experience their unique personalities. 
                Each character has been crafted with care by talented creators.
              </p>
            </div>
            
            <div className={styles.step}>
              <div className={styles.stepIcon}>
                <Users size={24} />
              </div>
              <h3>Connect</h3>
              <p>
                Join a community of character creators and enthusiasts. 
                Share your favorites and discover new personalities daily.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Creator Success Stories */}
      <section className={styles.successStories}>
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>Creator Success Stories</h2>
          
          <div className={styles.storiesGrid}>
            <div className={styles.storyCard}>
              <div className={styles.storyQuote}>
                "My historical character reached over 10,000 conversations in the first month. 
                The community engagement has been incredible."
              </div>
              <div className={styles.storyAuthor}>
                <strong>Sarah M.</strong> - History Professor & Creator
              </div>
            </div>
            
            <div className={styles.storyCard}>
              <div className={styles.storyQuote}>
                "Creating characters for Market Hub has become my creative outlet. 
                Seeing people connect with my creations is amazing."
              </div>
              <div className={styles.storyAuthor}>
                <strong>Alex R.</strong> - Writer & Top Creator
              </div>
            </div>
            
            <div className={styles.storyCard}>
              <div className={styles.storyQuote}>
                "The feedback from the community has helped me refine my characters. 
                It's a collaborative creative process."
              </div>
              <div className={styles.storyAuthor}>
                <strong>Jordan K.</strong> - Artist & Creator
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Guidelines */}
      <section className={styles.guidelines}>
        <div className={styles.sectionContent}>
          <div className={styles.guidelinesHeader}>
            <Shield className={styles.sectionIcon} size={24} />
            <h2>Community Standards</h2>
          </div>
          
          <div className={styles.guidelinesGrid}>
            <div className={styles.guideline}>
              <h3>Quality First</h3>
              <p>
                All characters undergo review to ensure high-quality, engaging conversations 
                that respect our community values.
              </p>
            </div>
            
            <div className={styles.guideline}>
              <h3>Respectful Interactions</h3>
              <p>
                We maintain a safe, respectful environment where all users can explore 
                and learn through character interactions.
              </p>
            </div>
            
            <div className={styles.guideline}>
              <h3>Creator Recognition</h3>
              <p>
                Character creators are credited and celebrated. Great characters 
                get featured and gain community recognition.
              </p>
            </div>
            
            <div className={styles.guideline}>
              <h3>Continuous Improvement</h3>
              <p>
                Community feedback helps characters evolve. We support creators 
                in refining and improving their creations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <div className={styles.ctaContent}>
          <h2>Ready to Explore?</h2>
          <p>Join thousands of users discovering amazing characters every day</p>
          <div className={styles.ctaActions}>
            <button 
              className={styles.primaryCta}
              onClick={handleRegisterPrompt}
            >
              Create Account
            </button>
            <button 
              className={styles.secondaryCta}
              onClick={handleLoginPrompt}
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Character Preview Panel - Limited Mode */}
      {selectedCharacter && (
        <div className={styles.previewPanel}>
          <div className={styles.previewOverlay} onClick={() => setSelectedCharacter(null)} />
          <div className={styles.previewContent}>
            <button 
              className={styles.previewClose}
              onClick={() => setSelectedCharacter(null)}
            >
              ×
            </button>
            
            <div className={styles.previewHeader}>
              <img
                src={selectedCharacter.avatar_url}
                alt={selectedCharacter.display_name}
                className={styles.previewPanelAvatar}
              />
              <div>
                <h3>{selectedCharacter.display_name}</h3>
                <p>{selectedCharacter.expertise_domain}</p>
                <p className={styles.previewCreatorInfo}>
                  Created by {selectedCharacter.creator?.display_name || 'Community Creator'}
                </p>
              </div>
            </div>
            
            <div className={styles.previewDescription}>
              <p>{selectedCharacter.short_description}</p>
            </div>
            
            <div className={styles.previewActions}>
              <button 
                className={styles.previewLoginBtn}
                onClick={handleLoginPrompt}
              >
                Sign In to Chat
              </button>
              <button 
                className={styles.previewRegisterBtn}
                onClick={handleRegisterPrompt}
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// NEW: Enhanced Authenticated Market Hub for view integration
const AuthenticatedMarketHub = ({ 
  onCharacterSelect, 
  onStartChat, 
  onScenarioSelect,  // ✅ ADD THIS - callback to switch views and open scenario
  isViewMode = false 
}) => {
  const navigate = useNavigate();
  const { user } = useUser();
  // ✅ ADD THIS - Get user's custom characters (even though it will be empty for anonymous users)
  const { userCharacters = [] } = usePremiumCharacters();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    archetype: '',
    domain: '',
    sort: 'trending'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // 🆕 ADD: State for active scenario (like MyScenariosPanel pattern)
  const [activeScenario, setActiveScenario] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);

  // 🆕 UPDATE: Add includeScenarios parameter to hook
  const { 
    characters, 
    scenarios,  // 🆕 ADD this
    loading, 
    error, 
    pagination,
    refetch 
  } = useMarketHub({
    page: currentPage,
    search: searchQuery,
    filters: selectedFilters,
    perPage: 20,
    includeScenarios: true  // 🆕 ADD this to enable scenarios
  });

  const { 
    featuredCharacters, 
    loading: featuredLoading 
  } = useFeaturedCharacters();

  // 🆕 ADD: Scenario engagement hook
  const { engageWithScenario } = useScenarioEngagement();
  
  // Existing character engagement hook
  const { engageWithCharacter } = useCharacterEngagement();

  // 🆕 ADD: Combine characters and scenarios into one array
  const allContent = React.useMemo(() => {
    return [...characters, ...scenarios];
  }, [characters, scenarios]);

  // ✅ UPDATED: Handle content selection - characters show modal, scenarios direct to debate
  const handleCardClick = (item) => {
    console.log('🔍 handleCardClick received:', item);
    if (item.content_type === 'character') {
      // ✅ Transform the character data like handleCharacterSelect does
      const transformedCharacter = {
        name: item.display_name || item.name || item.character_key,
        description: item.short_description || item.description || '',
        key: item.character_key || item.key,
        thumbnailUrl: item.avatar_url || item.thumbnailUrl || `/images/${item.character_key}.jpg`,
        display_name: item.display_name,
        character_key: item.character_key,
        short_description: item.short_description,
        avatar_url: item.avatar_url
      };

      console.log('✅ Transformed character:', transformedCharacter);
      setSelectedCharacter(transformedCharacter);

    } else if (item.content_type === 'scenario') {
      // ✅ ENSURE scenario has required id field
      const scenarioWithId = {
        ...item,
        id: item.id || item.scenario_id // Use scenario_id if id is missing
      };
      console.log('📝 Setting selected scenario:', scenarioWithId);
      setSelectedScenario(scenarioWithId);
    }
  };

  // 🆕 ADD: Handle closing scenario chat window
  const handleCloseScenario = () => {
    console.log('🔙 Closing scenario chat window');
    setActiveScenario(null);
  };

  // 🆕 ADD: If scenario is active, show fullscreen chat window
  if (activeScenario) {
    console.log('🔄 Rendering ScenarioChatWindow with:', activeScenario);
    return (
      <ScenarioChatWindow
        scenario={activeScenario}
        onBack={handleCloseScenario}
        theme="awakeverse"
      />
    );
  }

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // NEW: Enhanced navigation handlers for view integration
  const handleBackToCharacters = () => {
    if (isViewMode) {
      // When in view mode, don't navigate - let parent handle view switching
      console.log('Back clicked in view mode - parent should handle this');
    } else {
      // Standalone mode - navigate normally
      navigate('/chat');
    }
  };

  const handleStartChat = (characterKey) => {
    if (isViewMode && onStartChat) {
      // Use callback when in view mode
      onStartChat(characterKey);
    } else {
      // Standalone mode - navigate normally
      navigate(`/chat?character=${characterKey}`);
    }
  };

  // ✅ FIXED: Handle start debate with proper scenario data
  const handleStartDebate = async (scenario) => {
    console.log('🎭 handleStartDebate called with scenario:', scenario);
    setSelectedScenario(null); // Close modal first

    try {
      // ============================================================================
      // STEP 1: Start debate session via backend
      // ============================================================================

      console.log('📡 Calling backend to start debate for scenario:', scenario.scenario_id);
      const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';
      const startResponse = await fetch(
        `${API_BASE}/api/debate/scenarios/${scenario.scenario_id}/start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrf
          },
          credentials: 'include'
        }
      );

      if (!startResponse.ok) {
        const errorData = await startResponse.json().catch(() => ({}));

        // Handle specific error cases
        if (startResponse.status === 403) {
          alert('Unlimited tier required to start debates');
          return;
        }

        if (startResponse.status === 404) {
          alert('Scenario not found or not accessible');
          return;
        }

        throw new Error(errorData.error || 'Failed to start debate');
      }

      const debateData = await startResponse.json();

      console.log('✅ Backend response:', debateData);
      console.log(`${debateData.is_market_hub ? '🌍 Market Hub' : '📝 My Scenarios'} debate started`);

      // ============================================================================
      // STEP 2: Build props for ScenarioChatWindow (matching ScenariosTab pattern)
      // ============================================================================

      const scenarioForChat = {
        // IDs
        id: scenario.scenario_id || scenario.id,
        debateId: debateData.debate_id,
        scenarioId: scenario.scenario_id || scenario.id,

        // Display info
        title: debateData.title || scenario.title,
        description: scenario.description || '',
        category: scenario.category || '',

        // Characters
        participants: debateData.characters || scenario.character_keys || [],
        character_keys: debateData.characters || scenario.character_keys || [],

        // State flags
        initialized: !!debateData.debate_id,  // ✅ Only true if we have debate_id
        is_market_hub: debateData.is_market_hub || false,

        // Existing messages (if resuming)
        messages: debateData.messages || [],

        // Usage data (will be loaded by ScenarioChatWindow)
        usageData: {
          questionsAsked: 0,
          tier: 'unlimited',
          limit: null,
          limitReached: false,
          remaining: null
        }
      };

      console.log('📝 Opening ScenarioChatWindow with:', {
        debateId: scenarioForChat.debateId,
        scenarioId: scenarioForChat.scenarioId,
        initialized: scenarioForChat.initialized,
        title: scenarioForChat.title,
        participants: scenarioForChat.participants,
        is_market_hub: scenarioForChat.is_market_hub,
        messageCount: scenarioForChat.messages.length
      });

      // ============================================================================
      // STEP 3: Open ScenarioChatWindow
      // ============================================================================

      // ✅ Signal parent to switch to Scenarios view

      if (isViewMode && onScenarioSelect) {
        console.log('🌍 Market Hub: Calling onScenarioSelect callback');
        onScenarioSelect(scenarioForChat);
      } else {
        console.warn('⚠️ No callback');
        alert('Please access Market Hub from main app');
      }

    } catch (error) {


      // User-friendly error messages
      const errorMessage = error.message === 'Failed to fetch'
        ? 'Network error. Please check your connection.'
        : error.message || 'Failed to start debate. Please try again.';

      alert(errorMessage);
    }
  };

  const handleScenarioSelectFromModal = (scenario) => {
    if (isViewMode && onScenarioSelect) {
      onScenarioSelect(scenario);
      setSelectedScenario(null);
    } else {
      setSelectedScenario(null);
    }
  };

  const handleCharacterDetails = (character) => {
    setSelectedCharacter(character);
  };

  // NEW: Enhanced character selection for discovered flow
  const handleCharacterSelect = (character) => {
    const transformedCharacter = {
      name: character.display_name || character.name || character.character_key,
      description: character.short_description || character.description || '',
      key: character.character_key || character.key,
      thumbnailUrl: character.avatar_url || character.thumbnailUrl || `/images/${character.character_key}.jpg`,
      display_name: character.display_name,
      character_key: character.character_key,
      short_description: character.short_description,
      avatar_url: character.avatar_url
    };

    setSelectedCharacter(transformedCharacter);
  };

  // NEW: Handle character selection from detail panel
  const handleCharacterSelectFromPanel = (character) => {
    if (isViewMode && onCharacterSelect) {
      // Add to discovered characters when in view mode
      onCharacterSelect(character);
      // Close the detail panel since we're switching views
      setSelectedCharacter(null);
    } else {
      // Standalone mode - just close panel
      setSelectedCharacter(null);
    }
  };

  // 🆕 ADD: Handle engagement (unified for both types)
  const handleEngage = async (item, engagementType) => {
    try {
      if (item.content_type === 'character') {
        await engageWithCharacter(item.character_id, engagementType);
      } else if (item.content_type === 'scenario') {
        await engageWithScenario(item.scenario_id, engagementType);
      }
      // Optionally show success message
      console.log(`${engagementType} recorded for ${item.content_type}`);
    } catch (error) {
      console.error('Engagement failed:', error);
      // Optionally show error message
    }
  };

  const handleChatClick = (characterKey) => {
    navigate(`/chat/${characterKey}`);
  };

  // Search and filter handlers
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedFilters({
      archetype: '',
      domain: '',
      sort: 'trending'
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (pagination?.has_next) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination?.has_prev) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Available filter options
  const archetypeOptions = [
    'Sage', 'Warrior', 'Explorer', 'Ruler', 'Creator', 'Caregiver', 
    'Innocent', 'Magician', 'Hero', 'Rebel', 'Lover', 'Jester'
  ];

  const domainOptions = [
    'Philosophy', 'Science', 'History', 'Art', 'Literature', 'Politics',
    'Technology', 'Medicine', 'Business', 'Education', 'Entertainment', 'Sports'
  ];

  const sortOptions = [
    { value: 'trending', label: 'Trending' },
    { value: 'newest', label: 'Newest' },
    { value: 'popular', label: 'Most Popular' }
  ];

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h2>Unable to load Market Hub</h2>
          <p>Please check your connection and try again.</p>
          <button onClick={refetch} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header - Modified for view mode */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {/* NEW: Only show back button in standalone mode */}
          {!isViewMode && (
            <button 
              className={styles.backButton}
              onClick={handleBackToCharacters}
              aria-label="Back to characters"
            >
              <ArrowLeft size={20} />
              <span>Back to Characters</span>
            </button>
          )}
          
          <div className={styles.titleSection}>
            <h1 className={styles.title}>Market Hub</h1>
            <p className={styles.subtitle}>
              {isViewMode 
                ? 'Discover characters and add them to your collection'
                : 'Discover amazing characters from our community'
              }
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className={styles.searchSection}>
          <div className={styles.searchBar}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Search characters, creators, or domains..."
              value={searchQuery}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
          </div>
          
          <button 
            className={`${styles.filterToggle} ${showFilters ? styles.active : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            {!isMobile && <span>Filters</span>}
          </button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className={styles.filtersPanel}>
            <div className={styles.filterGroup}>
              <label>Archetype</label>
              <select 
                value={selectedFilters.archetype}
                onChange={(e) => handleFilterChange('archetype', e.target.value)}
              >
                <option value="">All Archetypes</option>
                {archetypeOptions.map(arch => (
                  <option key={arch} value={arch}>{arch}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Domain</label>
              <select 
                value={selectedFilters.domain}
                onChange={(e) => handleFilterChange('domain', e.target.value)}
              >
                <option value="">All Domains</option>
                {domainOptions.map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Sort By</label>
              <select 
                value={selectedFilters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button 
              className={styles.clearFilters}
              onClick={handleClearFilters}
            >
              Clear All
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.content}>
          {/* Featured Characters Section */}
          {!searchQuery && !Object.values(selectedFilters).some(v => v && v !== 'trending') && (
            <section className={styles.featuredSection}>
              <div className={styles.sectionHeader}>
                <TrendingUp className={styles.sectionIcon} size={20} />
                <h2>Featured This Week</h2>
              </div>
              <FeaturedCarousel 
                characters={featuredCharacters}
                loading={featuredLoading}
                onCharacterClick={handleCharacterDetails}
                onChatClick={handleStartChat}
              />
            </section>
          )}

          {/* Browse Results */}
          <section className={styles.browseSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.resultsInfo}>
                <h2>
                  {searchQuery ? `Results for "${searchQuery}"` : 'Browse Creators & Scenarios'}
                </h2>
                {pagination && (
                  <span className={styles.resultCount}>
                    {pagination?.character_count || 0} characters, {pagination?.scenario_count || 0} scenarios
                  </span>
                )}
              </div>
            </div>

            {loading ? (
              <div className={styles.loadingGrid}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={styles.loadingCard} />
                ))}
              </div>
            ) : allContent.length > 0 ? (
              <>
                {/* 🆕 REPLACE YOUR EXISTING CHARACTER GRID WITH THIS */}
                <div className={styles.charactersGrid}>
                  {allContent.map((item) => (
                    <UnifiedContentCard
                      key={
                        item.content_type === 'character' 
                          ? `char-${item.character_id}` 
                          : `scen-${item.scenario_id}`
                      }
                      item={item}
                      onCardClick={handleCardClick}
                      onChatClick={handleStartChat}
                      onEngage={handleEngage}
                      userCharacters={userCharacters}  // ✅ ADD THIS LINE
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className={styles.pagination}>
                    <button 
                      onClick={handlePrevPage}
                      disabled={!pagination.has_prev}
                      className={styles.paginationButton}
                    >
                      Previous
                    </button>
                    
                    <div className={styles.pageNumbers}>
                      {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`${styles.pageNumber} ${
                              page === pagination.page ? styles.active : ''
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button 
                      onClick={handleNextPage}
                      disabled={!pagination.has_next}
                      className={styles.paginationButton}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>
                <h3>No content found</h3>
                <p>Try adjusting your search or filters</p>
                <button onClick={handleClearFilters} className={styles.clearButton}>
                  Clear Filters
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Leaderboard Sidebar (Desktop) / Section (Mobile) */}
        {!isMobile ? (
          <aside className={styles.sidebar}>
            <LeaderboardSection />
          </aside>
        ) : (
          <section className={styles.mobileLeaderboard}>
            <LeaderboardSection />
          </section>
        )}
      </main>

      {/* Character Detail Panel */}
      {selectedCharacter && (
        <CharacterDetailPanel
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
          onStartChat={handleStartChat}
          onCharacterSelect={isViewMode ? handleCharacterSelectFromPanel : undefined}
          showDiscoverAction={isViewMode}
        />
      )}
      
      {/* Scenario Detail Modal - FIXED with proper onStartDebate prop */}
      {selectedScenario && (
        <ScenarioDetailModal
          scenario={selectedScenario}
          onClose={() => setSelectedScenario(null)}
          onStartDebate={handleStartDebate} // ✅ FIXED: Pass the correct function
          onScenarioSelect={isViewMode ? handleScenarioSelectFromModal : undefined}
          showDiscoverAction={isViewMode}
        />
      )}
    </div>
  );
};

export default MarketHubPage;