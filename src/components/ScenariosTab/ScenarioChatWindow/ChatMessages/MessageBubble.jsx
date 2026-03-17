// src/components/ScenariosTab/ScenarioChatWindow/ChatMessages/MessageBubble.jsx
// MessageBubble - Complete with Continue (››), Next Speaker (+), and Video Generation (🎬) buttons
// Works with existing backend format and includes markdown support

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { getDisplayNameFromKey, isCustomCharacterKey } from '../../../../utils/characterUtils';
import { characterCategories } from '../../../../data/characterCategories';
import styles from './MessageBubble.module.css';

export default function MessageBubble({ 
  message, 
  userCharacters = [],
  onContinue,
  onNextSpeaker,
  onGenerateVideo,
  isGeneratingVideo = false,
  canGenerateVideo = false,
  isSending,
  isLastMessage
}) {
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

  // ===== BUTTON VISIBILITY LOGIC =====
  // Show buttons only on AI messages that are the last from their speaker
  const showButtons = 
    !isUser &&             // Only on AI messages
    !message.error &&      // Not on error messages
    isLastMessage &&       // Only on the last message from this character
    !isSending;            // Hide during streaming

  const showContinueButton = showButtons && onContinue;
  const showNextSpeakerButton = showButtons && onNextSpeaker;
  const showVideoButton = showButtons && canGenerateVideo && onGenerateVideo;

  const handleContinue = () => {
    if (onContinue && speaker) {
      console.log('🔄 Continue clicked:', speaker);
      onContinue(speaker);
    }
  };

  const handleNextSpeaker = () => {
    if (onNextSpeaker && speaker) {
      console.log('➕ Next Speaker clicked:', speaker);
      onNextSpeaker(speaker);
    }
  };

  const handleGenerateVideo = () => {
    if (onGenerateVideo) {
      console.log('🎬 Generate Video clicked');
      onGenerateVideo();
    }
  };

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
              // ── Block elements ──────────────────────────────────────────
              p: ({ children }) => <p className={styles.paragraph}>{children}</p>,
              // Headings — capped sizes so they stay proportional inside a bubble
              h1: ({ children }) => <h1 className={styles.heading1}>{children}</h1>,
              h2: ({ children }) => <h2 className={styles.heading2}>{children}</h2>,
              h3: ({ children }) => <h3 className={styles.heading3}>{children}</h3>,
              // Horizontal rule — thin divider with breathing room
              hr: () => <hr className={styles.divider} />,
              // Lists — nested lists inherit padding from CSS
              ul: ({ children }) => <ul className={styles.list}>{children}</ul>,
              ol: ({ children }) => <ol className={styles.orderedList}>{children}</ol>,
              li: ({ children }) => <li className={styles.listItem}>{children}</li>,
              blockquote: ({ children }) => <blockquote className={styles.blockquote}>{children}</blockquote>,
              // ── Table elements ─────────────────────────────────────────
              // Wrapped in a div so wide tables scroll rather than overflow the bubble
              table: ({ children }) => (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>{children}</table>
                </div>
              ),
              thead: ({ children }) => <thead className={styles.tableHead}>{children}</thead>,
              tbody: ({ children }) => <tbody>{children}</tbody>,
              tr: ({ children }) => <tr className={styles.tableRow}>{children}</tr>,
              th: ({ children }) => <th className={styles.tableHeader}>{children}</th>,
              td: ({ children }) => <td className={styles.tableCell}>{children}</td>,
              // ── Inline elements ─────────────────────────────────────────
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

        {/* Action Buttons - Continue, Next Speaker, and Generate Video */}
        {(showContinueButton || showNextSpeakerButton || showVideoButton) && (
          <div className={styles.actionButtonsContainer}>
            {/* Continue Button (››) - Smart continuation */}
            {showContinueButton && (
              <button
                className={styles.continueButton}
                onClick={handleContinue}
                disabled={isSending}
                aria-label="Continue conversation"
                title="Smart continuation"
              >
                <span className={styles.continueIcon}>››</span>
                <span className={styles.continueTooltip}>Continue</span>
              </button>
            )}

            {/* Next Speaker Button (+) - Force rotation */}
            {showNextSpeakerButton && (
              <button
                className={styles.nextSpeakerButton}
                onClick={handleNextSpeaker}
                disabled={isSending}
                aria-label="Next speaker"
                title="Next character speaks"
              >
                <span className={styles.nextSpeakerIcon}>+</span>
                <span className={styles.nextSpeakerTooltip}>Next</span>
              </button>
            )}

            {/* Video Generation Button (🎬) - Create video */}
            {showVideoButton && (
              <button
                className={styles.videoButton}
                onClick={handleGenerateVideo}
                disabled={isGeneratingVideo || isSending}
                aria-label="Generate video from conversation"
                title={isGeneratingVideo ? 'Generating video...' : 'Create video from this conversation'}
              >
                <span className={styles.videoIcon}>🎬</span>
                <span className={styles.videoTooltip}>
                  {isGeneratingVideo ? 'Generating...' : 'Create Video'}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}