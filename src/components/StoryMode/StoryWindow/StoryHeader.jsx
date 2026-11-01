// src/components/StoryMode/StoryWindow/StoryHeader.jsx
import React from 'react';
import StoryHomeButton from './StoryHomeButton';
import { getDisplayNameFromKey } from '../../../utils/characterUtils';
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

  const characterName = getDisplayNameFromKey(story?.main_character_key);

  return (
    <>
      {/* Transparent floating Home icon (matches Scenarios) */}
      <StoryHomeButton onClick={handleBack} />

      <header className={styles.storyHeader}>
        {/* Inner wrapper for consistent max width with chat frame */}
        <div className={styles.headerContent}>
          <h1 className={styles.storyTitle}>
            {story?.title || 'Untitled Story'}
          </h1>

          <div className={styles.storyMeta}>
            <span className={styles.eraBadge}>
              <span>📅</span> {formatEra(story?.era)}
            </span>

            <span className={styles.characterBadge}>
              <span>👤</span> {characterName}
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
