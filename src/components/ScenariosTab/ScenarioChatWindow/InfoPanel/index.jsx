// src/components/ScenariosTab/ScenarioChatWindow/InfoPanel/index.jsx
// PHASE 4: Info Panel - Right side panel with scenarios list, home button, and video generation UI

import React from 'react';
import ScenarioListItem from './ScenarioListItem';
import { Home, Download, Play, Loader } from 'lucide-react';
import styles from './InfoPanel.module.css';

/**
 * InfoPanel - Right side panel showing scenarios list, home button, and video generation UI
 * 
 * @param {Array} scenarios - Array of user's scenarios from MyScenariosPanel
 * @param {string} currentScenarioId - ID of currently active scenario
 * @param {Function} onScenarioSelect - (scenarioId) => void - Switch to different scenario
 * @param {Function} onHomeClick - Navigate back to ChatLauncher
 * @param {Object} videoState - Video generation state from useVideoGeneration hook
 * @param {Function} onDownloadVideo - Handler to download completed video
 */
export default function InfoPanel({
  scenarios = [],
  currentScenarioId = null,
  onScenarioSelect = () => {},
  onHomeClick = () => {},
  videoState = null,
  onDownloadVideo = null
}) {
  // Defensive: Validate props
  if (typeof onHomeClick !== 'function') {
    console.error('❌ InfoPanel: onHomeClick must be a function');
    return null;
  }

  if (typeof onScenarioSelect !== 'function') {
    console.error('❌ InfoPanel: onScenarioSelect must be a function');
  }

  // Defensive: Ensure scenarios is array
  const validScenarios = Array.isArray(scenarios) ? scenarios : [];

  // Observable logging
  console.log('📋 InfoPanel rendering:', {
    scenariosCount: validScenarios.length,
    currentScenarioId,
    videoStatus: videoState?.status,
    videoProgress: videoState?.progress
  });

  // ===== VIDEO GENERATION IN PROGRESS =====
  if (videoState?.status === 'generating') {
    return (
      <div className={styles.infoPanel}>
        {/* Header with Home Button */}
        <div className={styles.header}>
          <button
            className={styles.homeButton}
            onClick={onHomeClick}
            title="Return to Chat Launcher"
            aria-label="Return to Chat Launcher"
          >
            <Home size={22} />
          </button>
        </div>

        {/* VIDEO PROGRESS SECTION */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Video Generation</h3>
          
          <div className={styles.progressContainer}>
            {/* Stage indicator */}
            <div className={styles.stageIndicator}>
              {videoState.stage === 'pending' && '⏳ Preparing...'}
              {videoState.stage === 'storyboard' && '🎨 Creating storyboard...'}
              {videoState.stage === 'voice' && '🎤 Generating voices...'}
              {videoState.stage === 'video' && '🎬 Composing video...'}
              {!videoState.stage && '⏳ Starting...'}
            </div>

            {/* Progress bar */}
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${videoState.progress * 100}%` }}
              />
            </div>

            {/* Percentage */}
            <div className={styles.progressText}>
              {Math.round(videoState.progress * 100)}%
            </div>

            {/* Time estimate */}
            <div className={styles.timeEstimate}>
              <Loader size={14} className={styles.spinningIcon} />
              Estimated time: 2-5 minutes
            </div>

            {/* Info text */}
            <div className={styles.infoText}>
              Your video is being created. You can continue chatting while this completes.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== VIDEO GENERATION COMPLETE =====
  if (videoState?.status === 'complete') {
    return (
      <div className={styles.infoPanel}>
        {/* Header with Home Button */}
        <div className={styles.header}>
          <button
            className={styles.homeButton}
            onClick={onHomeClick}
            title="Return to Chat Launcher"
            aria-label="Return to Chat Launcher"
          >
            <Home size={22} />
          </button>
        </div>

        {/* DOWNLOAD SECTION */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Video Ready!</h3>
          
          <div className={styles.downloadContainer}>
            <div className={styles.successIcon}>✅</div>
            <p className={styles.successText}>Your video is ready to download</p>
            
            {/* Download Video Button */}
            <button
              className={styles.downloadButton}
              onClick={onDownloadVideo}
              title="Download video file"
            >
              <Download size={18} />
              Download Video
            </button>

            {/* Preview Button */}
            {videoState.videoUrl && (
              <button
                className={styles.secondaryButton}
                onClick={() => window.open(videoState.videoUrl, '_blank')}
                title="Preview video in new tab"
              >
                <Play size={18} />
                Preview Video
              </button>
            )}
          </div>
        </div>

        {/* Show scenarios list below download section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>My Scenarios</h3>
          
          {validScenarios.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🎭</span>
              <p className={styles.emptyText}>No scenarios yet</p>
            </div>
          ) : (
            <div className={styles.scenariosList}>
              {validScenarios.map(scenario => (
                <ScenarioListItem
                  key={scenario.id}
                  scenario={scenario}
                  isActive={scenario.id === currentScenarioId}
                  onClick={() => onScenarioSelect(scenario.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== VIDEO GENERATION FAILED =====
  if (videoState?.status === 'failed') {
    return (
      <div className={styles.infoPanel}>
        {/* Header with Home Button */}
        <div className={styles.header}>
          <button
            className={styles.homeButton}
            onClick={onHomeClick}
            title="Return to Chat Launcher"
            aria-label="Return to Chat Launcher"
          >
            <Home size={22} />
          </button>
        </div>

        {/* ERROR SECTION */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Video Generation Failed</h3>
          
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>❌</div>
            <p className={styles.errorText}>
              {videoState.error || 'Something went wrong during video generation'}
            </p>
            
            <button
              className={styles.secondaryButton}
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>

        {/* Show scenarios list below error section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>My Scenarios</h3>
          
          {validScenarios.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🎭</span>
              <p className={styles.emptyText}>No scenarios yet</p>
            </div>
          ) : (
            <div className={styles.scenariosList}>
              {validScenarios.map(scenario => (
                <ScenarioListItem
                  key={scenario.id}
                  scenario={scenario}
                  isActive={scenario.id === currentScenarioId}
                  onClick={() => onScenarioSelect(scenario.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== DEFAULT: SCENARIOS LIST (IDLE STATE) =====
  return (
    <div className={styles.infoPanel}>
      {/* Header with Home Button */}
      <div className={styles.header}>
        <button
          className={styles.homeButton}
          onClick={onHomeClick}
          title="Return to Chat Launcher"
          aria-label="Return to Chat Launcher"
        >
          <Home size={22} />
        </button>
      </div>

      {/* Scenarios List Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>My Scenarios</h3>
        
        {validScenarios.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🎭</span>
            <p className={styles.emptyText}>No scenarios yet</p>
          </div>
        ) : (
          <div className={styles.scenariosList}>
            {validScenarios.map(scenario => (
              <ScenarioListItem
                key={scenario.id}
                scenario={scenario}
                isActive={scenario.id === currentScenarioId}
                onClick={() => onScenarioSelect(scenario.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}