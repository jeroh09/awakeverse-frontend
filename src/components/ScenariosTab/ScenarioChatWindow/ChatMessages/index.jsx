// src/components/ScenariosTab/ScenarioChatWindow/ChatMessages/index.jsx
// FIX: Use message.id as React key instead of array index

import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import './ChatMessages.css';

export default function ChatMessages({
  messages = [],
  userCharacters = [],
  isSending = false,
  theme = 'light'
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  if (!Array.isArray(messages)) {
    console.error('ChatMessages: messages must be an array');
    return null;
  }

  return (
    <div 
      className={`chat-messages-container theme-${theme}`}
      role="log"
      aria-live="polite"
      aria-label="Conversation messages"
    >
      {messages.length === 0 ? (
        <div className="empty-chat">
          <span className="empty-icon">💭</span>
          <p>Start the debate by asking a question below</p>
        </div>
      ) : (
        <>
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id || `fallback-${Math.random()}`} 
              /* CRITICAL: Use msg.id as key, NOT array index
                 This ensures each message gets its own bubble
                 even if the same speaker responds multiple times */
              message={msg}
              userCharacters={userCharacters}
              theme={theme}
            />
          ))}
          
          {isSending && (
            <div className="typing-indicator" role="status" aria-label="AI is responding">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          )}
        </>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}