// src/components/MarketHub/MarketHubPage.jsx - Fixed for ChatApp View Integration
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, TrendingUp, Trophy, Users, Star, Shield, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import EnhancedCharacterCard from './EnhancedCharacterCard';
import FeaturedCarousel from './FeaturedCarousel';
import LeaderboardSection from './LeaderboardSection';
import CharacterDetailPanel from '../CharacterDetailPanel/CharacterDetailPanel';
import { useMarketHub } from '../../hooks/useMarketHub';
import { useFeaturedCharacters } from '../../hooks/useFeaturedCharacters';
import { getSafeAvatarUrl, createImageErrorHandler } from '../../utils/imageUtils';
import styles from './MarketHubPage.module.css';

// NEW: Updated to accept props for character selection callbacks
const MarketHubPage = ({ 
  onCharacterSelect, 
  onStartChat,
  isViewMode = false // Flag to indicate if called from ChatApp view switching
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
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
  isViewMode = false 
}) => {
  const navigate = useNavigate();
  const { user } = useUser();
  
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

  // Custom hooks for data
  const { 
    characters, 
    loading, 
    error, 
    pagination,
    refetch 
  } = useMarketHub({
    page: currentPage,
    search: searchQuery,
    filters: selectedFilters,
    perPage: 20
  });

  const { 
    featuredCharacters, 
    loading: featuredLoading 
  } = useFeaturedCharacters();

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
                  {searchQuery ? `Results for "${searchQuery}"` : 'All Characters'}
                </h2>
                {pagination && (
                  <span className={styles.resultCount}>
                    {pagination.total} characters found
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
            ) : characters.length > 0 ? (
              <>
                <div className={styles.charactersGrid}>
                  {characters.map(character => (
                    <EnhancedCharacterCard
                      key={character.character_key}
                      character={character}
                      isOwner={character.creator?.user_id === user?.id}
                      showEarnings={character.creator?.user_id === user?.id}
                      onChatClick={handleStartChat}
                      onCardClick={handleCharacterSelect}
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
                <h3>No characters found</h3>
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
    </div>
  );
};

export default MarketHubPage;