// src/hooks/usePersonaFeed.js
//
// Feed hook for the social persona feed.
// Pattern: matches useMarketHub.js exactly.
//   - api instance from '../api' (handles CSRF + auth cookies automatically)
//   - AbortController per request
//   - In-memory cache with TTL
//   - Retry on network error
//
// Public endpoints: work without auth.
// When logged in, server returns reaction + follow state per post.

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';

const CACHE_TTL_MS = 3 * 60 * 1000;  // 3 min — matches post generation cycle
const MAX_RETRIES  = 2;
const PER_PAGE     = 20;

// ─────────────────────────────────────────────────────────
// Main feed hook
// ─────────────────────────────────────────────────────────

export const usePersonaFeed = ({
  sort          = 'trending',  // 'trending' | 'latest'
  followingOnly = false,       // true = /feed/following (auth required)
  mood          = null,        // 'educational'|'humorous'|'inspirational'|'provocative'|'escapist'
  enabled       = true,
} = {}) => {
  const [state, setState] = useState({
    posts:     [],
    loading:   true,
    error:     null,
    page:      1,
    hasMore:   false,
    total:     0,
    lastFetch: null,
  });

  const [newPostCount, setNewPostCount] = useState(0);   // banner count

  const abortControllerRef = useRef(null);
  const cacheRef           = useRef(new Map());
  const pollTimerRef       = useRef(null);
  const latestSeenIdRef    = useRef(null);   // highest post id we've shown the user

  // ── Cache key ──────────────────────────────────────────
  const createCacheKey = useCallback(
    (page) => `${sort}:${followingOnly ? '1' : '0'}:${mood ?? 'all'}:${page}`,
    [sort, followingOnly]
  );

  // ── Fetch one page ─────────────────────────────────────
  const fetchPage = useCallback(async (page, append = false, retryCount = 0) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const key = createCacheKey(page);

    try {
      // Cache hit
      const cached = cacheRef.current.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        setState(prev => ({
          ...prev,
          posts:     append ? [...prev.posts, ...cached.data.posts] : cached.data.posts,
          loading:   false,
          error:     null,
          page,
          hasMore:   cached.data.hasMore,
          total:     cached.data.total,
          lastFetch: cached.timestamp,
        }));
        return cached.data;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      const endpoint = followingOnly
        ? '/social/feed/following'
        : '/social/feed';

      const params = new URLSearchParams({
        page:     String(page),
        per_page: String(PER_PAGE),
        sort,
      });
      if (mood) params.set('mood', mood);

      // api instance handles auth cookies + CSRF automatically
      const response = await api.get(`${endpoint}?${params}`, {
        signal: abortControllerRef.current.signal,
      });

      const data = response.data;

      if (data.status !== 'success') {
        throw new Error(data.error || 'Feed request failed');
      }

      const result = {
        posts:   Array.isArray(data.posts) ? data.posts : [],
        hasMore: data.pagination?.has_next ?? false,
        total:   data.pagination?.total    ?? 0,
      };

      // Cache
      cacheRef.current.set(key, { data: result, timestamp: Date.now() });

      // Prune — keep last 12 entries (matching useMarketHub pattern of 10)
      if (cacheRef.current.size > 12) {
        const entries = Array.from(cacheRef.current.entries());
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        cacheRef.current.clear();
        entries.slice(0, 12).forEach(([k, v]) => cacheRef.current.set(k, v));
      }

      setState(prev => ({
        ...prev,
        posts:     append ? [...prev.posts, ...result.posts] : result.posts,
        loading:   false,
        error:     null,
        page,
        hasMore:   result.hasMore,
        total:     result.total,
        lastFetch: Date.now(),
      }));

      // Track the highest post id the user has seen so we can detect new ones
      if (!append && result.posts.length > 0) {
        const maxId = Math.max(...result.posts.map(p => p.id));
        if (!latestSeenIdRef.current || maxId > latestSeenIdRef.current) {
          latestSeenIdRef.current = maxId;
        }
      }

      // Record the latest post id for polling comparison
      if (!append && result.posts.length > 0) {
        latestPostIdRef.current = result.posts[0].id;
        setNewPostCount(0);   // reset banner when feed reloads
      }

      return result;

    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') return;

      // Retry on network error — same pattern as useMarketHub.js
      if (retryCount < MAX_RETRIES &&
          (err.message.includes('fetch') || err.message.includes('network'))) {
        console.warn(`Feed fetch attempt ${retryCount + 1} failed, retrying...`);
        await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
        return fetchPage(page, append, retryCount + 1);
      }

      const msg = err.response?.status === 401
        ? 'Sign in to see your following feed'
        : err.message.includes('fetch') || err.message.includes('network')
        ? 'Unable to connect to feed. Check your connection.'
        : 'Unable to load feed';

      setState(prev => ({ ...prev, loading: false, error: msg }));
      console.error('Feed fetch error:', err);
    }
  }, [sort, followingOnly, mood, createCacheKey]);

  // ── Load more (append next page) ──────────────────────
  const loadMore = useCallback(() => {
    if (state.loading || !state.hasMore) return;
    fetchPage(state.page + 1, true);
  }, [state.loading, state.hasMore, state.page, fetchPage]);

  // ── Refetch from page 1 ────────────────────────────────
  const refetch = useCallback(() => {
    cacheRef.current.clear();
    setNewPostCount(0);
    latestSeenIdRef.current = null;
    fetchPage(1, false);
  }, [fetchPage]);

  // ── Apply new posts — clears banner and reloads feed ───
  const applyNewPosts = useCallback(() => {
    cacheRef.current.clear();
    setNewPostCount(0);
    fetchPage(1, false);
  }, [fetchPage]);

  // ── Background poll — checks for new posts silently ───
  // Fetches only per_page=1&sort=latest, compares id to latestPostIdRef.
  // Never disrupts the user — just updates the banner count.
  const POLL_INTERVAL_MS = 2 * 60 * 1000;  // 2 minutes

  useEffect(() => {
    if (!enabled) return;

    const poll = async () => {
      try {
        const endpoint = followingOnly ? '/social/feed/following' : '/social/feed';
        const res = await api.get(`${endpoint}?page=1&per_page=1&sort=latest`);
        if (res.data?.status !== 'success') return;

        const latest = res.data.posts?.[0];
        if (!latest) return;

        // If the newest post id is different from what we're showing
        if (latestPostIdRef.current && latest.id !== latestPostIdRef.current) {
          // Fetch count of posts newer than what we're showing
          const countRes = await api.get(
            `${endpoint}?page=1&per_page=20&sort=latest`
          );
          if (countRes.data?.status !== 'success') return;

          const newPosts = (countRes.data.posts || []).filter(
            p => p.id > latestPostIdRef.current
          );
          if (newPosts.length > 0) {
            setNewPostCount(newPosts.length);
          }
        }
      } catch {
        // Silent — polling failure never surfaces to user
      }
    };

    // Start polling after initial load settles
    pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [enabled, followingOnly, mood]);

  // ── Optimistic: reaction update ───────────────────────
  // Called by PostCard after a successful like/bookmark call.
  const updatePostReaction = useCallback((postId, reactionType, isAdding) => {
    setState(prev => ({
      ...prev,
      posts: prev.posts.map(p => {
        if (p.id !== postId) return p;
        const delta = isAdding ? 1 : -1;
        if (reactionType === 'like') {
          return {
            ...p,
            like_count:     Math.max(0, (p.like_count || 0) + delta),
            user_reactions: { ...p.user_reactions, liked: isAdding },
          };
        }
        return {
          ...p,
          bookmark_count:  Math.max(0, (p.bookmark_count || 0) + delta),
          user_reactions: { ...p.user_reactions, bookmarked: isAdding },
        };
      }),
    }));
  }, []);

  // ── Optimistic: follow state update ───────────────────
  const updateFollowState = useCallback((characterId, isFollowing) => {
    setState(prev => ({
      ...prev,
      posts: prev.posts.map(p =>
        p.character?.id === characterId
          ? { ...p, is_following: isFollowing }
          : p
      ),
    }));
  }, []);

  // ── Background poll — detect new posts every 2 minutes ──
  // Fetches only the single latest post and compares its id
  // to what the user has already seen. Never reloads the feed
  // automatically — just shows a banner count.
  useEffect(() => {
    if (!enabled) return;

    const POLL_INTERVAL_MS = 2 * 60 * 1000;  // 2 minutes

    const checkForNewPosts = async () => {
      // Don't poll if user hasn't loaded any posts yet
      if (!latestSeenIdRef.current) return;
      try {
        const endpoint = followingOnly ? '/social/feed/following' : '/social/feed';
        const params   = new URLSearchParams({ page: '1', per_page: '5', sort: 'latest' });
        if (mood) params.set('mood', mood);
        const res = await api.get(`${endpoint}?${params}`);
        if (res.data?.status !== 'success') return;
        const freshPosts = res.data.posts || [];
        if (!freshPosts.length) return;
        const maxFreshId = Math.max(...freshPosts.map(p => p.id));
        if (maxFreshId > latestSeenIdRef.current) {
          // Count how many posts are newer than what we've seen
          const newCount = freshPosts.filter(p => p.id > latestSeenIdRef.current).length;
          setNewPostCount(prev => Math.max(prev, newCount));
        }
      } catch {
        // silent — poll failure never surfaces to user
      }
    };

    pollTimerRef.current = setInterval(checkForNewPosts, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [enabled, sort, followingOnly, mood]);

  // ── Initial + dependency fetch ─────────────────────────
  useEffect(() => {
    if (!enabled) return;
    fetchPage(1, false);
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [enabled, sort, followingOnly, mood, fetchPage]);

  // ── Cleanup on unmount ─────────────────────────────────
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return {
    posts:              state.posts,
    loading:            state.loading,
    error:              state.error,
    hasMore:            state.hasMore,
    total:              state.total,
    page:               state.page,
    lastFetch:          state.lastFetch,
    newPostCount,
    loadMore,
    refetch,
    applyNewPosts,
    updatePostReaction,
    updateFollowState,
  };
};

// ─────────────────────────────────────────────────────────
// Companion: feed stats hook
// ─────────────────────────────────────────────────────────

export const useFeedStats = ({ enabled = true } = {}) => {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await api.get('/social/feed/stats');
        if (!cancelled && res.data?.status === 'success') {
          setStats(res.data.stats);
        }
      } catch {
        // silent — stats are non-critical display info
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [enabled]);

  return { stats, loading };
};

export default usePersonaFeed;