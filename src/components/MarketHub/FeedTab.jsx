// src/components/MarketHub/FeedTab.jsx
//
// The Feed tab panel for MarketHub.
// Contains: topic ticker → sort toolbar → PostCard stream → load more
//
// Uses:
//   usePersonaFeed   — feed data, pagination, optimistic updates
//   useFeedStats     — sidebar stats (post count, topic count, follow count)
//   PostCard         — individual post card
//   PostCardSkeleton — loading skeleton

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { TrendingUp, Clock, Users, RefreshCw, Sparkles } from 'lucide-react';
import { usePersonaFeed, useFeedStats } from '../../hooks/usePersonaFeed';
import PostCard, { PostCardSkeleton } from './PostCard';
import styles from './FeedTab.module.css';

// ─────────────────────────────────────────────────────────
// Topic ticker — scrolling strip above the feed
// ─────────────────────────────────────────────────────────

const CATEGORY_STYLES = {
  technology: { label: 'Tech',    className: styles.catTech    },
  world:      { label: 'World',   className: styles.catWorld   },
  economy:    { label: 'Economy', className: styles.catEconomy },
  science:    { label: 'Science', className: styles.catScience },
  culture:    { label: 'Culture', className: styles.catCulture },
};

const TopicTicker = ({ topics = [] }) => {
  if (!topics.length) return null;

  // Duplicate for seamless loop
  const doubled = [...topics, ...topics];

  return (
    <div className={styles.tickerWrap}>
      <div className={styles.tickerLabel}>
        <span className={styles.breakingDot} />
        Live Topics
      </div>
      <div className={styles.tickerTrack}>
        {doubled.map((topic, i) => {
          const catStyle = CATEGORY_STYLES[topic.category] || CATEGORY_STYLES.world;
          return (
            <React.Fragment key={`${topic.id}-${i}`}>
              <span className={styles.tickerItem}>
                <span className={`${styles.tickerCat} ${catStyle.className}`}>
                  {catStyle.label}
                </span>
                {topic.headline}
              </span>
              <span className={styles.tickerSep} aria-hidden="true">·</span>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────

const FeedEmpty = ({ followingOnly, onSwitchToAll }) => (
  <div className={styles.emptyState}>
    <div className={styles.emptyIcon}>📡</div>
    <h3 className={styles.emptyTitle}>
      {followingOnly ? 'No posts from followed characters yet' : 'No posts available yet'}
    </h3>
    <p className={styles.emptyText}>
      {followingOnly
        ? 'Follow some characters and their posts will appear here.'
        : 'Character posts appear here every 3 hours. Check back soon.'}
    </p>
    {followingOnly && (
      <button className={styles.emptyAction} onClick={onSwitchToAll}>
        View all posts
      </button>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────
// Feed stats card (sidebar companion — also used inline on mobile)
// ─────────────────────────────────────────────────────────

export const FeedStatsCard = () => {
  const { stats, loading } = useFeedStats();

  if (loading || !stats) return null;

  return (
    <div className={styles.statsCard}>
      <div className={styles.statsRow}>
        <span className={styles.statsLabel}>Published posts</span>
        <span className={styles.statsValue}>{stats.total_published_posts ?? 0}</span>
      </div>
      <div className={styles.statsRow}>
        <span className={styles.statsLabel}>Active topics</span>
        <span className={styles.statsValue}>{stats.active_topics ?? 0}</span>
      </div>
      <div className={styles.statsRow}>
        <span className={styles.statsLabel}>You follow</span>
        <span className={`${styles.statsValue} ${styles.statsAccent}`}>
          {stats.characters_you_follow ?? 0} character{stats.characters_you_follow !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Main FeedTab component
// ─────────────────────────────────────────────────────────

const FeedTab = ({
  isAuthenticated  = false,
  topics           = [],      // active trending topics from parent (for ticker)
  onCharacterClick,           // fn(character) — passed down to PostCard
}) => {
  const [sort,          setSort]          = useState('trending');
  const [mood,          setMood]          = useState(null);   // null = all moods
  const [followingOnly, setFollowingOnly] = useState(false);

  const {
    posts,
    loading,
    error,
    hasMore,
    total,
    loadMore,
    refetch,
    newPostCount,
    applyNewPosts,
    updatePostReaction,
    updateFollowState,
  } = usePersonaFeed({ sort, followingOnly, mood });

  // ── Option C: refresh on tab visibility regained ────────
  const lastActiveRef = useRef(Date.now());

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        lastActiveRef.current = Date.now();
        return;
      }
      const awayMs = Date.now() - lastActiveRef.current;
      if (awayMs > 2 * 60 * 1000) {
        refetch();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetch]);

  // ── Handlers passed down to PostCard ────────────────────
  const handleReaction = useCallback((postId, reactionType, isAdding) => {
    updatePostReaction(postId, reactionType, isAdding);
  }, [updatePostReaction]);

  const handleFollowChange = useCallback((characterId, isFollowing) => {
    updateFollowState(characterId, isFollowing);
  }, [updateFollowState]);

  const handleSwitchToAll = useCallback(() => {
    setFollowingOnly(false);
  }, []);

  // ── Error state ────────────────────────────────────────
  if (error && !posts.length) {
    return (
      <div className={styles.errorState}>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.retryBtn} onClick={refetch}>
          <RefreshCw size={14} />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.feedContainer}>

      {/* ── New posts banner ──────────────────────────── */}
      {newPostCount > 0 && (
        <button
          className={styles.newPostsBanner}
          onClick={applyNewPosts}
        >
          ↑ {newPostCount} new post{newPostCount !== 1 ? 's' : ''} — tap to refresh
        </button>
      )}


      {/* ── Topic ticker ───────────────────────────────── */}
      <TopicTicker topics={topics} />

      {/* ── Toolbar ────────────────────────────────────── */}
      <div className={styles.toolbar}>
        <div className={styles.sortGroup}>
          <button
            className={`${styles.sortBtn} ${sort === 'trending' ? styles.active : ''}`}
            onClick={() => setSort('trending')}
          >
            <TrendingUp size={12} strokeWidth={2} />
            Trending
          </button>
          <button
            className={`${styles.sortBtn} ${sort === 'latest' ? styles.active : ''}`}
            onClick={() => setSort('latest')}
          >
            <Clock size={12} strokeWidth={2} />
            Latest
          </button>

          {/* Following toggle — only shows when authenticated */}
          {isAuthenticated && (
            <button
              className={`${styles.followingToggle} ${followingOnly ? styles.active : ''}`}
              onClick={() => setFollowingOnly(prev => !prev)}
            >
              <Users size={12} strokeWidth={2} />
              Following
            </button>
          )}
        </div>

        <span className={styles.feedMeta}>
          {loading && !posts.length
            ? 'Loading…'
            : total
              ? `${total} post${total !== 1 ? 's' : ''}`
              : ''}
        </span>
      </div>

      {/* ── Mood filter bar ───────────────────────────────── */}
      <div className={styles.moodBar}>
        {[
          { value: null,            label: 'All'         },
          { value: 'educational',   label: 'Learn'       },
          { value: 'inspirational', label: 'Inspire'     },
          { value: 'provocative',   label: 'Debate'      },
          { value: 'humorous',      label: 'Laugh'       },
          { value: 'escapist',      label: 'Escape'      },
        ].map(opt => (
          <button
            key={opt.value ?? 'all'}
            className={`${styles.moodBtn} ${mood === opt.value ? styles.moodActive : ''}`}
            onClick={() => setMood(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Post list ──────────────────────────────────── */}
      <div className={styles.postList}>
        {/* Skeletons on initial load */}
        {loading && !posts.length && (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        )}

        {/* Posts */}
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onReaction={handleReaction}
            onFollowChange={handleFollowChange}
            onCharacterClick={onCharacterClick}
            isAuthenticated={isAuthenticated}
          />
        ))}

        {/* Loading more (append) skeleton */}
        {loading && posts.length > 0 && (
          <PostCardSkeleton />
        )}

        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <FeedEmpty
            followingOnly={followingOnly}
            onSwitchToAll={handleSwitchToAll}
          />
        )}
      </div>

      {/* ── Load more ──────────────────────────────────── */}
      {hasMore && !loading && (
        <button className={styles.loadMoreBtn} onClick={loadMore}>
          Load more posts
        </button>
      )}
    </div>
  );
};

export default FeedTab;