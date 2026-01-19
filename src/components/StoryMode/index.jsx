// src/components/StoryMode/index.jsx - Updated with creation form integration + Info Modal
// ✅ PHASE 2 STEP 3: Now uses AppViewContext for activeStory state management
// ✅ STEP 2 INTEGRATION: Auto-show CreateStoryHelpInfo on first visit
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useAppView } from '../../contexts/AppViewContext';
import SubscriptionService from '../../services/SubscriptionService';
import DefensiveStoryWrapper from './DefensiveStoryWrapper';
import TemplatesGallery from './TemplatesGallery';
import MyStoriesPanel from './MyStoriesPanel';
import StoryWindow from './StoryWindow';
import StoryCreationForm from './StoryCreationForm';
import CreateStoryHelpInfo from './CreateStoryHelpInfo'; // ✅ NEW: Import info modal
import styles from './StoryMode.module.css';

export default function StoryModeTab() {
  const { user } = useUser();
  
  // ✅ Get activeStory from context instead of local state
  const { activeStory, setActiveStory } = useAppView();
  
  // Subscription state
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Stories refresh trigger
  const [storiesRefreshKey, setStoriesRefreshKey] = useState(0);

  // Creation form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(null);

  // ✅ NEW: Info modal state
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [pendingBlankCreate, setPendingBlankCreate] = useState(false);

  // Fetch subscription data using SubscriptionService
  const loadSubscriptionData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      console.log('📚 Story Mode: Loading subscription data for user:', user.id);
      
      const data = await SubscriptionService.getUserSubscriptionStatus(user.id);
      
      console.log('✅ Story Mode - Subscription loaded:', {
        tier: data.subscription?.tier,
        tier_name: data.subscription?.tier_name,
        unlimited: data.subscription?.unlimited,
        status: data.status
      });
      
      if (data.status === 'success' && data.subscription) {
        setSubscriptionData(data);
        
        const hasUnlimited = data.subscription.tier === 'unlimited' || 
                           data.subscription.tier_name === 'unlimited' ||
                           data.subscription.unlimited === true;
        
        console.log('📖 Story Mode Access:', hasUnlimited ? 'PREMIUM' : 'STANDARD');
      } else {
        console.warn('⚠️ Story Mode: Using fallback subscription data');
        const fallback = SubscriptionService.getFallbackSubscriptionData();
        setSubscriptionData(fallback);
      }
    } catch (error) {
      console.error('❌ Story Mode: Failed to load subscription:', error);
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
  }, [setActiveStory]);

  // Handle story closed
  const handleStoryClose = useCallback(() => {
    console.log('📖 Closing story');
    setActiveStory(null);
    setStoriesRefreshKey(prev => prev + 1);
  }, [setActiveStory]);

  // Handle story created from templates
  const handleStoryCreated = useCallback((newStory) => {
    console.log('✅ Story created from template:', newStory);
    setStoriesRefreshKey(prev => prev + 1);
    // Optionally open the story immediately
    // setActiveStory(newStory);
  }, []);

  // Handle story deleted
  const handleStoryDeleted = useCallback(() => {
    console.log('🗑️ Story deleted');
    setStoriesRefreshKey(prev => prev + 1);
  }, []);

  // ✅ MODIFIED: Open creation form with template + info modal check
  const handleTemplateSelect = useCallback((template) => {
    console.log('📝 Opening creation form with template:', template?.title);
    
    // Check if user has seen info before
    const hasSeenInfo = localStorage.getItem('awakeverse_story_mode_help_seen') === 'true';
    
    if (!hasSeenInfo) {
      // First time - show info modal first
      console.log('ℹ️ First visit - showing info modal before creation form');
      setActiveTemplate(template);
      setPendingBlankCreate(false);
      setShowInfoModal(true);
      // Form will open after user dismisses info
    } else {
      // User has seen it before - open form directly
      console.log('📝 Returning user - opening creation form directly');
      setActiveTemplate(template);
      setShowCreateForm(true);
    }
  }, []);

  // ✅ MODIFIED: Open blank creation form + info modal check
  const handleBlankCreate = useCallback(() => {
    console.log('📝 Opening blank creation form');
    
    // Check if user has seen info before
    const hasSeenInfo = localStorage.getItem('awakeverse_story_mode_help_seen') === 'true';
    
    if (!hasSeenInfo) {
      // First time - show info modal first
      console.log('ℹ️ First visit - showing info modal before creation form');
      setActiveTemplate(null);
      setPendingBlankCreate(true);
      setShowInfoModal(true);
      // Form will open after user dismisses info
    } else {
      // User has seen it before - open form directly
      console.log('📝 Returning user - opening creation form directly');
      setActiveTemplate(null);
      setShowCreateForm(true);
    }
  }, []);

  // ✅ NEW: Handle info modal close
  const handleInfoClose = useCallback(() => {
    console.log('ℹ️ Info modal closed');
    setShowInfoModal(false);
    
    // Now open the creation form
    console.log('📝 Opening creation form after info dismissal');
    setShowCreateForm(true);
    
    // Clear pending state
    setPendingBlankCreate(false);
  }, []);

  // Handle creation form success
  const handleCreateSuccess = useCallback((newStory) => {
    console.log('✅ Story created successfully:', newStory);
    setShowCreateForm(false);
    setActiveTemplate(null);
    setStoriesRefreshKey(prev => prev + 1);
    
    // Optionally open the new story immediately
    // setActiveStory(newStory);
  }, []);

  // Handle creation form close
  const handleCreateClose = useCallback(() => {
    console.log('📝 Creation form closed');
    setShowCreateForm(false);
    setActiveTemplate(null);
  }, []);

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
              onTemplateSelect={handleTemplateSelect}
            />
          </section>

          {/* My Stories Section */}
          <section className={styles.myStoriesSection}>
            <MyStoriesPanel
              refreshKey={storiesRefreshKey}
              onStoryOpen={handleStoryOpen}
              onStoryDeleted={handleStoryDeleted}
              onCreateStory={handleBlankCreate}
            />
          </section>
        </div>
      </div>

      {/* ✅ NEW: Info Modal with auto-show logic */}
      <CreateStoryHelpInfo
        isOpen={showInfoModal}
        onClose={handleInfoClose}
      />

      {/* Story Creation Form Modal */}
      <StoryCreationForm
        template={activeTemplate}
        isOpen={showCreateForm}
        onClose={handleCreateClose}
        onSuccess={handleCreateSuccess}
      />
    </DefensiveStoryWrapper>
  );
}