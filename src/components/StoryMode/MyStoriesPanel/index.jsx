// src/components/StoryMode/MyStoriesPanel/index.jsx - PLACEHOLDER
import React from 'react';
import styles from './MyStoriesPanel.module.css';

export default function MyStoriesPanel({ 
  refreshKey = 0,
  onStoryOpen = () => {},
  onStoryDeleted = () => {}
}) {
  return (
    <div className={styles.myStoriesPanel}>
      <div className={styles.panelHeader}>
        <h3>My Stories</h3>
        <div className={styles.comingSoonBadge}>Coming in Step 3-4</div>
      </div>
      
      <div className={styles.placeholderContent}>
        <p>📚 Your created stories will appear here</p>
        <p className={styles.hint}>Story management panel coming soon...</p>
      </div>
    </div>
  );
}