import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, TrendingUp, Trophy, Users, Star, Shield, Zap } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
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
import SEOHead from '../SEO/SEOHead'

// ✅ NEW: Feed tab
import FeedTab, { FeedStatsCard } from './FeedTab';
import { useActiveTopics } from '../../hooks/useActiveTopics';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

// NEW: Enhanced Authenticated Market Hub for view integration - MOVED TO TOP
const AuthenticatedMarketHub = ({ 
  onCharacterSelect, 
  onStartChat, 
  onScenarioSelect,  // ✅ ADD THIS - callback to switch views and open scenario
  isViewMode = false 
}) => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser(); 
  // ✅ ADD THIS - Get user's custom characters (even though it will be empty for anonymous users)
  const { userCharacters = [] } = usePremiumCharacters();
  // ✅ ADD THIS CHECK
  // ✅ ADD DEFENSIVE CHECK (like ScenariosTab line 47)
  if (userLoading || !user) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p>Loading Market Hub...</p>
      </div>
    );
  }
  
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

  // ✅ NEW: Tab state — Feed is default
  const [activeTab, setActiveTab] = useState('feed');

  // ✅ NEW: Active topics for ticker (only fetches when on feed tab)
  const { topics: activeTopics } = useActiveTopics({ enabled: activeTab === 'feed' });

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
    // MarketHubPage.jsx
  const allContent = React.useMemo(() => {
    console.log('🔄 Force mixing content with dynamic ratio...');

    // Defensive: ensure arrays exist and annotate
    const chars = (characters || []).map(c => ({
      ...c,
      content_type: 'character',
      total_engagement_score: c.total_engagement_score ?? 0
    }));

    const scens = (scenarios || []).map(s => ({
      ...s,
      content_type: 'scenario',
      total_engagement_score: s.total_engagement_score ?? 0
    }));

    // Sort each type separately according to user's preference
    const sortFn = (a, b) => {
      switch (selectedFilters.sort) {
        case 'newest':
          const dateA = a.market_published_at ? new Date(a.market_published_at) : new Date(0);
          const dateB = b.market_published_at ? new Date(b.market_published_at) : new Date(0);
          return dateB - dateA;
        case 'popular':
          return (b.engagement_30d?.total_likes || 0) - (a.engagement_30d?.total_likes || 0);
        case 'trending':
        default:
          return (b.total_engagement_score || 0) - (a.total_engagement_score || 0);
      }
    };

    const sortedChars = [...chars].sort(sortFn);
    const sortedScens = [...scens].sort(sortFn);

    // 🆕 DYNAMIC RATIO: Calculate optimal ratio based on counts
    let CHAR_RATIO = 5; // Default
    let SCEN_RATIO = 1; // Default

    if (sortedScens.length > 0 && sortedChars.length > 0) {
      // Calculate how many characters per scenario for even distribution
      const optimalRatio = sortedChars.length / sortedScens.length;

      if (optimalRatio <= 1) {
        // More scenarios than characters: alternate 1:1 or favor scenarios
        CHAR_RATIO = 1;
        SCEN_RATIO = 1;
      } else if (optimalRatio <= 3) {
        // Close counts: use 3:1 or 2:1
        CHAR_RATIO = Math.ceil(optimalRatio);
        SCEN_RATIO = 1;
      } else {
        // Many more characters: cap at 5:1 to keep scenarios visible
        CHAR_RATIO = Math.min(Math.ceil(optimalRatio), 5);
        SCEN_RATIO = 1;
      }
    }

    console.log('📊 Dynamic ratio calculated:', {
      charCount: sortedChars.length,
      scenCount: sortedScens.length,
      ratio: `${CHAR_RATIO}:${SCEN_RATIO}`
    });

    // Interleave with calculated ratio
    const result = [];
    let charIdx = 0;
    let scenIdx = 0;

    while (charIdx < sortedChars.length || scenIdx < sortedScens.length) {
      // Add characters according to ratio
      for (let i = 0; i < CHAR_RATIO && charIdx < sortedChars.length; i++) {
        result.push(sortedChars[charIdx++]);
      }

      // Add scenarios according to ratio
      for (let i = 0; i < SCEN_RATIO && scenIdx < sortedScens.length; i++) {
        result.push(sortedScens[scenIdx++]);
      }
    }

    console.log('✅ Mixed result:', {
      total: result.length,
      pattern: result.slice(0, 12).map(c => c.content_type)
    });

    return result;
  }, [characters, scenarios, selectedFilters.sort]);

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
      <SEOHead
        title="Market Hub — Discover AI Characters and Templates | AwakeVerse"
        description="Browse and use creator-built AI characters and Dialogue templates on AwakeVerse. Find certified characters across history, mythology, fiction, and professional domains."
        url="https://awakeverse.com/market-hub"
      />
      {/* ============================================================================
          UPDATED: Compact Premium Header - No Hero/Banner
          ============================================================================ */}
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          {/* NEW: Only show back button in standalone mode */}
          {!isViewMode && (
            <button 
              className={styles.backButton}
              onClick={handleBackToCharacters}
              aria-label="Back to characters"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
          )}
          
          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>Market Hub</h1>
            <p className={styles.pageSubtitle}>
              {isViewMode 
                ? 'Discover characters and add them to your collection'
                : 'The living world of AI personas'
              }
            </p>
          </div>
        </div>

        {/* ============================================================================
            UPDATED: Compact Search & Filters Row
            ============================================================================ */}
        <div className={styles.controlsRow}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Search characters, creators, or domains..."
              value={searchQuery}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
          </div>
          
          {/* Filter toggle only shown on Discover tab */}
          {activeTab === 'discover' && (
            <button 
              className={`${styles.filterToggle} ${showFilters ? styles.active : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              {!isMobile && <span>Filters</span>}
            </button>
          )}
        </div>

        {/* Expandable Filters — only on Discover tab */}
        {activeTab === 'discover' && showFilters && (
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

        {/* ✅ NEW: Tab Navigation */}
        <nav className={styles.tabNav}>
          <button
            className={`${styles.tab} ${activeTab === 'feed' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            <span className={styles.tabLabel}>Feed</span>
            <span className={styles.tabDesc}>AI personas reacting to today's world</span>
          </button>

          <button
            className={`${styles.tab} ${activeTab === 'discover' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            <span className={styles.tabLabel}>Discover</span>
            <span className={styles.tabDesc}>Browse and chat with published characters</span>
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.contentArea}>

          {/* ✅ NEW: Feed tab */}
          {activeTab === 'feed' && (
            <FeedTab
              isAuthenticated={!!user}
              topics={activeTopics}
            />
          )}

          {/* ✅ Discover tab: existing content unchanged */}
          {activeTab === 'discover' && (
            <>
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
                      {searchQuery ? `Results for "${searchQuery}"` : 'Browse Characters & Scenarios'}
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
                    {/* 🆕 UPDATED: Content Grid with Design System Spacing */}
                    <div className={styles.contentGrid}>
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
            </>
          )}
        </div>

        {/* Leaderboard Sidebar (Desktop) / Section (Mobile) — always visible */}
        {!isMobile ? (
          <aside className={styles.sidebar}>
            {activeTab === 'feed' && <FeedStatsCard />}
            <LeaderboardSection />
          </aside>
        ) : (
          <section className={styles.mobileLeaderboard}>
            {activeTab === 'feed' && <FeedStatsCard />}
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

// NEW: Updated to accept props for character selection callbacks - MOVED TO BOTTOM
const MarketHubPage = ({ 
  onCharacterSelect, 
  onStartChat,
  onScenarioSelect,
  isViewMode = false // Flag to indicate if called from ChatApp view switching
}) => {
  const navigate = useNavigate();
  const { user, loading } = useUser();

  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

   // ✅ CRITICAL: Check loading state BEFORE using user
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p>Loading Market Hub...</p>
      </div>
    );
  }

  // ✅ CRITICAL: Now safe to check authentication
  const isAuthenticated = !!user;

  // NEW: When in view mode (called from ChatApp), always show authenticated version
  // When standalone route, use authentication check with educational fallback
  if (isViewMode) {
    // Called from ChatApp view switching - always show authenticated version
    return (
      <>
        <SEOHead
          title="Market Hub — Discover AI Characters and Templates | AwakeVerse"
          description="Browse and use creator-built AI characters and Dialogue templates on AwakeVerse. Find certified characters across history, mythology, fiction, and professional domains."
          url="https://awakeverse.com/market-hub"
        />
        <AuthenticatedMarketHub 
          onCharacterSelect={onCharacterSelect}
          onStartChat={onStartChat}
          onScenarioSelect={onScenarioSelect}
          isViewMode={true}
        />
      </>
      );
  }


  // Standalone authenticated route
  // Line 71-72 should be:
  return (
    <AuthenticatedMarketHub 
      onCharacterSelect={onCharacterSelect}
      onStartChat={onStartChat}
      onScenarioSelect={onScenarioSelect}
      isViewMode={false}
    />
  );
};

export default MarketHubPage;