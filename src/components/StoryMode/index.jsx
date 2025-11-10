// src/components/StoryMode/index.jsx - Fixed Version with Correct Subscription Structure
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../contexts/UserContext';
import SubscriptionService from '../../services/SubscriptionService';
import DefensiveStoryWrapper from './DefensiveStoryWrapper';
import TemplatesGallery from './TemplatesGallery';
import MyStoriesPanel from './MyStoriesPanel';
import StoryWindow from './StoryWindow';
import styles from './StoryMode_module.css';

export default function StoryModeTab() {
  const { user } = useUser();
  
  // Subscription state - matching ScenariosTab structure
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Active story state
  const [activeStory, setActiveStory] = useState(null);
  
  // Stories refresh trigger
  const [storiesRefreshKey, setStoriesRefreshKey] = useState(0);

  // Fetch subscription data using SubscriptionService - FIXED to match ScenariosTab
  const loadSubscriptionData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Story Mode: Loading subscription data for user:', user.id);
      
      // ✅ FIXED: Use correct method name that exists
      const data = await SubscriptionService.getUserSubscriptionStatus(user.id);
      
      console.log('✅ Story Mode - Subscription loaded:', {
        tier: data.subscription?.tier,
        tier_name: data.subscription?.tier_name,
        unlimited: data.subscription?.unlimited,
        status: data.status
      });
      
      if (data.status === 'success' && data.subscription) {
        setSubscriptionData(data);
        
        // Check subscription status (for logging only - not gating access)
        const hasUnlimited = data.subscription.tier === 'unlimited' || 
                           data.subscription.tier_name === 'unlimited' ||
                           data.subscription.unlimited === true;
        
        console.log('📖 Story Mode Access:', hasUnlimited ? 'PREMIUM' : 'STANDARD');
      } else {
        // Use fallback data like ScenariosTab
        console.warn('⚠️ Story Mode: Using fallback subscription data');
        const fallback = SubscriptionService.getFallbackSubscriptionData();
        setSubscriptionData(fallback);
      }
    } catch (error) {
      console.error('❌ Story Mode: Failed to load subscription:', error);
      // Use fallback like ScenariosTab
      const fallback = SubscriptionService.getFallbackSubscriptionData();
      setSubscriptionData(fallback);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Initialize on mount
  useEffect(() => {
    loadSubscriptionData();
  }, [loadSubscriptionData]);

  // Handle story opened
  const handleStoryOpen = useCallback((story) => {
    console.log('📖 Opening story:', story.id);
    setActiveStory(story);
  }, []);

  // Handle story closed
  const handleStoryClose = useCallback(() => {
    console.log('📖 Closing story');
    setActiveStory(null);
    // Refresh stories list
    setStoriesRefreshKey(prev => prev + 1);
  }, []);

  // Handle story created
  const handleStoryCreated = useCallback((newStory) => {
    console.log('✅ Story created:', newStory);
    setStoriesRefreshKey(prev => prev + 1);
  }, []);

  // Handle story deleted
  const handleStoryDeleted = useCallback(() => {
    console.log('🗑️ Story deleted');
    setStoriesRefreshKey(prev => prev + 1);
  }, []);

  // Handle upgrade required (not gated for now)
  const handleUpgradeRequired = useCallback((reason) => {
    console.log('⚠️ Upgrade required:', reason);
    // For now, Story Mode is not gated
    // In the future, add upgrade modal here if needed
  }, []);

  // DEFENSIVE: Show loading until subscription is loaded - matching ScenariosTab pattern
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

  // MAIN CONTENT - Story Mode is not gated, so always show
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