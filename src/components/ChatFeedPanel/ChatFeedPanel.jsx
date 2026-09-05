// src/components/ChatFeedPanel/ChatFeedPanel.jsx
//
// v2 — Slim feed panel. Uses usePersonaFeed directly.
// No FeedTab wrapper — that component is too wide for 256px.
//
// Props:
//   isOpen           bool  — controlled by ChatWindow
//   onToggle         fn    — collapse/expand
//   isAuthenticated  bool  — from ChatWindow (!!user)
//   onCharacterClick fn    — switches active chat character (ChatWindow.handleCharacterSelect)

import React, { useState, useCallback } from 'react';
import { usePersonaFeed } from '../../hooks/usePersonaFeed';
import CharacterDetailPanel from '../CharacterDetailPanel/CharacterDetailPanel';
import './ChatFeedPanel.css';

// ── Helpers ─────────────────────────────────────────────────────────────

const truncate = (text, maxWords = 50) => {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '…';
};

const buildCharacterObj = (postCharacter) => ({
  id:            postCharacter?.id,
  name:          postCharacter?.display_name || postCharacter?.name || 'Character',
  display_name:  postCharacter?.display_name || postCharacter?.name,
  character_key: postCharacter?.character_key,
  key:           postCharacter?.character_key,
  thumbnailUrl:  postCharacter?.avatar_url,
  avatar_url:    postCharacter?.avatar_url,
});

// ── Icons ────────────────────────────────────────────────────────────────

const IconChevronRight = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <polyline points="13 17 18 12 13 7" />
    <polyline points="6 17 11 12 6 7" />
  </svg>
);

const IconChevronLeft = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <polyline points="11 17 6 12 11 7" />
    <polyline points="18 17 13 12 18 7" />
  </svg>
);

const IconHeart = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const IconTrendingUp = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconClock = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// ── Slim post card ────────────────────────────────────────────────────────

const SlimCard = ({ post, onCharacterClick }) => {
  const name    = post.character?.display_name || post.character?.name || 'Character';
  const content = truncate(post.content, 50);
  const likes   = post.like_count || 0;

  return (
    <div className="cfp-card">
      <button
        className="cfp-card-author"
        onClick={() => onCharacterClick(post)}
        aria-label={`View ${name}'s profile`}
      >
        {post.character?.avatar_url ? (
          <img
            src={post.character.avatar_url}
            alt={name}
            className="cfp-card-avatar"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="cfp-card-avatar-fallback" aria-hidden="true">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="cfp-card-name">{name}</span>
      </button>

      <p className="cfp-card-content">{content}</p>

      <div className="cfp-card-footer">
        <span className="cfp-card-stat">
          <IconHeart /> {likes}
        </span>
      </div>
    </div>
  );
};

// ── Skeleton loader ───────────────────────────────────────────────────────

const SlimSkeleton = () => (
  <div className="cfp-skeleton">
    <div className="cfp-skel-row cfp-skel-author" />
    <div className="cfp-skel-row cfp-skel-line1" />
    <div className="cfp-skel-row cfp-skel-line2" />
    <div className="cfp-skel-row cfp-skel-line3" />
  </div>
);

// ── Main component ────────────────────────────────────────────────────────

export default function ChatFeedPanel({
  isOpen = true,
  onToggle,
  isAuthenticated = false,
  onCharacterClick,
}) {
  const [sort, setSort] = useState('trending');
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  const {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
  } = usePersonaFeed({ sort, enabled: isOpen });

  // Open CharacterDetailPanel on name/avatar click
  const handleCharacterClick = useCallback((post) => {
    if (!post.character) return;
    setSelectedCharacter(buildCharacterObj(post.character));
  }, []);

  // CharacterDetailPanel → Start chat → switch active character in ChatWindow
  const handleStartChat = useCallback((character) => {
    setSelectedCharacter(null);
    const key = character?.character_key || character?.key;
    if (key && typeof onCharacterClick === 'function') {
      onCharacterClick(key);
    }
  }, [onCharacterClick]);

  return (
    <>
      <aside
        className={`chat-feed-panel${isOpen ? '' : ' cfp-collapsed'}`}
        aria-label="Live feed"
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="cfp-header">
          {isOpen && <span className="cfp-title">Live feed</span>}
          <button
            className="cfp-toggle"
            onClick={onToggle}
            title={isOpen ? 'Collapse feed' : 'Expand feed'}
            aria-label={isOpen ? 'Collapse feed' : 'Expand feed'}
          >
            {isOpen ? <IconChevronRight /> : <IconChevronLeft />}
          </button>
        </div>

        {isOpen && (
          <>
            {/* ── Sort bar ──────────────────────────────────────── */}
            <div className="cfp-sort-bar">
              <button
                className={`cfp-sort-btn${sort === 'trending' ? ' cfp-sort-active' : ''}`}
                onClick={() => setSort('trending')}
              >
                <IconTrendingUp /> Trending
              </button>
              <button
                className={`cfp-sort-btn${sort === 'latest' ? ' cfp-sort-active' : ''}`}
                onClick={() => setSort('latest')}
              >
                <IconClock /> Latest
              </button>
            </div>

            {/* ── Cards ─────────────────────────────────────────── */}
            <div className="cfp-body">
              {loading && !posts.length && (
                <>
                  <SlimSkeleton />
                  <SlimSkeleton />
                  <SlimSkeleton />
                </>
              )}

              {error && !posts.length && (
                <p className="cfp-error">Could not load feed</p>
              )}

              {posts.map(post => (
                <SlimCard
                  key={post.id}
                  post={post}
                  onCharacterClick={handleCharacterClick}
                />
              ))}

              {loading && posts.length > 0 && <SlimSkeleton />}

              {hasMore && !loading && (
                <button className="cfp-load-more" onClick={loadMore}>
                  Load more
                </button>
              )}
            </div>
          </>
        )}

        {/* ── Collapsed strip ─────────────────────────────────────── */}
        {!isOpen && (
          <div className="cfp-strip" aria-hidden="true">
            <div className="cfp-strip-icon" title="Trending"><IconTrendingUp /></div>
            <div className="cfp-strip-icon" title="Latest"><IconClock /></div>
          </div>
        )}
      </aside>

      {/* ── CharacterDetailPanel overlay ────────────────────────────── */}
      {selectedCharacter && (
        <CharacterDetailPanel
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
          onStartChat={handleStartChat}
          showDiscoverAction={false}
        />
      )}
    </>
  );
}