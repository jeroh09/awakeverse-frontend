// src/components/StoryMode/MyStoriesPanel/StoryCard.jsx
import React from 'react';
import styles from './MyStoriesPanel.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function StoryCard({ 
  story, 
  onOpen = () => {}, 
  onDelete = () => {},
  onResume = () => {},
  isDeleting = false
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
      'ancient': 'Ancient',
      'medieval': 'Medieval',
      'renaissance': 'Renaissance',
      '1800s': '1800s',
      '1890s': 'Victorian',
      '1900s': '1900s',
      '1950s': '1950s',
      'modern': 'Modern',
      '2050s': 'Future',
      'far_future': 'Far Future'
    };
    
    const normalizedEra = (era || '').toLowerCase().trim();
    return eraMap[normalizedEra] || era;
  };

  // Get character thumbnail
  const getCharacterThumbnail = (characterKey) => {
    return `${API_BASE}/character_images/${characterKey}.jpg`;
  };

  // Get era badge color
  const getEraBadgeColor = (era) => {
    const eraColors = {
      'ancient': '#8B4513',
      'medieval': '#2C3E50',
      'renaissance': '#E67E22',
      '1800s': '#7D3C98',
      '1890s': '#884EA0',
      '1900s': '#1F618D',
      '1950s': '#117A65',
      'modern': '#2874A6',
      '2050s': '#1ABC9C',
      'far_future': '#8E44AD'
    };
    
    const normalizedEra = (era || '').toLowerCase().trim();
    return eraColors[normalizedEra] || '#3498DB';
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
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
  const characterKey = story.main_character_key || 'sherlock';
  const characterName = characterKey.charAt(0).toUpperCase() + characterKey.slice(1);
  const eraBadgeColor = getEraBadgeColor(story.era);

  return (
    <div className={`${styles.storyCard} ${isDeleting ? styles.deleting : ''}`}>
      {/* Era Badge */}
      <span 
        className={styles.eraBadge}
        style={{ backgroundColor: eraBadgeColor }}
      >
        {formatEraName(story.era)}
      </span>

      {/* Status Badge */}
      {isPaused && (
        <span className={styles.statusBadge}>Paused</span>
      )}

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
          style={{
            backgroundImage: `url(${getCharacterThumbnail(characterKey)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <span className={styles.avatarFallback}>
            {characterName.charAt(0)}
          </span>
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
          <span className={styles.metaText}>Act {story.current_act || 1}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaIcon}>💬</span>
          <span className={styles.metaText}>{story.total_turns || 0} turns</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaIcon}>🕐</span>
          <span className={styles.metaText}>{formatTimeAgo(story.last_active || story.created_at)}</span>
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
  );
}