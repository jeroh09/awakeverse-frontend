// src/components/CreatorHub/PublishToHubButton.jsx
// Defensive tier-gated publishing following your patterns
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
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [error, setError] = useState(null);
  
  // Check if character can be published
  const canPublish = character?.status === 'approved' && !character?.is_market_featured;
  
  // Handle publish click with tier check
  const handlePublishClick = useCallback(async () => {
    if (!token || !user) {
      setError('Authentication required');
      return;
    }

    // DEFENSIVE: Check tier before attempting publish
    const isUnlimitedTier = await checkUnlimitedTier();
    
    if (!isUnlimitedTier) {
      // Show upgrade modal for non-unlimited users
      setShowUpgradeModal(true);
      return;
    }

    // User has unlimited tier - proceed with publish
    await publishCharacterToHub();
  }, [token, user, character]);

  // Check if user has unlimited tier
  const checkUnlimitedTier = async () => {
    try {
      const response = await api.get(`/api/premium/user_subscription/${user.id}`);
      
      if (response.data && response.data.subscription) {
        const tier = response.data.subscription.tier;
        return tier === 'unlimited';
      }
      
      return false;
    } catch (err) {
      console.error('Tier check failed:', err);
      // DEFENSIVE: Fail closed - assume not unlimited on error
      return false;
    }
  };

  // Publish character to Market Hub
  const publishCharacterToHub = async () => {
    setIsPublishing(true);
    setError(null);

    try {
      const response = await api.post('/api/market-hub/publish', {
        character_id: character.id
      });

      if (response.data && response.data.status === 'success') {
        console.log('✅ Character published to Market Hub:', character.display_name);
        
        if (onPublishSuccess) {
          onPublishSuccess(character);
        }
      } else {
        throw new Error(response.data?.error || 'Publish failed');
      }
    } catch (err) {
      console.error('Publish error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to publish character';
      setError(errorMessage);
      
      if (onPublishError) {
        onPublishError(errorMessage);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle upgrade modal close
  const handleUpgradeModalClose = useCallback(() => {
    setShowUpgradeModal(false);
  }, []);

  // Don't show button if character is already published
  if (character?.is_market_featured) {
    return (
      <div className="publish-status published">
        <span className="status-icon">✓</span>
        Published to Market Hub
      </div>
    );
  }

  // Don't show button if character is not approved
  if (!canPublish) {
    return (
      <div className="publish-status disabled">
        <span className="status-icon">⏳</span>
        {character?.status === 'pending' && 'Awaiting approval'}
        {character?.status === 'rejected' && 'Cannot publish rejected character'}
        {!character?.status && 'Character not ready'}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handlePublishClick}
        disabled={isPublishing}
        className="publish-to-hub-button"
        title="Publish to Market Hub (Unlimited tier required)"
      >
        {isPublishing ? (
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

      {/* Upgrade Modal for non-unlimited users */}
      <DualPathUpgradeSystem
        isOpen={showUpgradeModal}
        onClose={handleUpgradeModalClose}
        triggerReason="publish_to_hub"
        currentUsage={null}
      />
    </>
  );
};

export default PublishToHubButton;