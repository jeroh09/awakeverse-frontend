// src/components/ScenariosTab/ScenarioChatWindow/ChatMessages/MessageBubble.jsx
// PHASE 6: Modern chat bubbles with design tokens
// User messages: Indigo gradient, right-aligned
// Character messages: Dark surface, left-aligned

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { getDisplayNameFromKey, isCustomCharacterKey } from '../../../../utils/characterUtils';
import { characterCategories } from '../../../../data/characterCategories';
import styles from './MessageBubble.module.css';

/**
 * MessageBubble - Individual message with author info and markdown content
 * 
 * @param {Object} message - Message object { role, content, metadata }
 * @param {Array} userCharacters - Array of custom characters
 */
export default function MessageBubble({ message, userCharacters = [] }) {
  // Defensive: Validate message object
  if (!message || !message.role || !message.content) {
    console.error('❌ MessageBubble: Invalid message object', message);
    return null;
  }

  const { role, content, metadata = {} } = message;
  const isUser = role === 'user';

  // Get character info for assistant messages
  const getCharacterInfo = () => {
    if (isUser) return null;

    const characterKey = metadata.character_key;
    if (!characterKey) return { name: 'Assistant', avatarUrl: null };

    const isCustom = isCustomCharacterKey(characterKey);

    if (isCustom) {
      const customChar = userCharacters.find(c => c.character_key === characterKey);
      if (customChar) {
        return {
          name: customChar.display_name,
          avatarUrl: customChar.avatar_url
        };
      }
      return {
        name: getDisplayNameFromKey(characterKey),
        avatarUrl: `/images/${characterKey}.jpg`
      };
    } else {
      // Static character
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
      return {
        name: characterKey,
        avatarUrl: `/images/${characterKey}.jpg`
      };
    }
  };

  const characterInfo = getCharacterInfo();

  // Build className based on role
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
              // Style markdown elements
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
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}