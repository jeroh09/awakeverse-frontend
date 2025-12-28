// src/components/StoryMode/StoryWindow/ChatPanel.jsx
import React from 'react';
import ChatHeader from './ChatHeader';
import StoryMessages from './StoryMessages';
import { getStoryBackgroundUrl } from '../../../constants/storyBackgrounds';
import styles from './StoryWindow.module.css';

/**
 * ChatPanel - Left panel containing header with background and messages
 * 
 * Props:
 * - story: Story object with metadata and messages
 * - onClose: Callback to return to story list
 */
export default function ChatPanel({ story, onClose }) {
  // Get background image with proper fallback logic
  const headerImageUrl = getStoryBackgroundUrl(story);

  return (
    <div className={styles.chatPanel}>
      {/* Header with Background Image */}
      <ChatHeader
        story={story}
        backgroundImage={headerImageUrl}
        onClose={onClose}
      />
      
      {/* Messages Area */}
      <StoryMessages
        messages={story?.messages || []}
        characterKey={story?.main_character_key}
        openingBanner={story?.opening_banner}
      />
    </div>
  );
}