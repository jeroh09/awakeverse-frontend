// src/components/CharacterDetailPanel/CharacterDetailPanel.js
// ✅ REDESIGNED: left column is full-bleed image with gradient overlay
//    name/origin/period/desc pin to bottom over image
//    CharacterMetadata moved to right column above posts
//    Double-border panel shell
//    Confidence bar, "Extracted Insights" label, emoji titles removed
// ✅ PRESERVED: all logic — post fetch, full char fetch, metadata extract,
//    mobile tab layout, tooltip, handlers, showDiscoverAction

import React, { useState, useEffect, useCallback } from 'react';
import styles from './CharacterDetailPanel.module.css';
import { extractCharacterMetadata } from '../../utils/characterExtractor';
import api from '../../api';

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M18 6L6 18M6 6l12 12"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const HeartIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
  </svg>
);

// ── Mini post card ────────────────────────────────────────────────────────────
const MiniPostCard = ({ post }) => {
  const TYPE_COLOURS = {
    reflection:        '#818CF8',
    wisdom_drop:       '#34D399',
    challenge:         '#FCD34D',
    sharp_observation: '#7DD3FC',
  };
  const accent = TYPE_COLOURS[post.post_type] || '#818CF8';

  return (
    <div className={styles.miniPost} style={{ '--mp-accent': accent }}>
      <div className={styles.miniPostHeader}>
        {post.is_story_post && post.story_chapter != null && (
          <span className={styles.miniChapterBadge}>Ch.{post.story_chapter}</span>
        )}
        <span className={styles.miniTypePill} style={{ color: accent }}>
          {post.post_type?.replace('_', ' ')}
        </span>
        {post.mood_tag && (
          <span className={styles.miniMoodTag}>{post.mood_tag}</span>
        )}
        <span className={styles.miniTime}>
          {post.published_at
            ? new Date(post.published_at).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric',
              })
            : ''}
        </span>
      </div>
      {post.topic_headline && (
        <div className={styles.miniTopic}>{post.topic_headline}</div>
      )}
      <p className={styles.miniContent}>{post.content}</p>
      <div className={styles.miniFooter}>
        <span><HeartIcon /> {post.like_count || 0}</span>
        <span><EyeIcon /> {post.view_count || 0}</span>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const CharacterDetailPanel = ({
  character,
  onClose,
  onStartChat,
  onCharacterSelect,
  showDiscoverAction,
}) => {
  const [activeTooltip, setActiveTooltip]         = useState(null);
  const [extractedMetadata, setExtractedMetadata] = useState(null);
  const [mobileTab, setMobileTab]                 = useState('about');
  const [imgFailed, setImgFailed]                 = useState(false);

  const [charPosts, setCharPosts]       = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError]     = useState(null);
  const [postsFetched, setPostsFetched] = useState(false);

  const [fullChar, setFullChar]       = useState(null);
  const [charLoading, setCharLoading] = useState(false);

  if (!character) return null;

  const resolved    = fullChar || character;
  const displayName = resolved.name || resolved.display_name || resolved.character_key || 'Character';
  const description = resolved.description || resolved.short_description || null;
  const imageUrl    = resolved.thumbnailUrl || resolved.avatar_url
                      || `/images/${resolved.character_key || resolved.key}.jpg`;
  const charId      = resolved.id || character.id;

  // Country · Continent
  const originParts = [resolved.country, resolved.continent].filter(Boolean);
  const origin      = originParts.join(' · ');

  // ── Fetch full character if description missing ────────────────────────────
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

  // ── Extract metadata ──────────────────────────────────────────────────────
  useEffect(() => {
    if (description && description !== 'No description available.') {
      setExtractedMetadata(
        extractCharacterMetadata({ ...resolved, description })
      );
    }
  }, [resolved, description]);

  // ── Fetch posts ───────────────────────────────────────────────────────────
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

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStartChatWithDiscover = () => {
    if (showDiscoverAction && onCharacterSelect) onCharacterSelect(character);
    onStartChat(character);
  };

  const handleShowTooltip = (type, content) => setActiveTooltip({ type, content });
  const handleHideTooltip = () => setActiveTooltip(null);
  const shouldShowDiscoverButton = showDiscoverAction && onCharacterSelect;

  // ── Metadata strip — era, type, traits. No confidence, no emoji titles ────
  const renderMetadataStrip = () => {
    if (!extractedMetadata?.hasExtractedMetadata) return null;
    return (
      <div className={styles.metaStrip}>
        {/* Era + Type cards */}
        <div className={styles.metaCards}>
          <div className={styles.metaCard}
            onMouseEnter={() => handleShowTooltip('era', extractedMetadata.extractedEra)}
            onMouseLeave={handleHideTooltip}>
            <div className={styles.metaCardLabel}>Era</div>
            <div className={styles.metaCardValue}>{extractedMetadata.extractedEra}</div>
          </div>
          <div className={styles.metaCard}
            onMouseEnter={() => handleShowTooltip('type', extractedMetadata.extractedType)}
            onMouseLeave={handleHideTooltip}>
            <div className={styles.metaCardLabel}>Type</div>
            <div className={styles.metaCardValue}>{extractedMetadata.extractedType}</div>
          </div>
        </div>

        {/* Trait chips */}
        {extractedMetadata.extractedTraits.length > 0 && (
          <div className={styles.metaTraits}>
            {extractedMetadata.extractedTraits.map((trait, i) => (
              <span key={i} className={styles.metaTrait}>{trait}</span>
            ))}
          </div>
        )}

        {/* Location chips */}
        {extractedMetadata.extractedLocations?.length > 0 && (
          <div className={styles.metaTraits}>
            {extractedMetadata.extractedLocations.map((loc, i) => (
              <span key={i} className={styles.metaLocation}>{loc}</span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Posts column (right) ──────────────────────────────────────────────────
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

      {/* ✅ Metadata strip sits above posts in the right column */}
      {renderMetadataStrip()}

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

  // ── Mobile about tab ──────────────────────────────────────────────────────
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
      {/* On mobile, metadata renders in the about tab */}
      {renderMetadataStrip()}
    </div>
  );

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const renderTooltip = () => {
    if (!activeTooltip) return null;
    return (
      <div className={styles.floatingTooltip}>
        {activeTooltip.type === 'era' && (
          <><strong>Era:</strong> {activeTooltip.content}<br/>
          <small>Detected from description</small></>
        )}
        {activeTooltip.type === 'trait' && (
          <><strong>Trait:</strong> {activeTooltip.content}<br/>
          <small>Based on personality descriptors</small></>
        )}
        {activeTooltip.type === 'type' && (
          <><strong>Type:</strong> {activeTooltip.content}<br/>
          <small>Identified from character role</small></>
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
        {/* Dev toggle preserved */}
        {process.env.NODE_ENV === 'development' && (
          <button onClick={() => {}} style={{
            position: 'absolute', top: 10, left: 10,
            background: '#6366f1', color: 'white', border: 'none',
            padding: '6px 12px', borderRadius: 12, fontSize: 11,
            cursor: 'pointer', zIndex: 999, fontWeight: 600,
          }}>Dev</button>
        )}

        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>

        {/* ══════════════════════════════════════════
            DESKTOP: two-column layout
        ══════════════════════════════════════════ */}
        <div className={styles.twoCol}>

          {/* ── Left column — full-bleed image ── */}
          <div className={styles.leftCol}>

            {/* Full-bleed image */}
            {!imgFailed ? (
              <img
                src={imageUrl}
                alt={displayName}
                className={styles.leftImage}
                onError={() => setImgFailed(true)}
                draggable={false}
              />
            ) : (
              <div className={styles.leftImageFallback}>
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Gradient overlay — transparent top → opaque bottom */}
            <div className={styles.leftGradient} />

            {/* Content pinned to bottom */}
            <div className={styles.leftOverlay}>
              <div className={styles.leftMeta}>
                {origin && (
                  <div className={styles.leftOrigin}>{origin}</div>
                )}
                {resolved.historical_period && (
                  <div className={styles.leftPeriod}>{resolved.historical_period}</div>
                )}
              </div>
              <h2 className={styles.leftName}>{displayName}</h2>
              {description && (
                <p className={styles.leftDesc}>{description}</p>
              )}
              {charLoading && !description && (
                <p className={styles.leftDesc} style={{ opacity: 0.45 }}>Loading…</p>
              )}
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

          {/* ── Right column — metadata strip + posts ── */}
          <div className={styles.rightCol}>
            {renderPosts()}
          </div>

        </div>

        {/* ══════════════════════════════════════════
            MOBILE: tab layout
        ══════════════════════════════════════════ */}
        <div className={styles.mobileLayout}>

          {/* Mobile image header — full-bleed, shorter */}
          <div className={styles.mobileImageHeader}>
            {!imgFailed ? (
              <img
                src={imageUrl}
                alt={displayName}
                className={styles.mobileImage}
                onError={() => setImgFailed(true)}
                draggable={false}
              />
            ) : (
              <div className={styles.leftImageFallback} style={{ height: 160 }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={styles.mobileImageGradient} />
            <div className={styles.mobileImageOverlay}>
              <h2 className={styles.leftName}>{displayName}</h2>
              {origin && <div className={styles.leftOrigin}>{origin}</div>}
            </div>
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