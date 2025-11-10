// src/components/StoryMode/StoryWindow/index.jsx - Main Container
import React, { useState, useEffect } from 'react';
import StoryHeader from './StoryHeader';
import StoryMessages from './StoryMessages';
import styles from './StoryWindow.module.css';

export default function StoryWindow({ story, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load story and message history
  useEffect(() => {
    if (!story?.id) {
      setError('No story selected');
      setLoading(false);
      return;
    }

    loadStory();
  }, [story?.id]);

  const loadStory = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📖 Loading story:', story.id);

      const response = await fetch(`/api/stories/${story.id}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to load story: ${response.status}`);
      }

      const data = await response.json();

      console.log('✅ Story loaded:', {
        id: story.id,
        messageCount: data.messages?.length || 0
      });

      setMessages(data.messages || []);

    } catch (err) {
      console.error('❌ Failed to load story:', err);
      setError(err.message || 'Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    console.log('📖 Closing story window');
    onClose();
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.storyWindow}>
        <div className={styles.storyContainer}>
          <StoryHeader story={story} onClose={handleClose} />
          
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading story...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.storyWindow}>
        <div className={styles.storyContainer}>
          <StoryHeader story={story} onClose={handleClose} />
          
          <div className={styles.errorState}>
            <h3>⚠️ Error Loading Story</h3>
            <p>{error}</p>
            <button onClick={loadStory} className={styles.retryButton}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main story window
  return (
    <div className={styles.storyWindow}>
      <div className={styles.storyContainer}>
        <StoryHeader story={story} onClose={handleClose} />
        
        <StoryMessages
          messages={messages}
          characterKey={story.main_character_key}
        />

        {/* Placeholder for StoryInput - Phase 2 */}
        <div className={styles.inputPlaceholder}>
          <p>💬 Message input coming in Phase 2...</p>
        </div>
      </div>
    </div>
  );
}