// src/components/ScenariosTab/PublishScenarioModal.jsx
import React from 'react';
import './PublishScenarioModal.css';

export default function PublishScenarioModal({
  isOpen,
  onClose,
  onConfirm,
  scenario,
  isLoading = false,
  error = null,
  isUnpublishing = false
}) {
  if (!isOpen || !scenario) return null;

  const characterCount = scenario.character_keys?.length || 0;
  const isPublished = scenario.is_public === true;

  const handleConfirm = () => {
    onConfirm(scenario);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <div className="publish-modal-backdrop" onClick={handleBackdropClick}>
      <div className="publish-modal">
        <div className="modal-header">
          <h3>
            {isUnpublishing ? 'Unpublish from Market Hub?' : 'Publish to Market Hub?'}
          </h3>
          <button 
            className="close-button" 
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Scenario Preview */}
          <div className="scenario-preview">
            <div className="preview-header">
              <h4>{scenario.title}</h4>
              {isPublished && (
                <span className="status-badge published">Published</span>
              )}
            </div>
            
            <p className="preview-description">{scenario.description}</p>
            
            <div className="preview-stats">
              <div className="stat-item">
                <span className="stat-icon">👥</span>
                <span className="stat-text">{characterCount} character{characterCount !== 1 ? 's' : ''}</span>
              </div>
              {scenario.category && (
                <div className="stat-item">
                  <span className="stat-icon">📂</span>
                  <span className="stat-text">{scenario.category}</span>
                </div>
              )}
            </div>
          </div>

          {/* Warning/Info Text */}
          <div className={`info-box ${isUnpublishing ? 'warning' : 'info'}`}>
            <span className="info-icon">
              {isUnpublishing ? '⚠️' : 'ℹ️'}
            </span>
            <div className="info-text">
              {isUnpublishing ? (
                <>
                  <strong>Unpublishing this scenario:</strong>
                  <ul>
                    <li>Removes it from Market Hub browse</li>
                    <li>Existing debates will continue normally</li>
                    <li>You can republish it anytime</li>
                  </ul>
                </>
              ) : (
                <>
                  <strong>Publishing this Dialogue will:</strong>
                  <ul>
                    <li>Make it visible to all users in Market Hub</li>
                    <li>Allow others to start debates with your Dialogue</li>
                    <li>Track engagement and credit you as creator</li>
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-box">
              <span className="error-icon">❌</span>
              <span className="error-text">{error}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="button button-secondary" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className={`button button-primary ${isUnpublishing ? 'unpublish' : ''}`}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner">⏳</span>
                {isUnpublishing ? 'Unpublishing...' : 'Publishing...'}
              </>
            ) : (
              <>
                {isUnpublishing ? 'Unpublish Dialogue' : 'Publish to Market Hub'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}