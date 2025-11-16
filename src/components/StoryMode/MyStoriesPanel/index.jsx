// src/components/StoryMode/MyStoriesPanel/index.jsx - Enhanced with Create Story CTA + Info
import React, { useState, useEffect } from 'react';
import useStoryApi from '../../../hooks/useStoryApi';
import StoryCard from './StoryCard';
import styles from './MyStoriesPanel.module.css';

export default function MyStoriesPanel({
  refreshKey = 0,
  onStoryOpen = () => {},
  onStoryDeleted = () => {},
  // Optional: parent can wire this to open StoryCreationForm
  onCreateStory,
}) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Local UI state for the "i" info panel
  const [showCreateInfo, setShowCreateInfo] = useState(false);

  const { getMyStories, deleteStory, resumeStory } = useStoryApi();

  // Load stories on mount and when refreshKey changes
  useEffect(() => {
    loadStories();
  }, [refreshKey]);

  const loadStories = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getMyStories('active', 50);
      setStories(data.stories || []);

      console.log('📚 My Stories loaded:', {
        count: data.stories?.length || 0,
      });
    } catch (err) {
      console.error('❌ Failed to load stories:', err);
      setError('Failed to load stories. Please try again.');
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle story opened
  const handleStoryOpen = (story) => {
    console.log('📖 Opening story:', story.id);
    onStoryOpen(story);
  };

  // Handle story deleted
  const handleStoryDelete = async (storyId) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this story? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setDeleting(storyId);
      await deleteStory(storyId);

      console.log('✅ Story deleted:', storyId);

      // Remove from local state
      setStories((prev) => prev.filter((s) => s.id !== storyId));
      onStoryDeleted();
    } catch (err) {
      console.error('❌ Failed to delete story:', err);
      alert('Failed to delete story. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  // Handle story resumed
  const handleStoryResume = async (storyId) => {
    try {
      await resumeStory(storyId);
      console.log('✅ Story resumed:', storyId);

      // Refresh stories list
      loadStories();
    } catch (err) {
      console.error('❌ Failed to resume story:', err);
      alert('Failed to resume story. Please try again.');
    }
  };

  // Create Story CTA click
  const handleCreateStoryClick = () => {
    if (typeof onCreateStory === 'function') {
      onCreateStory();
    } else {
      // Safe fallback: log so you can see it in dev tools
      console.log(
        '📝 Create Story clicked — wire `onCreateStory` prop to open StoryCreationForm.'
      );
    }
  };

  const openCreateInfo = () => setShowCreateInfo(true);
  const closeCreateInfo = () => setShowCreateInfo(false);

  // Header story count label
  const storyCountLabel = loading
    ? 'Loading…'
    : error
    ? '--'
    : `${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`;

  // Body content (list / empty / loading / error)
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
        <button onClick={loadStories} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  } else if (stories.length === 0) {
    content = (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📚</div>
        <p className={styles.emptyTitle}>No stories yet</p>
        <p className={styles.emptyHint}>
          Start a new story with your own idea or using a template above.
        </p>
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

  // Inline styles just for the info overlay (to avoid touching CSS files)
  const infoBackdropStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.78)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2200,
    padding: '1rem',
  };

  const infoCardStyle = {
    maxWidth: 480,
    width: '100%',
    borderRadius: 18,
    background: '#020617',
    border: '1px solid rgba(148,163,184,0.85)',
    boxShadow:
      '0 24px 60px rgba(15,23,42,0.96), 0 0 40px rgba(79,70,229,0.45)',
    padding: '1.1rem 1.2rem 1.25rem',
    color: '#e5e7eb',
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont',
    fontSize: '0.88rem',
    lineHeight: 1.6,
  };

  const infoHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.6rem',
  };

  const infoTitleStyle = {
    fontFamily: 'Syne, system-ui, -apple-system, BlinkMacSystemFont',
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    color: '#f9fafb',
  };

  const infoCloseStyle = {
    width: 26,
    height: 26,
    borderRadius: 999,
    border: 'none',
    background: 'transparent',
    color: '#9ca3af',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1.1rem',
  };

  return (
    <div className={styles.myStoriesPanel}>
      {/* Header with counter, Create Story CTA, and info button */}
      <div className={styles.panelHeader}>
        <h3>My Stories</h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div className={styles.storyCounter}>{storyCountLabel}</div>

          {/* Create Story CTA re-uses retryButton styling (indigo button) */}
          <button
            type="button"
            className={styles.retryButton}
            onClick={handleCreateStoryClick}
            disabled={loading}
          >
            + Create Story
          </button>

          {/* Info "i" button on the far right */}
          <button
            type="button"
            onClick={openCreateInfo}
            aria-label="How to use Create Story"
            className={styles.actionButton}
          >
            i
          </button>
        </div>
      </div>

      {content}

      {/* Info overlay explaining the Create Story flow */}
      {showCreateInfo && (
        <div style={infoBackdropStyle} onClick={closeCreateInfo}>
          <div
            style={infoCardStyle}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="How to use Create Story"
          >
            <div style={infoHeaderStyle}>
              <span style={infoTitleStyle}>How to use Create Story</span>
              <button
                type="button"
                style={infoCloseStyle}
                onClick={closeCreateInfo}
                aria-label="Close help"
              >
                ×
              </button>
            </div>

            <div>
              <p>
                <strong>Quick guide:</strong> Create Story lets you start a new
                interactive story in AwakeVerse.
              </p>
              <ol style={{ paddingLeft: '1.3rem', margin: '0.3rem 0 0.8rem' }}>
                <li>
                  <strong>Choose a starting point.</strong> You can either pick
                  a template from the gallery above or click{' '}
                  <em>Create Story</em> to begin from your own idea.
                </li>
                <li>
                  <strong>Set your world.</strong> In the form, give the story a
                  title, choose the main character, era and tech level. This
                  keeps the AI inside the right time period.
                </li>
                <li>
                  <strong>Describe the opening scene (optional).</strong> Use
                  the Scene Style field to describe the atmosphere you want, for
                  example:{' '}
                  <em>
                    “A fog-drenched Victorian alley lit by a single gas lamp.”
                  </em>
                </li>
                <li>
                  <strong>Check the preview.</strong> The summary shows how your
                  story will open. Adjust the inputs until it feels right.
                </li>
                <li>
                  <strong>Begin.</strong> Click <em>Create Story</em> in the
                  form to start. You can always steer the story by chatting with
                  your character.
                </li>
              </ol>
              <p
                style={{
                  marginTop: '0.3rem',
                  fontSize: '0.8rem',
                  color: '#a5b4fc',
                }}
              >
                You can return to this help any time if you’re unsure what a
                field does or how it affects the story.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
