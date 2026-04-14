// src/components/MarketHub/PostCard.jsx
//
// Renders a single AI-persona social post.
// Write calls (follow, react) use api instance — handles CSRF + auth automatically.
//
// Props:
//   post             — CharacterPost from /api/social/feed
//   onReaction       — fn(postId, reactionType, isAdding) — optimistic update
//   onFollowChange   — fn(characterId, isFollowing)       — optimistic update
//   isAuthenticated  — bool

import React, { useState, useCallback } from 'react';
import { Eye, Heart, Bookmark, Globe } from 'lucide-react';
import api from '../../api';
import styles from './PostCard.module.css';

// ── Post type display config ──────────────────────────────
const POST_TYPE_CONFIG = {
  reflection:        { label: 'Reflection',  accentVar: 'var(--accent-primary, #6366f1)' },
  wisdom_drop:       { label: 'Wisdom',      accentVar: '#10B981' },
  challenge:         { label: 'Challenge',   accentVar: '#F59E0B' },
  sharp_observation: { label: 'Observation', accentVar: '#38BDF8' },
};

// ── Avatar with img fallback ──────────────────────────────
const CharacterAvatar = ({ character, postType }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const config  = POST_TYPE_CONFIG[postType] || POST_TYPE_CONFIG.reflection;
  const initial = (character?.display_name || 'C').charAt(0).toUpperCase();

  if (character?.avatar_url && !imgFailed) {
    return (
      <img
        src={character.avatar_url}
        alt={character.display_name}
        className={styles.avatar}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className={styles.avatarFallback}
      style={{ color: config.accentVar }}
    >
      {initial}
    </div>
  );
};

// ── Time formatter ────────────────────────────────────────
const timeAgo = (isoString) => {
  if (!isoString) return '';
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ── Main component ────────────────────────────────────────
const PostCard = ({
  post,
  onReaction,
  onFollowChange,
  onCharacterClick,           // fn(character) — opens CharacterDetailPanel
  isAuthenticated = false,
}) => {
  const [followLoading,   setFollowLoading]   = useState(false);
  const [reactionLoading, setReactionLoading] = useState(null); // 'like'|'bookmark'|null

  if (!post) return null;

  const { character, user_reactions = {}, is_following = false } = post;
  const typeConfig = POST_TYPE_CONFIG[post.post_type] || POST_TYPE_CONFIG.reflection;

  // ── React (like / bookmark) ───────────────────────────
  const handleReaction = useCallback(async (reactionType) => {
    if (!isAuthenticated || reactionLoading) return;

    const isCurrentlyActive = reactionType === 'like'
      ? user_reactions.liked
      : user_reactions.bookmarked;

    // Optimistic update
    onReaction?.(post.id, reactionType, !isCurrentlyActive);
    setReactionLoading(reactionType);

    try {
      if (isCurrentlyActive) {
        // DELETE — remove reaction
        await api.delete(`/social/react/${post.id}`, {
          data: { reaction_type: reactionType },
        });
      } else {
        // POST — add reaction
        await api.post(`/social/react/${post.id}`, {
          reaction_type: reactionType,
        });
      }
    } catch (err) {
      // Revert optimistic update on failure
      onReaction?.(post.id, reactionType, isCurrentlyActive);
      console.error('Reaction error:', err);
    } finally {
      setReactionLoading(null);
    }
  }, [isAuthenticated, reactionLoading, user_reactions, post.id, onReaction]);

  // ── Follow / unfollow ─────────────────────────────────
  const handleFollow = useCallback(async () => {
    if (!isAuthenticated || followLoading || !character?.id) return;

    const willFollow = !is_following;
    onFollowChange?.(character.id, willFollow);
    setFollowLoading(true);

    try {
      if (willFollow) {
        await api.post(`/social/follow/${character.id}`);
      } else {
        await api.delete(`/social/follow/${character.id}`);
      }
    } catch (err) {
      // Revert
      onFollowChange?.(character.id, is_following);
      console.error('Follow error:', err);
    } finally {
      setFollowLoading(false);
    }
  }, [isAuthenticated, followLoading, character, is_following, onFollowChange]);

  // ── Render ────────────────────────────────────────────
  return (
    <article
      className={`${styles.card} ${styles[post.post_type] || ''}`}
      style={{ '--post-accent': typeConfig.accentVar }}
    >
      {/* ─ Header ─ */}
      <div className={styles.header}>
        <button
          className={styles.charRow}
          onClick={() => onCharacterClick?.(character)}
          disabled={!onCharacterClick || !character?.id}
          aria-label={`View ${character?.display_name || post.character_key}'s profile`}
        >
          <CharacterAvatar character={character} postType={post.post_type} />
          <div className={styles.charInfo}>
            <span className={styles.charName}>
              {character?.display_name || post.character_key}
            </span>
            <div className={styles.charMeta}>
              {character?.creator_level && (
                <span className={styles.creatorLevel}>
                  {character.creator_level}
                </span>
              )}
              {character?.expertise_domain && (
                <span className={styles.domainTag}>
                  {character.expertise_domain}
                </span>
              )}
            </div>
          </div>
        </button>

        <div className={styles.headerRight}>
          {isAuthenticated && character?.id && (
            <button
              className={`${styles.followBtn} ${is_following ? styles.following : ''}`}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {followLoading ? '…' : is_following ? '✓ Following' : '+ Follow'}
            </button>
          )}
          {/* Chapter badge — only on story posts */}
          {post.is_story_post && post.story_chapter != null && (
            <span className={styles.chapterBadge}>
              Ch.{post.story_chapter}
            </span>
          )}
          <span className={`${styles.typePill} ${styles[`pill_${post.post_type}`] || ''}`}>
            {typeConfig.label}
          </span>
        </div>
      </div>

      {/* ─ Topic badge ─ */}
      {post.topic_headline && (
        <div className={styles.topicBadge}>
          <Globe size={9} strokeWidth={1.5} />
          <span className={styles.topicText}>{post.topic_headline}</span>
        </div>
      )}

      {/* ─ Content ─ */}
      <p className={styles.content}>{post.content}</p>

      {/* ─ Footer ─ */}
      <div className={styles.footer}>
        <div className={styles.reactions}>
          <button
            className={`${styles.reactBtn} ${styles.likeBtn} ${user_reactions.liked ? styles.liked : ''}`}
            onClick={() => handleReaction('like')}
            disabled={!isAuthenticated || reactionLoading === 'like'}
            title={isAuthenticated ? 'Like' : 'Sign in to like'}
          >
            <Heart
              size={12}
              fill={user_reactions.liked ? 'currentColor' : 'none'}
              strokeWidth={1.8}
            />
            <span>{post.like_count || 0}</span>
          </button>

          <button
            className={`${styles.reactBtn} ${styles.bookmarkBtn} ${user_reactions.bookmarked ? styles.bookmarked : ''}`}
            onClick={() => handleReaction('bookmark')}
            disabled={!isAuthenticated || reactionLoading === 'bookmark'}
            title={isAuthenticated ? 'Bookmark' : 'Sign in to bookmark'}
          >
            <Bookmark
              size={12}
              fill={user_reactions.bookmarked ? 'currentColor' : 'none'}
              strokeWidth={1.8}
            />
            <span>{post.bookmark_count || 0}</span>
          </button>
        </div>

        <div className={styles.footerRight}>
          <span className={styles.viewCount}>
            <Eye size={10} strokeWidth={1.5} />
            {post.view_count || 0}
          </span>
          <span className={styles.timeAgo}>
            {timeAgo(post.published_at)}
          </span>
        </div>
      </div>
    </article>
  );
};

// ── Skeleton loader (used in FeedTab while loading) ───────
export const PostCardSkeleton = () => (
  <div className={styles.skeleton} />
);

export default PostCard;