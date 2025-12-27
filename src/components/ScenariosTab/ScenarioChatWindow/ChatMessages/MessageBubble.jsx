// src/components/ScenariosTab/ScenarioChatWindow/ChatMessages/MessageBubble.jsx
// MessageBubble - Works with existing backend format
// Handles both: { user: true, text: '...' } and { speaker: 'user', text: '...', display_name: '...' }

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { getDisplayNameFromKey, isCustomCharacterKey } from '../../../../utils/characterUtils';
import { characterCategories } from '../../../../data/characterCategories';
import styles from './MessageBubble.module.css';

export default function MessageBubble({ message, userCharacters = [] }) {
  // Defensive: Validate message object
  if (!message || !message.text) {
    console.error('❌ MessageBubble: Invalid message object', message);
    return null;
  }

  // Destructure - handles both message formats
  const { user, text, speaker, display_name } = message;
  
  // Check if user message - handles both formats:
  // Format 1: { user: true, text: '...' }
  // Format 2: { speaker: 'user', text: '...' }
  const isUser = user === true || speaker === 'user';

  // Get character info for non-user messages
  const getCharacterInfo = () => {
    if (isUser) return null;

    // Use speaker as character key
    const characterKey = speaker;
    
    // Check if custom character
    const isCustom = isCustomCharacterKey(characterKey);

    if (isCustom) {
      const customChar = userCharacters.find(c => c.character_key === characterKey);
      if (customChar) {
        return {
          name: customChar.display_name || display_name,
          avatarUrl: customChar.avatar_url
        };
      }
    }

    // Static character lookup
    for (const category of characterCategories) {
      if (category.characters) {
        const found = category.characters.find(c => c.key === characterKey);
        if (found) {
          return {
            name: found.name,
            avatarUrl: found.thumbnailUrl
          };
        }
      }
    }

    // Fallback: parse from speaker key or use display_name
    return {
      name: display_name || getDisplayNameFromKey(characterKey),
      avatarUrl: `/images/${characterKey}.jpg`
    };
  };

  const characterInfo = getCharacterInfo();

  // Build className based on user/character
  const bubbleClassName = [
    styles.messageBubble,
    isUser ? styles.userMessage : styles.characterMessage
  ].filter(Boolean).join(' ');

  return (
    <div className={bubbleClassName}>
      {/* Avatar - only for character messages */}
      {!isUser && characterInfo && (
        <div className={styles.avatar}>
          {characterInfo.avatarUrl ? (
            <img
              src={characterInfo.avatarUrl}
              alt={characterInfo.name}
              className={styles.avatarImage}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={styles.avatarFallback}
            style={{ display: characterInfo.avatarUrl ? 'none' : 'flex' }}
          >
            {characterInfo.name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={styles.messageContent}>
        {/* Author Name - only for character messages */}
        {!isUser && characterInfo && (
          <div className={styles.authorName}>{characterInfo.name}</div>
        )}

        {/* Message Text with Markdown */}
        <div className={styles.messageText}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className={styles.paragraph}>{children}</p>,
              strong: ({ children }) => <strong className={styles.bold}>{children}</strong>,
              em: ({ children }) => <em className={styles.italic}>{children}</em>,
              code: ({ inline, children }) => 
                inline ? (
                  <code className={styles.inlineCode}>{children}</code>
                ) : (
                  <pre className={styles.codeBlock}>
                    <code>{children}</code>
                  </pre>
                ),
              ul: ({ children }) => <ul className={styles.list}>{children}</ul>,
              ol: ({ children }) => <ol className={styles.orderedList}>{children}</ol>,
              li: ({ children }) => <li className={styles.listItem}>{children}</li>,
              blockquote: ({ children }) => <blockquote className={styles.blockquote}>{children}</blockquote>,
              a: ({ href, children }) => (
                <a href={href} className={styles.link} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              )
            }}
          >
            {text}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}