// src/components/StoryMode/StoryWindow/index.jsx - PLACEHOLDER
import React from 'react';
import styles from './StoryWindow.module.css';

export default function StoryWindow({ 
  story,
  onClose = () => {}
}) {
  return (
    <div className={styles.storyWindow}>
      <div className={styles.windowHeader}>
        <button onClick={onClose} className={styles.backButton}>
          ← Back
        </button>
        <h2>{story?.title || 'Story'}</h2>
        <div className={styles.comingSoonBadge}>Coming in Step 5-6</div>
      </div>
      
      <div className={styles.placeholderContent}>
        <p>📖 Full-screen story chat window coming soon</p>
        <p className={styles.hint}>This will be the immersive storytelling interface...</p>
      </div>
    </div>
  );
}