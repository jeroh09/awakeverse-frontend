// src/components/MarketHub/MarketHubPage.jsx - PRODUCTION READY
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, TrendingUp, Trophy, Users, Star, Shield, Zap, X } from 'lucide-react';
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

// Import the CORRECT ScenarioChatWindow from ScenariosTab
import ScenarioChatWindow from '../../components/ScenariosTab/ScenarioChatWindow';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

// Educational Modal Component
const EducationalSignupModal = ({ 
  isOpen, 
  onClose, 
  onSignup, 
  onLogin, 
  context = 'access this feature' 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className={styles.modalIcon}>
          <Zap size={32} />
        </div>
        
        <h3 className={styles.modalTitle}>Join the AwakeVerse Community</h3>
        <p className={styles.modalText}>Sign up to {context} and explore thousands of characters and scenarios</p>
        
        <div className={styles.modalActions}>
          <button 
            onClick={onSignup} 
            className={styles.primaryCta}
          >
            Create Free Account
          </button>
          <button 
            onClick={onLogin} 
            className={styles.secondaryCta}
          >
            Sign In
          </button>
          <button 
            onClick={onClose} 
            className={styles.tertiaryCta}
          >
            Continue Exploring
          </button>
        </div>
        
        <p className={styles.modalFooter}>
          Join thousands of users discovering amazing characters every day
        </p>
      </div>
    </div>
  );
};

// Enhanced Authenticated Market Hub for view integration
const AuthenticatedMarketHub = ({ 
  onCharacterSelect, 
  onStartChat, 
  onScenarioSelect,
  isViewMode = false 
}) => {
  const navigate = useNavigate();
  const { user } = useUser();
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
  const [activeScenario, setActiveScenario] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);

  // Market hub data with scenarios
  const { 
    characters, 
    scenarios,
    loading, 
    error, 
    pagination,
    refetch 
  } = useMarketHub({
    page: currentPage,
    search: searchQuery,
    filters: selectedFilters,
    perPage: 20,
    includeScenarios: true
  });

  const { 
    featuredCharacters, 
    loading: featuredLoading 
  } = useFeaturedCharacters();

  // Engagement hooks
  const { engageWithScenario } = useScenarioEngagement();
  const { engageWithCharacter } = useCharacterEngagement();

  // Combine characters and scenarios
  const allContent = React.useMemo(() => {
    return [...characters, ...scenarios];
  }, [characters, scenarios]);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Content selection handler
  const handleCardClick = (item) => {
    if (item.content_type === 'character') {
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
      setSelectedCharacter(transformedCharacter);
    } else if (item.content_type === 'scenario') {
      const scenarioWithId = {
        ...item,
        id: item.id || item.scenario_id
      };
      setSelectedScenario(scenarioWithId);
    }
  };

  // Navigation handlers
  const handleBackToCharacters = () => {
    if (isViewMode) {
      console.log('Back clicked in view mode - parent should handle this');
    } else {
      navigate('/chat');
    }
  };

  const handleStartChat = (characterKey) => {
    if (isViewMode && onStartChat) {
      onStartChat(characterKey);
    } else {
      navigate(`/chat?character=${characterKey}`);
    }
  };

  // Scenario debate handler
  const handleStartDebate = async (scenario) => {
    setSelectedScenario(null);

    try {
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

      const scenarioForChat = {
        id: scenario.scenario_id || scenario.id,
        debateId: debateData.debate_id,
        scenarioId: scenario.scenario_id || scenario.id,
        title: debateData.title || scenario.title,
        description: scenario.description || '',
        category: scenario.category || '',
        participants: debateData.characters || scenario.character_keys || [],
        character_keys: debateData.characters || scenario.character_keys || [],
        initialized: !!debateData.debate_id,
        is_market_hub: debateData.is_market_hub || false,
        messages: debateData.messages || [],
        usageData: {
          questionsAsked: 0,
          tier: 'unlimited',
          limit: null,
          limitReached: false,
          remaining: null
        }
      };

      if (isViewMode && onScenarioSelect) {
        onScenarioSelect(scenarioForChat);
      } else {
        console.warn('No callback available');
        alert('Please access Market Hub from main app');
      }

    } catch (error) {
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

  const handleCharacterSelectFromPanel = (character) => {
    if (isViewMode && onCharacterSelect) {
      onCharacterSelect(character);
      setSelectedCharacter(null);
    } else {
      setSelectedCharacter(null);
    }
  };

  const handleEngage = async (item, engagementType) => {
    try {
      if (item.content_type === 'character') {
        await engageWithCharacter(item.character_id, engagementType);
      } else if (item.content_type === 'scenario') {
        await engageWithScenario(item.scenario_id, engagementType);
      }
    } catch (error) {
      console.error('Engagement failed:', error);
    }
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

  // Filter options
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

  if (activeScenario) {
    return (
      <ScenarioChatWindow
        scenario={activeScenario}
        onBack={() => setActiveScenario(null)}
        theme="awakeverse"
      />
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
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
                onCharacterClick={(character) => setSelectedCharacter(character)}
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
                      userCharacters={userCharacters}
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

        {/* Leaderboard Sidebar */}
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
      
      {/* Scenario Detail Modal */}
      {selectedScenario && (
        <ScenarioDetailModal
          scenario={selectedScenario}
          onClose={() => setSelectedScenario(null)}
          onStartDebate={handleStartDebate}
          onScenarioSelect={isViewMode ? handleScenarioSelectFromModal : undefined}
          showDiscoverAction={isViewMode}
        />
      )}
    </div>
  );
};

// Anonymous Market Hub with Educational Modal
const AnonymousMarketHub = () => {
  const navigate = useNavigate();
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [showEducationalModal, setShowEducationalModal] = useState(false);
  const [modalContext, setModalContext] = useState('');

  // Get featured characters for public preview
  const { 
    featuredCharacters, 
    loading: featuredLoading 
  } = useFeaturedCharacters();

  // Educational modal handlers
  const handleEducationalAction = (context) => {
    setModalContext(context);
    setShowEducationalModal(true);
  };

  const handleSignup = () => {
    navigate('/register?redirect=/market-hub');
  };

  const handleLogin = () => {
    navigate('/login?redirect=/market-hub');
  };

  const handleCloseModal = () => {
    setShowEducationalModal(false);
    setModalContext('');
  };

  const handleCharacterPreview = (character) => {
    setSelectedCharacter({
      ...character,
      isPreview: true
    });
  };

  const handleChatPrompt = (character) => {
    handleEducationalAction(`chat with ${character.display_name}`);
  };

  const handleDebatePrompt = (scenario) => {
    handleEducationalAction(`join the "${scenario.title}" debate`);
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
              onClick={() => handleEducationalAction('explore the Market Hub')}
            >
              Start Exploring
            </button>
            <button 
              className={styles.secondaryCta}
              onClick={handleLogin}
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
                      className={styles.previewImage}
                    />
                  ) : (
                    <div className={styles.previewFallback}>
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
                  <div 
                    className={styles.previewOverlay}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChatPrompt(character);
                    }}
                  >
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

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <div className={styles.ctaContent}>
          <h2>Ready to Explore?</h2>
          <p>Join thousands of users discovering amazing characters every day</p>
          <div className={styles.ctaActions}>
            <button 
              className={styles.primaryCta}
              onClick={handleSignup}
            >
              Create Account
            </button>
            <button 
              className={styles.secondaryCta}
              onClick={handleLogin}
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Character Preview Panel */}
      {selectedCharacter && (
        <div className={styles.previewPanel}>
          <div className={styles.previewOverlayBg} onClick={() => setSelectedCharacter(null)} />
          <div className={styles.previewContent}>
            <button 
              className={styles.previewClose}
              onClick={() => setSelectedCharacter(null)}
            >
              ×
            </button>
            
            <div className={styles.previewHeader}>
              {getSafeAvatarUrl(selectedCharacter) ? (
                <img
                  src={getSafeAvatarUrl(selectedCharacter)}
                  alt={selectedCharacter.display_name}
                  className={styles.previewPanelAvatar}
                />
              ) : (
                <div className={styles.previewPanelFallback}>
                  {(selectedCharacter.display_name || 'C').charAt(0).toUpperCase()}
                </div>
              )}
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
                onClick={() => handleEducationalAction(`chat with ${selectedCharacter.display_name}`)}
              >
                Sign In to Chat
              </button>
              <button 
                className={styles.previewRegisterBtn}
                onClick={handleSignup}
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Educational Modal */}
      <EducationalSignupModal
        isOpen={showEducationalModal}
        onClose={handleCloseModal}
        onSignup={handleSignup}
        onLogin={handleLogin}
        context={modalContext}
      />
    </div>
  );
};

// Main MarketHubPage Component
const MarketHubPage = ({ 
  onCharacterSelect, 
  onStartChat,
  onScenarioSelect,
  isViewMode = false
}) => {
  const { user, loading } = useUser();

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p>Loading Market Hub...</p>
      </div>
    );
  }

  const isAuthenticated = !!user;

  // View mode (from ChatApp)
  if (isViewMode) {
    return (
      <AuthenticatedMarketHub 
        onCharacterSelect={onCharacterSelect}
        onStartChat={onStartChat}
        onScenarioSelect={onScenarioSelect}
        isViewMode={true}
      />
    );
  }

  // Standalone mode
  if (!isAuthenticated) {
    return <AnonymousMarketHub />;
  }

  // Authenticated standalone
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