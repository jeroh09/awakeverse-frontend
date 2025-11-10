// src/components/StoryMode/MyStoriesPanel/index.jsx - Complete Implementation
import React, { useState, useEffect } from 'react';
import useStoryApi from '../../../hooks/useStoryApi';
import StoryCard from './StoryCard';
import styles from './MyStoriesPanel.module.css';

export default function MyStoriesPanel({ 
  refreshKey = 0,
  onStoryOpen = () => {},
  onStoryDeleted = () => {}
}) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

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
        count: data.stories?.length || 0
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
    if (!window.confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(storyId);
      await deleteStory(storyId);
      
      console.log('✅ Story deleted:', storyId);
      
      // Remove from local state
      setStories(prev => prev.filter(s => s.id !== storyId));
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

  if (loading) {
    return (
      <div className={styles.myStoriesPanel}>
        <div className={styles.panelHeader}>
          <h3>My Stories</h3>
        </div>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your stories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.myStoriesPanel}>
        <div className={styles.panelHeader}>
          <h3>My Stories</h3>
        </div>
        <div className={styles.errorState}>
          <p>{error}</p>
          <button onClick={loadStories} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (stories.length === 0) {
    return (
      <div className={styles.myStoriesPanel}>
        <div className={styles.panelHeader}>
          <h3>My Stories</h3>
          <div className={styles.storyCounter}>0 stories</div>
        </div>
        
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📚</div>
          <p className={styles.emptyTitle}>No stories yet</p>
          <p className={styles.emptyHint}>
            Create your first story using one of the templates above
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.myStoriesPanel}>
      <div className={styles.panelHeader}>
        <h3>My Stories</h3>
        <div className={styles.storyCounter}>
          {stories.length} {stories.length === 1 ? 'story' : 'stories'}
        </div>
      </div>

      <div className={styles.storiesGrid}>
        {stories.map(story => (
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
    </div>
  );
}