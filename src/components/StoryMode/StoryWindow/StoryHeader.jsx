// src/components/StoryMode/StoryWindow/StoryHeader.jsx - UPDATED
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import styles from './StoryWindow.module.css';

export default function StoryHeader({ story, onClose }) {
  // Format era display name - handles custom eras
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
    
    // Return custom era name as-is if not in predefined map
    const normalizedEra = (era || '').toLowerCase().trim();
    return eraMap[normalizedEra] || era;
  };

  // Format character name - handles custom characters
  const formatCharacterName = (characterKey) => {
    if (!characterKey) return 'Unknown';
    
    // Handle custom character keys (user_123_mycharacter)
    if (characterKey.startsWith('user_')) {
      // Extract display name from custom character key
      const parts = characterKey.split('_');
      return parts[2] ? 
        parts[2].charAt(0).toUpperCase() + parts[2].slice(1) : 
        'Custom Character';
    }
    
    return characterKey.charAt(0).toUpperCase() + characterKey.slice(1);
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
          
          <span className={styles.characterBadge}>
            👤 {formatCharacterName(story.main_character_key)}
          </span>
          
          {story.current_act && (
            <span className={styles.actBadge}>
              🎭 Act {story.current_act}
            </span>
          )}
          
          {story.total_turns > 0 && (
            <span className={styles.turnsBadge}>
              💬 {story.total_turns} turns
            </span>
          )}
        </div>
      </div>
    </div>
  );
}