// src/components/StoryMode/MyStoriesPanel/index.jsx - Enhanced with unified header + clean info modal
import React, { useState, useEffect } from 'react';
import useStoryApi from '../../../hooks/useStoryApi';
import StoryCard from './StoryCard';
import styles from './MyStoriesPanel.module.css';

export default function MyStoriesPanel({
  refreshKey = 0,
  onStoryOpen = () => {},
  onStoryDeleted = () => {},
  onCreateStory,
}) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showCreateInfo, setShowCreateInfo] = useState(false);

  const { getMyStories, deleteStory, resumeStory } = useStoryApi();

  useEffect(() => {
    loadStories();
  }, [refreshKey]);

  const loadStories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyStories('active', 50);
      setStories(data.stories || []);
      console.log('📚 My Stories loaded:', { count: data.stories?.length || 0 });
    } catch (err) {
      console.error('❌ Failed to load stories:', err);
      setError('Failed to load stories. Please try again.');
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryOpen = (story) => {
    console.log('📖 Opening story:', story.id);
    onStoryOpen(story);
  };

  const handleStoryDelete = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      return;
    }
    try {
      setDeleting(storyId);
      await deleteStory(storyId);
      console.log('✅ Story deleted:', storyId);
      setStories((prev) => prev.filter((s) => s.id !== storyId));
      onStoryDeleted();
    } catch (err) {
      console.error('❌ Failed to delete story:', err);
      alert('Failed to delete story. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleStoryResume = async (storyId) => {
    try {
      await resumeStory(storyId);
      console.log('✅ Story resumed:', storyId);
      loadStories();
    } catch (err) {
      console.error('❌ Failed to resume story:', err);
      alert('Failed to resume story. Please try again.');
    }
  };

  const handleCreateStoryClick = () => {
    if (typeof onCreateStory === 'function') {
      onCreateStory();
    } else {
      console.log('📝 Create Story clicked – wire `onCreateStory` prop to open StoryCreationForm.');
    }
  };

  const openCreateInfo = () => setShowCreateInfo(true);
  const closeCreateInfo = () => setShowCreateInfo(false);

  const storyCountLabel = loading ? 'Loading…' : error ? '--' : `${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`;

  let content;
  if (loading) {
    content = (
      <div className={styles.loadingState}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your stories...</p>
      </div>
    );
  } else if (error) {
    content = (
      <div className={styles.errorState}>
        <p>{error}</p>
        <button onClick={loadStories} className={styles.retryButton}>Try Again</button>
      </div>
    );
  } else if (stories.length === 0) {
    content = (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📚</div>
        <p className={styles.emptyTitle}>No stories yet</p>
        <p className={styles.emptyHint}>Start a new story with your own idea or using a template above.</p>
      </div>
    );
  } else {
    content = (
      <div className={styles.storiesGrid}>
        {stories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            onOpen={handleStoryOpen}
            onDelete={handleStoryDelete}
            onResume={handleStoryResume}
            isDeleting={deleting === story.id}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.myStoriesPanel}>
      <div className={styles.panelHeader}>
        <h3>My Stories</h3>
        
        <div className={styles.headerActionsContainer}>
          <div className={styles.storyCounter}>{storyCountLabel}</div>
          <button type="button" className={styles.retryButton} onClick={handleCreateStoryClick} disabled={loading}>
            + Create Story
          </button>
          <button type="button" onClick={openCreateInfo} aria-label="How to use Create Story" className={styles.actionButton}>
            i
          </button>
        </div>
      </div>

      {content}

      {showCreateInfo && (
        <div className={styles.infoOverlay} onClick={closeCreateInfo}>
          <div className={styles.infoModal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="How to use Create Story">
            <div className={styles.infoHeader}>
              <div>
                <div className={styles.infoTitle}>How to use Create Story</div>
                <div className={styles.infoSubtitle}>A quick guide to creating stories in AwakeVerse</div>
              </div>
              <button type="button" className={styles.infoClose} onClick={closeCreateInfo} aria-label="Close help">✕</button>
            </div>

            <div className={styles.infoBody}>
              <div className={styles.infoSection}>
                <div className={styles.infoSectionTitle}>1) Choose a starting point</div>
                <ul className={styles.infoList}>
                  <li>Pick a <strong>template</strong> from the gallery above or click <strong>Create Story</strong> to begin from your own idea.</li>
                </ul>
              </div>

              <div className={styles.infoSection}>
                <div className={styles.infoSectionTitle}>2) Set your world</div>
                <ul className={styles.infoList}>
                  <li>Give the story a <strong>title</strong>, choose the main <strong>character</strong>, era and tech level. This keeps the AI inside the right time period.</li>
                </ul>
              </div>

              <div className={styles.infoSection}>
                <div className={styles.infoSectionTitle}>3) Describe the opening scene</div>
                <ul className={styles.infoList}>
                  <li>Use the Scene Style field to describe the atmosphere you want, for example: <em>"A fog-drenched Victorian alley lit by a single gas lamp."</em></li>
                </ul>
              </div>

              <div className={styles.infoSection}>
                <div className={styles.infoSectionTitle}>4) Preview & begin</div>
                <ul className={styles.infoList}>
                  <li>Check the <strong>summary</strong> to see how your story will open. Adjust the inputs until it feels right.</li>
                  <li>Click <strong>Create Story</strong> to begin. You can always steer the story by chatting with your character.</li>
                </ul>
              </div>

              <div className={styles.infoCallout}>💡 <strong>Tip:</strong> Your choices guide the story, but the AI adapts to your decisions. Don't worry about "breaking" the narrative!</div>
            </div>

            <div className={styles.infoFooter}>
              <button type="button" className={styles.infoPrimary} onClick={closeCreateInfo}>Got it!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}