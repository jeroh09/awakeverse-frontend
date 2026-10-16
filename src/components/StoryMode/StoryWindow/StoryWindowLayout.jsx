// src/components/StoryMode/StoryWindow/StoryWindowLayout.jsx
import React, { useState, useCallback, useEffect } from 'react';
import ChatPanel from './ChatPanel';
import InfoPanel from './InfoPanel';
import FloatingInput from './FloatingInput';
import styles from './StoryWindow.module.css';

/**
 * StoryWindowLayout - Two-panel layout with chat and info panels
 * 
 * Props:
 * - story: Story object with metadata, messages, acts, milestones
 * - onClose: Callback to return to story list
 * - onSendMessage: Callback for sending messages
 * - isSending: Boolean indicating network activity
 * - isStreaming: Boolean indicating streaming state
 * - onCancelStreaming: Callback to cancel streaming
 */
export default function StoryWindowLayout({
  story,
  onClose,
  onSendMessage,
  isSending = false,
  isStreaming = false,
  onCancelStreaming
}) {
  // Info panel toggle state (persisted to localStorage)
  const [infoPanelCollapsed, setInfoPanelCollapsed] = useState(() => {
    const saved = localStorage.getItem('storymode_infopanel_collapsed');
    return saved === 'true';
  });

  // Persist toggle state
  useEffect(() => {
    localStorage.setItem('storymode_infopanel_collapsed', infoPanelCollapsed);
  }, [infoPanelCollapsed]);

  // Toggle handler
  const handleToggleInfoPanel = useCallback(() => {
    setInfoPanelCollapsed(prev => !prev);
  }, []);

  // Defensive check
  if (!story) {
    return (
      <div className={styles.storyWindowPage}>
        <div className={styles.errorState}>
          <p>Story not found</p>
          <button onClick={onClose} className={styles.retryButton}>
            Return to Stories
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.storyWindowPage}>
      {/* Two-Panel Content Area */}
      <div className={styles.storyContent}>
        
        {/* LEFT PANEL: Chat Window */}
        <ChatPanel
          story={story}
          onClose={onClose}
        />
        
        {/* RIGHT PANEL: Information Panel (Retractable) */}
        <InfoPanel
          story={story}
          collapsed={infoPanelCollapsed}
          onToggle={handleToggleInfoPanel}
          onClose={onClose}
        />
        
      </div>
      
      {/* Floating Input Area */}
      <FloatingInput
        onSendMessage={onSendMessage}
        isSending={isSending}
        isStreaming={isStreaming}
        onCancelStreaming={onCancelStreaming}
        characterKey={story.main_character_key}
        infoPanelCollapsed={infoPanelCollapsed}
      />
    </div>
  );
}