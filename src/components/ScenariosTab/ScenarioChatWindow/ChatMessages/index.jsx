// src/components/ScenariosTab/ScenarioChatWindow/ChatMessages/index.jsx
// COMPLETE - Updated to pass Continue, Next Speaker, and Video Generation handlers

import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import styles from './ChatMessages.module.css';

/**
 * ChatMessages - Container for all messages with auto-scroll
 * 
 * @param {Array} messages - Array of message objects
 * @param {Array} userCharacters - Array of custom characters
 * @param {boolean} isSending - Whether a message is currently being sent
 * @param {Function} onContinue - Handler for continue button clicks (smart decision)
 * @param {Function} onNextSpeaker - Handler for next speaker button clicks (force rotation)
 * @param {Function} onGenerateVideo - Handler for video generation button clicks
 * @param {boolean} isGeneratingVideo - Whether video is currently being generated
 * @param {boolean} canGenerateVideo - Whether user can generate video (5+ messages + access)
 * @param {string} theme - Theme (kept for compatibility, not used in new design)
 */
export default function ChatMessages({
  messages = [],
  userCharacters = [],
  isSending = false,
  onContinue,
  onNextSpeaker,
  onGenerateVideo,
  isGeneratingVideo = false,
  canGenerateVideo = false,
  theme = 'light'
}) {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isSending]);

  // Observable logging
  console.log('💬 ChatMessages rendering:', {
    messageCount: messages.length,
    isSending,
    hasContinue: !!onContinue,
    hasNextSpeaker: !!onNextSpeaker,
    hasGenerateVideo: !!onGenerateVideo,
    isGeneratingVideo,
    canGenerateVideo
  });

  // Track last message from each speaker for button visibility
  const lastMessageBySpeaker = {};
  messages.forEach((msg, index) => {
    if (!msg.user && msg.speaker) {
      lastMessageBySpeaker[msg.speaker] = index;
    }
  });

  // Empty state
  if (messages.length === 0 && !isSending) {
    return (
      <div className={styles.messagesContainer} ref={containerRef}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎭</div>
          <p className={styles.emptyText}>Start the conversation</p>
          <p className={styles.emptySubtext}>Ask a question or choose a starter below</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.messagesContainer} ref={containerRef}>
      {/* Render all messages */}
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id || index}
          message={message}
          userCharacters={userCharacters}
          onContinue={onContinue}
          onNextSpeaker={onNextSpeaker}
          onGenerateVideo={onGenerateVideo}
          isGeneratingVideo={isGeneratingVideo}
          canGenerateVideo={canGenerateVideo}
          isSending={isSending}
          isLastMessage={
            !message.user && 
            lastMessageBySpeaker[message.speaker] === index
          }
        />
      ))}

      {/* Typing indicator while sending */}
      {isSending && (
        <div className={styles.typingIndicator}>
          <div className={styles.typingAvatar} />
          <div className={styles.typingBubble}>
            <div className={styles.typingDot} />
            <div className={styles.typingDot} />
            <div className={styles.typingDot} />
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}