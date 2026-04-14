// src/components/CharacterDetailPanel/CharacterDetailPanel.js
//
// Desktop (>768px): wide two-column slide-over
//   Left  (280px fixed)  — avatar, name, description, metadata, CTA
//   Right (flex 1)       — scrollable posts feed
//
// Mobile (≤768px): full-screen modal with About | Posts tab nav
//
// Bug fix: if description is missing (opened from feed),
//   fetches full character from /api/market-hub/character/<id>/stats

import React, { useState, useEffect, useCallback } from 'react';
import floatingGlassStyles from './CharacterDetailPanel.module.css';
import metadataStyles from './CharacterMetadata.module.css';
import { extractCharacterMetadata } from '../../utils/characterExtractor';
import api from '../../api';

// ─────────────────────────────────────────────────────────
// Mini post card for the right column / mobile posts tab
// ─────────────────────────────────────────────────────────
const MiniPostCard = ({ post }) => {
  const TYPE_COLOURS = {
    reflection:        '#818CF8',
    wisdom_drop:       '#34D399',
    challenge:         '#FCD34D',
    sharp_observation: '#7DD3FC',
  };
  const accent = TYPE_COLOURS[post.post_type] || '#818CF8';

  return (
    <div className={floatingGlassStyles.miniPost} style={{ '--mp-accent': accent }}>
      <div className={floatingGlassStyles.miniPostHeader}>
        {post.is_story_post && post.story_chapter != null && (
          <span className={floatingGlassStyles.miniChapterBadge}>
            Ch.{post.story_chapter}
          </span>
        )}
        <span className={floatingGlassStyles.miniTypePill} style={{ color: accent }}>
          {post.post_type?.replace('_', ' ')}
        </span>
        {post.mood_tag && (
          <span className={floatingGlassStyles.miniMoodTag}>{post.mood_tag}</span>
        )}
        <span className={floatingGlassStyles.miniTime}>
          {post.published_at
            ? new Date(post.published_at).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric',
              })
            : ''}
        </span>
      </div>
      {post.topic_headline && (
        <div className={floatingGlassStyles.miniTopic}>{post.topic_headline}</div>
      )}
      <p className={floatingGlassStyles.miniContent}>{post.content}</p>
      <div className={floatingGlassStyles.miniFooter}>
        <span>♥ {post.like_count || 0}</span>
        <span>👁 {post.view_count || 0}</span>
      </div>
    </div>
  );
};


// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────
const CharacterDetailPanel = ({
  character,
  onClose,
  onStartChat,
  onCharacterSelect,
  showDiscoverAction,
}) => {
  const [useOrganicBlob, setUseOrganicBlob]       = useState(false);
  const [activeTooltip, setActiveTooltip]         = useState(null);
  const [extractedMetadata, setExtractedMetadata] = useState(null);
  const [mobileTab, setMobileTab]                 = useState('about');

  const [charPosts, setCharPosts]       = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError]     = useState(null);
  const [postsFetched, setPostsFetched] = useState(false);

  const [fullChar, setFullChar]       = useState(null);
  const [charLoading, setCharLoading] = useState(false);

  const styles     = floatingGlassStyles;
  const metaStyles = metadataStyles;

  if (!character) return null;

  const resolved    = fullChar || character;
  const displayName = resolved.name || resolved.display_name || resolved.character_key || 'Character';
  const description = resolved.description || resolved.short_description || null;
  const imageUrl    = resolved.thumbnailUrl || resolved.avatar_url
                      || `/images/${resolved.character_key || resolved.key}.jpg`;
  const charId      = resolved.id || character.id;

  // ── Fetch full character if description missing ──────────
  useEffect(() => {
    if (description) return;
    if (!charId) return;
    if (charLoading || fullChar) return;
    setCharLoading(true);
    api.get(`/market-hub/character/${charId}/stats`)
      .then(res => { if (res.data?.character) setFullChar(res.data.character); })
      .catch(() => {})
      .finally(() => setCharLoading(false));
  }, [charId, description, charLoading, fullChar]);

  // ── Extract metadata ─────────────────────────────────────
  useEffect(() => {
    if (description && description !== 'No description available.') {
      setExtractedMetadata(
        extractCharacterMetadata({ ...resolved, description })
      );
    }
  }, [resolved, description]);

  // ── Fetch posts immediately (desktop right col always visible) ──
  const fetchPosts = useCallback(async () => {
    if (!charId || postsFetched) return;
    setPostsLoading(true);
    setPostsError(null);
    try {
      const res = await api.get(`/social/character/${charId}/posts?per_page=15`);
      if (res.data?.status === 'success') {
        setCharPosts(res.data.posts || []);
        setPostsFetched(true);
      }
    } catch {
      setPostsError('Could not load posts');
    } finally {
      setPostsLoading(false);
    }
  }, [charId, postsFetched]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // ── Handlers ─────────────────────────────────────────────
  const handleStartChatWithDiscover = () => {
    if (showDiscoverAction && onCharacterSelect) onCharacterSelect(character);
    onStartChat(character);
  };

  const handleShowTooltip = (type, content) => setActiveTooltip({ type, content });
  const handleHideTooltip = () => setActiveTooltip(null);
  const shouldShowDiscoverButton = showDiscoverAction && onCharacterSelect;

  // ── Metadata ─────────────────────────────────────────────
  const renderMetadataSection = () => {
    if (!extractedMetadata?.hasExtractedMetadata) return null;
    return (
      <div className={metaStyles.metadataSection}>
        <div className={metaStyles.sectionTitle}><span>🔍</span> Extracted Insights</div>
        <div className={metaStyles.metadataGrid}>
          <div className={metaStyles.metadataCard}
            onMouseEnter={() => handleShowTooltip('era', extractedMetadata.extractedEra)}
            onMouseLeave={handleHideTooltip}>
            <div className={metaStyles.metadataLabel}>Historical Era</div>
            <div className={metaStyles.metadataValue}>{extractedMetadata.extractedEra}</div>
            <div className={metaStyles.eraTag}>Auto-detected</div>
          </div>
          <div className={metaStyles.metadataCard}
            onMouseEnter={() => handleShowTooltip('type', extractedMetadata.extractedType)}
            onMouseLeave={handleHideTooltip}>
            <div className={metaStyles.metadataLabel}>Character Type</div>
            <div className={metaStyles.metadataValue}>{extractedMetadata.extractedType}</div>
          </div>
        </div>
        {extractedMetadata.extractedTraits.length > 0 && (
          <div className={metaStyles.metadataSection}>
            <div className={metaStyles.sectionTitle}><span>🧠</span> Personality Traits</div>
            <div className={metaStyles.traitsContainer}>
              {extractedMetadata.extractedTraits.map((trait, i) => (
                <div key={i} className={metaStyles.traitChip}>{trait}</div>
              ))}
            </div>
          </div>
        )}
        {extractedMetadata.extractedLocations.length > 0 && (
          <div className={metaStyles.metadataSection}>
            <div className={metaStyles.sectionTitle}><span>📍</span> Mentioned Locations</div>
            <div className={metaStyles.locationsContainer}>
              {extractedMetadata.extractedLocations.map((loc, i) => (
                <div key={i} className={metaStyles.locationChip}>{loc}</div>
              ))}
            </div>
          </div>
        )}
        <div className={metaStyles.confidenceBadge}>
          <span>Extraction Confidence:</span>
          <div className={metaStyles.confidenceBar}>
            <div className={metaStyles.confidenceFill}
              style={{ width: `${extractedMetadata.extractionConfidence}%` }} />
          </div>
          <span>{extractedMetadata.extractionConfidence}%</span>
        </div>
      </div>
    );
  };

  // ── Posts column ─────────────────────────────────────────
  const renderPosts = () => (
    <div className={styles.postsColumn}>
      <div className={styles.postsHeader}>
        <span className={styles.postsHeading}>Posts</span>
        {postsFetched && (
          <span className={styles.postsCount}>
            {charPosts.length} post{charPosts.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className={styles.postsScroll}>
        {postsLoading && <div className={styles.postsState}>Loading posts…</div>}
        {postsError && (
          <div className={`${styles.postsState} ${styles.postsStateError}`}>{postsError}</div>
        )}
        {!postsLoading && !postsError && postsFetched && charPosts.length === 0 && (
          <div className={styles.postsState}>No published posts yet.</div>
        )}
        {charPosts.map(post => <MiniPostCard key={post.id} post={post} />)}
      </div>
    </div>
  );

  // ── About content ────────────────────────────────────────
  const renderAbout = () => (
    <div className={styles.leftContent}>
      {charLoading && !description && (
        <div className={styles.descLoading}>Loading…</div>
      )}
      {description
        ? <p className={styles.description}>{description}</p>
        : !charLoading && (
          <p className={styles.description} style={{ opacity: 0.45 }}>
            No description available.
          </p>
        )
      }
      {renderMetadataSection()}
    </div>
  );

  // ── Tooltip ───────────────────────────────────────────────
  const renderTooltip = () => {
    if (!activeTooltip) return null;
    return (
      <div className={metaStyles.tooltipContent} style={{
        position: 'fixed', left: '50%', bottom: 100,
        transform: 'translateX(-50%)', zIndex: 1003,
      }}>
        {activeTooltip.type === 'era' && (
          <><strong>Era:</strong> {activeTooltip.content}<br/>
          <small>Detected from keywords in description</small></>
        )}
        {activeTooltip.type === 'trait' && (
          <><strong>Trait:</strong> {activeTooltip.content}<br/>
          <small>Based on personality descriptors</small></>
        )}
        {activeTooltip.type === 'type' && (
          <><strong>Type:</strong> {activeTooltip.content}<br/>
          <small>Identified from character role keywords</small></>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} onMouseEnter={handleHideTooltip} />
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        onMouseLeave={handleHideTooltip}
      >
        {/* Dev toggle */}
        {process.env.NODE_ENV === 'development' && (
          <button onClick={() => setUseOrganicBlob(!useOrganicBlob)} style={{
            position: 'absolute', top: 10, left: 10,
            background: '#6366f1', color: 'white', border: 'none',
            padding: '6px 12px', borderRadius: 12, fontSize: 11,
            cursor: 'pointer', zIndex: 999, fontWeight: 600,
          }}>Glass</button>
        )}

        <button className={styles.closeButton} onClick={onClose} aria-label="Close">×</button>

        {/* ══════════════════════════════════════════
            DESKTOP: two-column layout
            Hidden on mobile via CSS
        ══════════════════════════════════════════ */}
        <div className={styles.twoCol}>
          {/* Left — identity + about */}
          <div className={styles.leftCol}>
            <div className={styles.header}>
              <img
                src={imageUrl} alt={displayName}
                className={styles.panelImage}
                onError={e => { e.target.src = '/default-avatar.jpg'; }}
              />
              <h2 className={styles.name}>{displayName}</h2>
            </div>
            <div className={styles.leftScroll}>
              {renderAbout()}
            </div>
            <div className={styles.footer}>
              <button className={styles.cta} onClick={handleStartChatWithDiscover}>
                Start Chat
              </button>
              {shouldShowDiscoverButton && (
                <button
                  className={`${styles.iconButton} ${styles.tooltip}`}
                  onClick={handleStartChatWithDiscover}
                >+</button>
              )}
            </div>
          </div>

          {/* Right — posts */}
          <div className={styles.rightCol}>
            {renderPosts()}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            MOBILE: tab layout
            Hidden on desktop via CSS
        ══════════════════════════════════════════ */}
        <div className={styles.mobileLayout}>
          <div className={styles.mobileHeader}>
            <img
              src={imageUrl} alt={displayName}
              className={styles.mobilePanelImage}
              onError={e => { e.target.src = '/default-avatar.jpg'; }}
            />
            <h2 className={styles.name}>{displayName}</h2>
          </div>

          <div className={styles.tabNav}>
            <button
              className={`${styles.panelTab} ${mobileTab === 'about' ? styles.panelTabActive : ''}`}
              onClick={() => setMobileTab('about')}
            >About</button>
            <button
              className={`${styles.panelTab} ${mobileTab === 'posts' ? styles.panelTabActive : ''}`}
              onClick={() => setMobileTab('posts')}
            >Posts</button>
          </div>

          <div className={styles.mobileContent}>
            {mobileTab === 'about' && renderAbout()}
            {mobileTab === 'posts' && renderPosts()}
          </div>

          <div className={styles.footer}>
            <button className={styles.cta} onClick={handleStartChatWithDiscover}>
              Start Chat
            </button>
            {shouldShowDiscoverButton && (
              <button
                className={`${styles.iconButton} ${styles.tooltip}`}
                onClick={handleStartChatWithDiscover}
              >+</button>
            )}
          </div>
        </div>

        {renderTooltip()}
      </aside>
    </>
  );
};

export default CharacterDetailPanel;