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

  const abortControllerRef = useRef(null);
  const cacheRef           = useRef(new Map());

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
    fetchPage(1, false);
  }, [fetchPage]);

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
    loadMore,
    refetch,
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