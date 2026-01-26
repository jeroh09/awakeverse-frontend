// src/components/StoryMode/MyStoriesPanel/StoryCard.jsx - UPDATED
import React from 'react';
import { characterCategories } from '../../../data/characterCategories';
import {
  getDisplayNameFromKey,
  getCharacterThumbnailUrl,
  isCustomCharacterKey
} from '../../../utils/characterUtils';
import usePremiumCharacters from '../../../hooks/usePremiumCharacters';
import styles from './MyStoriesPanel.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

// Helper: resolve character name + thumbnail, with custom key support
const getCharacterInfo = (charKey, userCharacters = []) => {
  if (!charKey) {
    return {
      name: 'Your Character',
      thumbnailUrl: null
    };
  }

  // 1) Check for custom characters first
  const isCustom = isCustomCharacterKey(charKey);
  if (isCustom) {
    const customChar = userCharacters.find(c => c.character_key === charKey);
    if (customChar) {
      return {
        name: customChar.display_name,
        thumbnailUrl: customChar.avatar_url,
        isCustom: true
      };
    }
  }

  // 2) Try static character definitions
  for (const category of characterCategories) {
    const found = category.characters?.find((c) => c.key === charKey);
    if (found) {
      return {
        name: found.name,
        thumbnailUrl: found.thumbnailUrl || getCharacterThumbnailUrl(charKey, false),
        isCustom: false
      };
    }
  }

  // 3) Fallback: use shared utils
  const name = getDisplayNameFromKey(charKey);
  const thumbnailUrl = getCharacterThumbnailUrl(
    charKey,
    isCustomCharacterKey(charKey)
  );

  return { name, thumbnailUrl, isCustom: isCustomCharacterKey(charKey) };
};

export default function StoryCard({
  story,
  onOpen = () => {},
  onDelete = () => {},
  onResume = () => {},
  isDeleting = false
}) {
  const { userCharacters = [] } = usePremiumCharacters();

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
      far_future: 'Far Future'
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
      far_future: '#8E44AD'
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

  const isPaused = story.status === 'paused';

  const characterKey = story.main_character_key || null;
  const { name: characterName, thumbnailUrl } = characterKey
    ? getCharacterInfo(characterKey, userCharacters)
    : { name: 'Your Character', thumbnailUrl: null };

  const eraBadgeColor = getEraBadgeColor(story.era);

  return (
    <div 
      className={`${styles.storyCard} ${isPaused ? styles.paused : ''} ${isDeleting ? styles.deleting : ''}`}
    >
      {/* Status badge (only for paused stories) */}
      {isPaused && <span className={styles.statusBadge}>Paused</span>}

      {/* Inner content wrapper */}
      <div className={styles.cardContent}>
        {/* Header: title + actions */}
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

        {/* Metadata row */}
        <div className={styles.metadataRow}>
          <div className={styles.metaItem}>
            <span className={styles.metaIcon}>📖</span>
            <span>Act {story.current_act || 1}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaIcon}>💬</span>
            <span>{story.total_turns || 0} turns</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaIcon}>🕐</span>
            <span>{formatTimeAgo(story.last_active || story.created_at)}</span>
          </div>
        </div>

        {/* Character & Era row */}
        <div className={styles.characterEraRow}>
          <div className={styles.characterPreview}>
            <div
              className={styles.characterAvatar}
              style={
                thumbnailUrl
                  ? {
                      backgroundImage: `url(${thumbnailUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
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
              <span className={styles.characterLabel}>Character</span>
              <span className={styles.characterName}>{characterName}</span>
            </div>
          </div>
          
          <span
            className={styles.eraBadge}
            style={{ 
              backgroundColor: `${eraBadgeColor}20`,
              borderColor: `${eraBadgeColor}40`,
              color: eraBadgeColor
            }}
          >
            {formatEraName(story.era)}
          </span>
        </div>

        {/* Continue button */}
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