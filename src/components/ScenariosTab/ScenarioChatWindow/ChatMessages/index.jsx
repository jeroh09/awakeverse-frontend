// src/components/ScenariosTab/ScenarioChatWindow/ChatMessages/index.jsx
// PHASE 6: Updated messages container with design tokens

import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import styles from './ChatMessages.module.css';

/**
 * ChatMessages - Container for all messages with auto-scroll
 * 
 * @param {Array} messages - Array of message objects
 * @param {Array} userCharacters - Array of custom characters
 * @param {boolean} isSending - Whether a message is currently being sent
 * @param {Function} onContinue - Handler for continue button clicks
 * @param {string} theme - Theme (kept for compatibility, not used in new design)
 */
export default function ChatMessages({
  messages = [],
  userCharacters = [],
  isSending = false,
  onContinue,        // ✅ NEW
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
    isSending
  });

  // Track last message from each speaker for continue button
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
          onContinue={onContinue}                    // ✅ NEW
          isSending={isSending}                      // ✅ NEW
          isLastMessage={                            // ✅ NEW
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