// src/components/ScenariosTab/ScenarioChatWindow/AvatarsColumn/EmotionRing.jsx
// Animated breathing ring around participant avatars

import React from 'react';
import styles from './AvatarsColumn.module.css';

/**
 * EmotionRing - Animated ring with multiple states
 * 
 * States:
 * - idle: Default breathing animation (subtle)
 * - queued: Next speaker, glowing ring (no dot)
 * - active: Currently speaking (gold ring + green dot)
 */
export default function EmotionRing({
  isActive = false,
  isQueued = false
}) {
  // Build className based on state
  const ringClassName = [
    styles.emotionRing,
    isActive && styles.active,
    isQueued && styles.queued
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={ringClassName}
      role="presentation"
      aria-hidden="true"
    >
      <div className={styles.ringPrimary} />
      <div className={styles.ringSecondary} />
      {isActive && <div className={styles.ringActive} />}
      {isQueued && <div className={styles.ringQueued} />}
    </div>
  );
}