// src/components/StoryMode/StoryWindow/StoryHeader.jsx - Top Bar
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import styles from './StoryWindow.module.css';

export default function StoryHeader({ story, onClose }) {
  // Format era display name
  const formatEra = (era) => {
    if (!era) return 'Modern';
    
    const eraMap = {
      'ancient': 'Ancient Times',
      'medieval': 'Medieval Era',
      'renaissance': 'Renaissance',
      '1800s': '1800s',
      '1890s': 'Victorian Era',
      '1900s': 'Early 1900s',
      '1950s': '1950s',
      'modern': 'Modern Day',
      '2050s': 'Near Future',
      'far_future': 'Far Future'
    };
    
    const normalizedEra = era.toLowerCase().trim();
    return eraMap[normalizedEra] || era;
  };

  return (
    <div className={styles.storyHeader}>
      {/* Back Button */}
      <button onClick={onClose} className={styles.backButton}>
        <ArrowLeft size={20} />
        <span>Back to Stories</span>
      </button>

      {/* Story Info */}
      <div className={styles.storyInfo}>
        <h1 className={styles.storyTitle}>{story.title}</h1>
        
        <div className={styles.storyMeta}>
          <span className={styles.eraBadge}>
            📅 {formatEra(story.era)}
          </span>
        </div>
      </div>
    </div>
  );
}