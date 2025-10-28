// src/components/CreatorHub/PublishToHubButton.jsx
import React, { useState, useCallback } from 'react';
import { useUser } from '../../contexts/UserContext';
import api from '../../api';
import DualPathUpgradeSystem from '../DualPathUpgradeSystem';
import { triggerPublishConfetti } from '../../utils/confettiUtils';
import './PublishToHubButton.css';

const PublishToHubButton = ({ 
  character, 
  onPublishSuccess,
  onPublishError 
}) => {
  const { user } = useUser();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [error, setError] = useState(null);
  const [justPublished, setJustPublished] = useState(false);
  
  // DEFENSIVE: Only show for custom characters
  const isCustomCharacter = character?.character_key?.startsWith('user_');
  
  // Don't render anything for static characters
  if (!isCustomCharacter) {
    return null;
  }
  
  if (character?.source === 'market_hub') {
    return null;
  }

  if (!character?.status) {
    return null;
  }
  
  // Determine current state
  const isPublished = character?.is_market_featured;
  const canToggle = character?.status === 'approved';
  
  // Handle toggle click with tier check
  const handleToggleClick = useCallback(async () => {
    if (!user) {
      setError('Authentication required');
      return;
    }

    const isUnlimitedTier = await checkUnlimitedTier();
    
    if (!isUnlimitedTier) {
      setShowUpgradeModal(true);
      return;
    }

    await toggleCharacterPublish();
  }, [user, character]);

  // Check if user has unlimited tier
  const checkUnlimitedTier = async () => {
    try {
      const response = await api.get(`/premium/user_subscription/${user.id}`);
      
      if (response.data && response.data.subscription) {
        const tier = response.data.subscription.tier;
        return tier === 'unlimited';
      }
      
      return false;
    } catch (err) {
      console.error('Tier check failed:', err);
      return false;
    }
  };

  // Toggle publish state using the smart endpoint
  const toggleCharacterPublish = async () => {
    setIsProcessing(true);
    setError(null);
    setJustPublished(false);

    try {
      const response = await api.post('/creator-hub/toggle-publish', {
        character_id: character.id
      });

      if (!response.data) {
        throw new Error('Invalid server response');
      }

      const data = response.data;

      if (data.status === 'success') {
        const newPublishState = data.is_published;
        const actionTaken = data.action_taken;
        
        console.log(`Character ${actionTaken}:`, character.display_name);
        
        // 🎉 TRIGGER CONFETTI WHEN PUBLISHING
        if (actionTaken === 'published') {
          triggerPublishConfetti();
          setJustPublished(true);
          
          // Reset celebration state after animation
          setTimeout(() => setJustPublished(false), 3000);
        }
        
        if (onPublishSuccess) {
          onPublishSuccess({
            ...character,
            is_market_featured: newPublishState,
            market_published_at: data.published_at || character.market_published_at
          });
        }
        
        setError(null);
        
      } else {
        throw new Error(data.error || data.message || 'Toggle failed');
      }
      
    } catch (err) {
      console.error('Toggle error:', err);
      
      let errorMessage = 'Failed to toggle publish state';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      if (errorMessage.includes('private character')) {
        errorMessage = 'Character must be public to publish to Market Hub';
      } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('tier required')) {
        errorMessage = 'Unlimited tier required to publish';
      }
      
      setError(errorMessage);
      
      if (onPublishError) {
        onPublishError(errorMessage);
      }
      
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle upgrade modal close
  const handleUpgradeModalClose = useCallback(() => {
    setShowUpgradeModal(false);
  }, []);

  // Show published state (with unpublish option)
  if (isPublished) {
    return (
      <>
        <button
          onClick={handleToggleClick}
          disabled={isProcessing}
          className={`publish-to-hub-button published ${justPublished ? 'celebrating' : ''}`}
          title="Click to unpublish from Market Hub"
        >
          {isProcessing ? (
            <>
              <span className="button-spinner" />
              Unpublishing...
            </>
          ) : (
            <>
              <span className="button-icon">✓</span>
              {justPublished ? 'Published! 🎉' : 'Published • Click to Unpublish'}
            </>
          )}
        </button>

        {error && (
          <div className="publish-error">
            {error}
          </div>
        )}

        <DualPathUpgradeSystem
          isOpen={showUpgradeModal}
          onClose={handleUpgradeModalClose}
          triggerReason="publish_to_hub"
          currentUsage={null}
        />
      </>
    );
  }

  // Show unpublished state with publish option (approved characters only)
  if (canToggle) {
    return (
      <>
        <button
          onClick={handleToggleClick}
          disabled={isProcessing}
          className="publish-to-hub-button"
          title="Publish to Market Hub (Unlimited tier required)"
        >
          {isProcessing ? (
            <>
              <span className="button-spinner" />
              Publishing...
            </>
          ) : (
            <>
              <span className="button-icon">🚀</span>
              Publish to Market Hub
            </>
          )}
        </button>

        {error && (
          <div className="publish-error">
            {error}
          </div>
        )}

        <DualPathUpgradeSystem
          isOpen={showUpgradeModal}
          onClose={handleUpgradeModalClose}
          triggerReason="publish_to_hub"
          currentUsage={null}
        />
      </>
    );
  }

  // Character not approved yet - show status for OWNER only
  if (character.status === 'pending') {
    return (
      <div className="publish-status disabled">
        <span className="status-icon">⏳</span>
        Awaiting approval
      </div>
    );
  }

  if (character.status === 'rejected') {
    return (
      <div className="publish-status disabled">
        <span className="status-icon">⏳</span>
        Needs revision
      </div>
    );
  }

  // Fallback: hide button
  return null;
};

export default PublishToHubButton;