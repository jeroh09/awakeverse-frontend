// src/components/StoryMode/index.jsx - Main Story Mode Tab
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import SubscriptionService from '../../services/SubscriptionService';
import DefensiveStoryWrapper from './DefensiveStoryWrapper';
import TemplatesGallery from './TemplatesGallery';
import MyStoriesPanel from './MyStoriesPanel';
import StoryWindow from './StoryWindow';
import styles from './StoryMode_module.css';

export default function StoryModeTab() {
  const { token } = useAuth();
  const { user } = useUser();
  
  // Subscription state
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Active story state
  const [activeStory, setActiveStory] = useState(null);
  
  // Stories refresh trigger
  const [storiesRefreshKey, setStoriesRefreshKey] = useState(0);

  // Load subscription data on mount
  useEffect(() => {
    loadSubscriptionData();
  }, [user]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const subData = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionData(subData);

      console.log('📊 Story Mode - Subscription loaded:', {
        tier: subData?.tier,
        hasAccess: subData?.tier !== 'free'
      });

    } catch (err) {
      console.error('❌ Failed to load subscription:', err);
      setError('Failed to load subscription data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Handle story opened
  const handleStoryOpen = (story) => {
    console.log('📖 Opening story:', story.id);
    setActiveStory(story);
  };

  // Handle story closed
  const handleStoryClose = () => {
    console.log('📖 Closing story');
    setActiveStory(null);
    // Refresh stories list
    setStoriesRefreshKey(prev => prev + 1);
  };

  // Handle story created
  const handleStoryCreated = (newStory) => {
    console.log('✅ Story created:', newStory);
    setStoriesRefreshKey(prev => prev + 1);
  };

  // Handle story deleted
  const handleStoryDeleted = () => {
    console.log('🗑️ Story deleted');
    setStoriesRefreshKey(prev => prev + 1);
  };

  // Handle upgrade required (not gated for now)
  const handleUpgradeRequired = (reason) => {
    console.log('⚠️ Upgrade required:', reason);
    // For now, Story Mode is not gated
    // In the future, add upgrade modal here
  };

  // Loading state
  if (loading) {
    return (
      <DefensiveStoryWrapper>
        <div className={styles.storyModeContainer}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading Story Mode...</p>
          </div>
        </div>
      </DefensiveStoryWrapper>
    );
  }

  // Error state
  if (error) {
    return (
      <DefensiveStoryWrapper>
        <div className={styles.storyModeContainer}>
          <div className={styles.errorState}>
            <h3>⚠️ Error Loading Story Mode</h3>
            <p>{error}</p>
            <button onClick={loadSubscriptionData} className={styles.retryButton}>
              Retry
            </button>
          </div>
        </div>
      </DefensiveStoryWrapper>
    );
  }

  // Full-screen story window
  if (activeStory) {
    return (
      <DefensiveStoryWrapper>
        <StoryWindow
          story={activeStory}
          onClose={handleStoryClose}
        />
      </DefensiveStoryWrapper>
    );
  }

  // Main story mode interface
  return (
    <DefensiveStoryWrapper>
      <div className={styles.storyModeContainer}>
        <div className={styles.storyModeContent}>
          {/* Templates Gallery Section */}
          <section className={styles.templatesSection}>
            <TemplatesGallery
              onStoryCreated={handleStoryCreated}
              onUpgradeRequired={handleUpgradeRequired}
            />
          </section>

          {/* My Stories Section */}
          <section className={styles.myStoriesSection}>
            <MyStoriesPanel
              refreshKey={storiesRefreshKey}
              onStoryOpen={handleStoryOpen}
              onStoryDeleted={handleStoryDeleted}
            />
          </section>
        </div>
      </div>
    </DefensiveStoryWrapper>
  );
}