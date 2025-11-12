// src/components/StoryMode/StoryWindow/StoryHeader.jsx
import React from 'react';
import StoryHomeButton from './StoryHomeButton';
import styles from './StoryWindow.module.css';

export default function StoryHeader({ story, onBack, onClose }) {
  // Prefer onBack, fall back to onClose so it works with existing callers
  const handleBack = onBack || onClose || (() => {});

  const formatEra = (era) => {
    if (!era) return 'Modern';
    const map = {
      ancient: 'Ancient Times',
      medieval: 'Medieval Era',
      renaissance: 'Renaissance',
      '1800s': '1800s',
      '1890s': 'Victorian Era',
      '1900s': 'Early 1900s',
      '1950s': '1950s',
      modern: 'Modern Day',
      '2050s': 'Near Future',
      far_future: 'Far Future'
    };
    const key = String(era || '').toLowerCase().trim();
    return map[key] || era;
  };

  const formatCharacterName = (key) => {
    if (!key) return 'Unknown';
    if (key.startsWith?.('user_')) {
      const parts = key.split('_');
      return parts[2]
        ? parts[2].charAt(0).toUpperCase() + parts[2].slice(1)
        : 'Custom Character';
    }
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  return (
    <>
      {/* Transparent floating Home icon (matches Scenarios) */}
      <StoryHomeButton onClick={onBack || onClose} />
      <header className={styles.storyHeader}>
        {/* Optional inner wrapper for consistent max width with chat frame */}
        <div className={styles.headerContent}>
          <h1 className={styles.storyTitle}>
            {story?.title || 'Untitled Story'}
          </h1>

          <div className={styles.storyMeta}>
            <span className={styles.eraBadge}>
              <span>📅</span> {formatEra(story?.era)}
            </span>

            <span className={styles.characterBadge}>
              <span>👤</span> {formatCharacterName(story?.main_character_key)}
            </span>

            {Number.isFinite?.(story?.current_act) && (
              <span className={styles.actBadge}>
                <span>🎭</span> Act {story.current_act}
              </span>
            )}

            {Number.isFinite?.(story?.total_turns) && story.total_turns > 0 && (
              <span className={styles.turnsBadge}>
                <span>💬</span> {story.total_turns} turns
              </span>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
