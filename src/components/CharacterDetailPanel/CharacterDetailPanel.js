// src/components/CharacterDetailPanel/CharacterDetailPanel.js - COMPLETE UPDATED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import floatingGlassStyles from './CharacterDetailPanel.module.css';
import metadataStyles from './CharacterMetadata.module.css';
import { extractCharacterMetadata } from '../../utils/characterExtractor';
import api from '../../api';

const CharacterDetailPanel = ({ 
  character, 
  onClose, 
  onStartChat, 
  onCharacterSelect,
  showDiscoverAction
}) => {
  const [useOrganicBlob, setUseOrganicBlob] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [extractedMetadata, setExtractedMetadata] = useState(null);
  const [panelTab, setPanelTab] = useState('about');   // 'about' | 'posts'
  const [charPosts, setCharPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState(null);
  
  const styles = floatingGlassStyles;
  const metaStyles = metadataStyles;

  if (!character) return null;

  // ✅ FIXED: Handle both data structures with better fallbacks
  const displayName = character.name || character.display_name || character.character_key || 'Character';
  const description = character.description || character.short_description || 'No description available.';
  const imageUrl = character.thumbnailUrl || character.avatar_url || `/images/${character.character_key || character.key}.jpg`;
  const characterKey = character.key || character.character_key;

  // ✅ NEW: Extract metadata when character or description changes
  useEffect(() => {
    if (character && description) {
      const metadata = extractCharacterMetadata({
        ...character,
        description: description
      });
      setExtractedMetadata(metadata);
    }
  }, [character, description]);

  // Fetch character posts when Posts tab is activated
  const fetchCharPosts = useCallback(async () => {
    const charId = character?.id;
    if (!charId) return;
    setPostsLoading(true);
    setPostsError(null);
    try {
      const res = await api.get(`/social/character/${charId}/posts?per_page=10`);
      if (res.data?.status === 'success') {
        setCharPosts(res.data.posts || []);
      }
    } catch (err) {
      setPostsError('Could not load posts');
    } finally {
      setPostsLoading(false);
    }
  }, [character?.id]);

  useEffect(() => {
    if (panelTab === 'posts' && charPosts.length === 0 && !postsLoading) {
      fetchCharPosts();
    }
  }, [panelTab, fetchCharPosts, charPosts.length, postsLoading]);

  // ✅ NEW: Helper function to handle both discover + chat
  const handleStartChatWithDiscover = () => {
    // Step 1: Add to discovered (if in view mode)
    if (showDiscoverAction && onCharacterSelect) {
      onCharacterSelect(character);
    }
    
    // Step 2: Start chat
    onStartChat(character);
  };

  // ✅ NEW: Tooltip handlers
  const handleShowTooltip = (type, content) => {
    setActiveTooltip({ type, content });
  };

  const handleHideTooltip = () => {
    setActiveTooltip(null);
  };

  // ✅ NEW: Render metadata section function
  const renderMetadataSection = () => {
    if (!extractedMetadata || !extractedMetadata.hasExtractedMetadata) {
      return null;
    }

    return (
      <div className={metaStyles.metadataSection}>
        <div className={metaStyles.sectionTitle}>
          <span>🔍</span> Extracted Insights
        </div>
        
        <div className={metaStyles.metadataGrid}>
          {/* Era Card */}
          <div 
            className={metaStyles.metadataCard}
            onClick={() => handleShowTooltip('era', extractedMetadata.extractedEra)}
            onMouseLeave={handleHideTooltip}
            onMouseEnter={() => handleShowTooltip('era', extractedMetadata.extractedEra)}
          >
            <div className={metaStyles.metadataLabel}>Historical Era</div>
            <div className={metaStyles.metadataValue}>{extractedMetadata.extractedEra}</div>
            <div className={metaStyles.eraTag}>
              Auto-detected
            </div>
          </div>
          
          {/* Character Type Card */}
          <div 
            className={metaStyles.metadataCard}
            onClick={() => handleShowTooltip('type', extractedMetadata.extractedType)}
            onMouseLeave={handleHideTooltip}
            onMouseEnter={() => handleShowTooltip('type', extractedMetadata.extractedType)}
          >
            <div className={metaStyles.metadataLabel}>Character Type</div>
            <div className={metaStyles.metadataValue}>{extractedMetadata.extractedType}</div>
          </div>
        </div>
        
        {/* Personality Traits */}
        {extractedMetadata.extractedTraits.length > 0 && (
          <div className={metaStyles.metadataSection}>
            <div className={metaStyles.sectionTitle}>
              <span>🧠</span> Personality Traits
            </div>
            <div className={metaStyles.traitsContainer}>
              {extractedMetadata.extractedTraits.map((trait, index) => (
                <div 
                  key={index}
                  className={`${metaStyles.traitChip} ${metaStyles.tooltip}`}
                  onClick={() => handleShowTooltip('trait', trait)}
                  onMouseLeave={handleHideTooltip}
                  onMouseEnter={() => handleShowTooltip('trait', trait)}
                >
                  {trait}
                  <div className={metaStyles.tooltipContent}>
                    Extracted from description
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Locations */}
        {extractedMetadata.extractedLocations.length > 0 && (
          <div className={metaStyles.metadataSection}>
            <div className={metaStyles.sectionTitle}>
              <span>📍</span> Mentioned Locations
            </div>
            <div className={metaStyles.locationsContainer}>
              {extractedMetadata.extractedLocations.map((location, index) => (
                <div key={index} className={metaStyles.locationChip}>
                  {location}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Confidence Indicator */}
        <div className={metaStyles.confidenceBadge}>
          <span>Extraction Confidence:</span>
          <div className={metaStyles.confidenceBar}>
            <div 
              className={metaStyles.confidenceFill}
              style={{ width: `${extractedMetadata.extractionConfidence}%` }}
            />
          </div>
          <span>{extractedMetadata.extractionConfidence}%</span>
        </div>
      </div>
    );
  };

  // ✅ NEW: Render tooltip function
  const renderTooltip = () => {
    if (!activeTooltip) return null;
    
    return (
      <div className={metaStyles.tooltipContent} style={{
        position: 'fixed',
        left: '50%',
        bottom: '100px',
        transform: 'translateX(-50%)',
        zIndex: 1003
      }}>
        {activeTooltip.type === 'era' && (
          <>
            <strong>Era:</strong> {activeTooltip.content}<br/>
            <small>Detected from keywords in description</small>
          </>
        )}
        {activeTooltip.type === 'trait' && (
          <>
            <strong>Trait:</strong> {activeTooltip.content}<br/>
            <small>Based on personality descriptors</small>
          </>
        )}
        {activeTooltip.type === 'type' && (
          <>
            <strong>Type:</strong> {activeTooltip.content}<br/>
            <small>Identified from character role keywords</small>
          </>
        )}
      </div>
    );
  };

  // Check if we should show the discover button
  const shouldShowDiscoverButton = showDiscoverAction && onCharacterSelect;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} onMouseEnter={handleHideTooltip} />
      <aside 
        className={styles.panel} 
        role="dialog" 
        aria-modal="true"
        onMouseLeave={handleHideTooltip}
      >
        {/* Development toggle - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={() => setUseOrganicBlob(!useOrganicBlob)}
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '12px',
              fontSize: '11px',
              cursor: 'pointer',
              zIndex: 999,
              fontWeight: '600'
            }}
          >
            Glass
          </button>
        )}

        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          ×
        </button>
        
        <div className={styles.header}>
          <img
            src={imageUrl}
            alt={displayName}
            className={styles.panelImage}
            onError={(e) => {
              e.target.src = '/default-avatar.jpg';
            }}
          />
          <h2 className={styles.name}>{displayName}</h2>
        </div>
        
        {/* ── Tab nav ── */}
        <div className={styles.tabNav}>
          <button
            className={`${styles.panelTab} ${panelTab === 'about' ? styles.panelTabActive : ''}`}
            onClick={() => setPanelTab('about')}
          >
            About
          </button>
          <button
            className={`${styles.panelTab} ${panelTab === 'posts' ? styles.panelTabActive : ''}`}
            onClick={() => setPanelTab('posts')}
          >
            Posts
          </button>
        </div>

        <div className={styles.content}>
          {panelTab === 'about' && (
            <>
              <p className={styles.description}>{description}</p>
              {renderMetadataSection()}
            </>
          )}

          {panelTab === 'posts' && (
            <div className={styles.postsPanel}>
              {postsLoading && (
                <div className={styles.postsLoading}>Loading posts…</div>
              )}
              {postsError && (
                <div className={styles.postsError}>{postsError}</div>
              )}
              {!postsLoading && !postsError && charPosts.length === 0 && (
                <div className={styles.postsEmpty}>
                  No published posts yet.
                </div>
              )}
              {charPosts.map(post => (
                <div key={post.id} className={styles.postItem}>
                  <div className={styles.postItemHeader}>
                    {post.is_story_post && post.story_chapter != null && (
                      <span className={styles.postChapterBadge}>Ch.{post.story_chapter}</span>
                    )}
                    <span className={styles.postTypePill}>{post.post_type?.replace('_', ' ')}</span>
                    {post.mood_tag && (
                      <span className={styles.postMoodTag}>{post.mood_tag}</span>
                    )}
                  </div>
                  {post.topic_headline && (
                    <div className={styles.postTopic}>{post.topic_headline}</div>
                  )}
                  <p className={styles.postContent}>{post.content}</p>
                  <div className={styles.postFooter}>
                    <span>♥ {post.like_count || 0}</span>
                    <span>👁 {post.view_count || 0}</span>
                    <span className={styles.postTime}>
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString()
                        : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className={styles.footer}>
          <button 
            className={styles.cta} 
            onClick={handleStartChatWithDiscover}
            title="Add to Discovered & Start Chat"
          >
            Start Chat
          </button>
          
          {/* ✅ FIXED: Only show when conditions are met */}
          {shouldShowDiscoverButton && (
            <button 
              className={`${styles.iconButton} ${styles.tooltip}`}
              onClick={handleStartChatWithDiscover}
              aria-label="Add to Discovered & Chat"
              title="Add to Discovered & Start Chat"
              onMouseEnter={handleHideTooltip}
            >
              +
            </button>
          )}
        </div>
        
        {/* ✅ NEW: Tooltip Display */}
        {renderTooltip()}
      </aside>
    </>
  );
};

export default CharacterDetailPanel;