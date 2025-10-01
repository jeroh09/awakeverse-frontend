// src/components/CreatorHub/PublishToHubButton.jsx
// DEFENSIVE: Only show for custom characters (user_*)
import React, { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import api from '../../api';
import DualPathUpgradeSystem from '../DualPathUpgradeSystem';
import './PublishToHubButton.css';

const PublishToHubButton = ({ 
  character, 
  onPublishSuccess,
  onPublishError 
}) => {
  const { token } = useAuth();
  const { user } = useUser();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [error, setError] = useState(null);
  
  // DEFENSIVE: Only show for custom characters
  const isCustomCharacter = character?.character_key?.startsWith('user_');
  
  // Don't render anything for static characters
  if (!isCustomCharacter) {
    return null;
  }
  if (character?.source === 'market_hub') {
  return null;  // Hide button for discovered characters
}

// DEFENSIVE: If character doesn't have status field, it's likely not owned by user
// (Owned characters ALWAYS have status: pending/approved/rejected)
if (!character?.status) {
  return null;  // Hide button instead of showing "Character not ready"
}
  
  // Determine current state
  const isPublished = character?.is_market_featured;
  const canToggle = character?.status === 'approved';
  
  // Handle toggle click with tier check
  const handleToggleClick = useCallback(async () => {
    if (!token || !user) {
      setError('Authentication required');
      return;
    }

    // DEFENSIVE: Check tier before attempting
    const isUnlimitedTier = await checkUnlimitedTier();
    
    if (!isUnlimitedTier) {
      setShowUpgradeModal(true);
      return;
    }

    // User has unlimited tier - proceed with toggle
    await toggleCharacterPublish();
  }, [token, user, character]);

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

    try {
      const response = await api.post('/creator-hub/toggle-publish', {
        character_id: character.id
      });

      // DEFENSIVE: Check response structure
      if (!response.data) {
        throw new Error('Invalid server response');
      }

      const data = response.data;

      // Success path
      if (data.status === 'success') {
        // Use backend's confirmed state
        const newPublishState = data.is_published;
        const actionTaken = data.action_taken; // 'published' or 'unpublished'
        
        console.log(`Character ${actionTaken}:`, character.display_name);
        
        // Update parent component with NEW state from backend
        if (onPublishSuccess) {
          onPublishSuccess({
            ...character,
            is_market_featured: newPublishState,
            market_published_at: data.published_at || character.market_published_at
          });
        }
        
        // DEFENSIVE: Clear error on success
        setError(null);
        
      } else {
        // Backend returned success: false
        throw new Error(data.error || data.message || 'Toggle failed');
      }
      
    } catch (err) {
      console.error('Toggle error:', err);
      
      // DEFENSIVE: Extract error message with fallbacks
      let errorMessage = 'Failed to toggle publish state';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Special handling for known errors
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
          className="publish-to-hub-button published"
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
              Published • Click to Unpublish
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