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
 * @param {React.Ref} containerRef - Optional external ref for the scroll container (for scroll-to-bottom button)
 * @param {Function} onScroll - Optional scroll handler (for scroll-to-bottom button visibility)
 */
export default function ChatMessages({
  messages = [],
  userCharacters = [],
  isSending = false,
  onContinue,
  onNextSpeaker,
  onOpenCreate,             // was onGenerateVideo
  isCreating = false,       // was isGeneratingVideo
  canCreateContent = false, // was canGenerateVideo
  theme = 'light',
  containerRef: externalRef,
  onScroll,
}) {
  const internalRef = useRef(null);
  // Use external ref if provided (for scroll button), otherwise use internal ref
  const containerRef = externalRef || internalRef;

  const messagesEndRef = useRef(null);

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
    hasOpenCreate: !!onOpenCreate,
    isCreating,
    canCreateContent
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
      <div className={styles.messagesContainer} ref={containerRef} onScroll={onScroll}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎭</div>
          <p className={styles.emptyText}>Start the conversation</p>
          <p className={styles.emptySubtext}>Ask a question or choose a starter below</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.messagesContainer}
      ref={containerRef}
      onScroll={onScroll}  // ✅ NEW: Propagate scroll events to parent
    >
      {/* Render all messages */}
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id || index}
          message={message}
          userCharacters={userCharacters}
          onContinue={onContinue}
          onNextSpeaker={onNextSpeaker}
          onOpenCreate={onOpenCreate}
          isCreating={isCreating}
          canCreateContent={canCreateContent}
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