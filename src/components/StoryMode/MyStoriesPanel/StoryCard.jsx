// src/components/StoryMode/MyStoriesPanel/StoryCard.jsx
import React from 'react';
import { characterCategories } from '../../../data/characterCategories';
import styles from './MyStoriesPanel.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

// Same helper function as in StoryTemplateCard
const getCharacterInfo = (charKey) => {
  for (const category of characterCategories) {
    const found = category.characters?.find((c) => c.key === charKey);
    if (found) return { name: found.name, thumbnailUrl: found.thumbnailUrl };
  }
  // graceful fallback
  return {
    name: (charKey || '')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    thumbnailUrl: null,
  };
};

export default function StoryCard({
  story,
  onOpen = () => {},
  onDelete = () => {},
  onResume = () => {},
  isDeleting = false,
}) {
  const handleOpen = () => {
    onOpen(story);
  };

  const handleDelete = () => {
    onDelete(story.id);
  };

  const handleResume = () => {
    onResume(story.id);
  };

  // Format era display name
  const formatEraName = (era) => {
    if (!era) return 'Modern';

    const eraMap = {
      ancient: 'Ancient',
      medieval: 'Medieval',
      renaissance: 'Renaissance',
      '1800s': '1800s',
      '1890s': 'Victorian',
      '1900s': '1900s',
      '1950s': '1950s',
      modern: 'Modern',
      '2050s': 'Future',
      far_future: 'Far Future',
    };

    const normalizedEra = (era || '').toLowerCase().trim();
    return eraMap[normalizedEra] || era;
  };

  // Get era badge color
  const getEraBadgeColor = (era) => {
    const eraColors = {
      ancient: '#8B4513',
      medieval: '#2C3E50',
      renaissance: '#E67E22',
      '1800s': '#7D3C98',
      '1890s': '#884EA0',
      '1900s': '#1F618D',
      '1950s': '#117A65',
      modern: '#2874A6',
      '2050s': '#1ABC9C',
      far_future: '#8E44AD',
    };

    const normalizedEra = (era || '').toLowerCase().trim();
    return eraColors[normalizedEra] || '#3498DB';
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Just now';

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Check if story is paused
  const isPaused = story.status === 'paused';

  // Character resolution using same helper as templates
  const characterKey = story.main_character_key || null;
  const {
    name: characterName,
    thumbnailUrl,
  } = characterKey
    ? getCharacterInfo(characterKey)
    : { name: 'Your Character', thumbnailUrl: null };

  const eraBadgeColor = getEraBadgeColor(story.era);

  // 🔹 NEW: cinematic background image from scene_url (with thumbnail fallback)
  const scenicUrl = story.scene_url || story.sceneUrl || null;

  let cardImageUrl = null;
  if (scenicUrl) {
    // If you store `/story-scenes/xxx.jpg` in DB, this works directly
    if (scenicUrl.startsWith('http')) {
      cardImageUrl = scenicUrl;
    } else {
      cardImageUrl = scenicUrl;
    }
  } else if (thumbnailUrl) {
    // Soft fallback: use character thumbnail as blurred background
    cardImageUrl = thumbnailUrl;
  }

  return (
    <div className={`${styles.storyCard} ${isDeleting ? styles.deleting : ''}`}>
      {/* 🔹 Cinematic background layer */}
      {cardImageUrl && (
        <div
          className={styles.storyCardBackground}
          style={{ backgroundImage: `url(${cardImageUrl})` }}
        >
          <div className={styles.storyCardGradient} />
        </div>
      )}

      {/* 🔹 All existing content wrapped in inner container */}
      <div className={styles.storyCardInner}>
        {/* Era Badge */}
        <span
          className={styles.eraBadge}
          style={{ backgroundColor: eraBadgeColor }}
        >
          {formatEraName(story.era)}
        </span>

        {/* Status Badge */}
        {isPaused && <span className={styles.statusBadge}>Paused</span>}

        {/* Story Header */}
        <div className={styles.storyHeader}>
          <h4 className={styles.storyTitle}>{story.title}</h4>

          <div className={styles.storyActions}>
            {isPaused && (
              <button
                className={styles.actionButton}
                onClick={handleResume}
                title="Resume story"
                disabled={isDeleting}
              >
                ▶️
              </button>
            )}
            <button
              className={`${styles.actionButton} ${styles.deleteButton}`}
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete story"
            >
              {isDeleting ? '⏳' : '🗑️'}
            </button>
          </div>
        </div>

        {/* Character Preview */}
        <div className={styles.characterPreview}>
          <div
            className={styles.characterAvatar}
            style={
              thumbnailUrl
                ? {
                    backgroundImage: `url(${thumbnailUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : {}
            }
          >
            {!thumbnailUrl && (
              <span className={styles.avatarFallback}>
                {characterName.charAt(0)}
              </span>
            )}
          </div>
          <div className={styles.characterInfo}>
            <span className={styles.characterLabel}>Main Character</span>
            <span className={styles.characterName}>{characterName}</span>
          </div>
        </div>

        {/* Story Meta */}
        <div className={styles.storyMeta}>
          <div className={styles.metaItem}>
            <span className={styles.metaIcon}>📖</span>
            <span className={styles.metaText}>
              Act {story.current_act || 1}
            </span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaIcon}>💬</span>
            <span className={styles.metaText}>
              {story.total_turns || 0} turns
            </span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaIcon}>🕐</span>
            <span className={styles.metaText}>
              {formatTimeAgo(story.last_active || story.created_at)}
            </span>
          </div>
        </div>

        {/* Continue Button */}
        <button
          className={styles.continueButton}
          onClick={handleOpen}
          disabled={isDeleting}
        >
          {story.total_turns > 0 ? 'Continue Story' : 'Start Story'}
        </button>
      </div>
    </div>
  );
}
