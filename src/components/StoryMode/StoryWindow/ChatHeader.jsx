// src/components/StoryMode/StoryWindow/ChatHeader.jsx
import React from 'react';
import { getDisplayNameFromKey } from '../../../utils/characterUtils';
import styles from './StoryWindow.module.css';

/**
 * ChatHeader - Header with background image and story metadata
 * 
 * Props:
 * - story: Story object
 * - backgroundImage: URL for header background (template-specific or generic)
 * - onClose: Callback to return to story list (not used here, kept for future)
 */
export default function ChatHeader({ story, backgroundImage }) {
  // Format era display name
  const formatEra = (era) => {
    if (!era) return 'Modern';
    
    const eraMap = {
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
    return eraMap[key] || era;
  };

  const characterName = getDisplayNameFromKey(story?.main_character_key);
  const eraDisplay = formatEra(story?.era);

  // Fallback test image if no background provided
  const testBackgroundUrl = 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1600&q=80';
  const effectiveBackground = backgroundImage || testBackgroundUrl;

  // Debug logging
  React.useEffect(() => {
    console.log('📸 ChatHeader - Render Debug:', {
      backgroundImage: backgroundImage,
      effectiveBackground: effectiveBackground,
      usingFallback: !backgroundImage,
      story: story?.title,
      cssWillApply: effectiveBackground ? `url("${effectiveBackground}")` : 'none'
    });
  }, [backgroundImage, effectiveBackground, story]);

  // Build style object for background
  const headerStyle = {
    backgroundImage: `url("${effectiveBackground}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };

  return (
    <header 
      className={styles.chatHeader}
      style={headerStyle}
    >
      {/* Gradient overlay for readability */}
      <div className={styles.chatHeaderOverlay} />
      
      {/* Header content */}
      <div className={styles.chatHeaderContent}>
        <h1 className={styles.storyTitle}>
          {story?.title || 'Untitled Story'}
        </h1>

        <div className={styles.storyMeta}>
          <span className={styles.metaBadge}>
            <span>📅</span> {eraDisplay}
          </span>

          <span className={styles.metaBadge}>
            <span>👤</span> {characterName}
          </span>

          {Number.isFinite?.(story?.current_act) && (
            <span className={styles.metaBadge}>
              <span>🎭</span> Act {story.current_act}
            </span>
          )}

          {Number.isFinite?.(story?.total_turns) && story.total_turns > 0 && (
            <span className={styles.metaBadge}>
              <span>💬</span> {story.total_turns} turns
            </span>
          )}
        </div>
      </div>
    </header>
  );
}