// src/components/StoryMode/StoryWindow/StoryMessages.jsx
import React, { useRef, useEffect, useCallback } from 'react';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { characterCategories } from '../../../data/characterCategories';
import {
  getDisplayNameFromKey,
  getCharacterThumbnailUrl,
  isCustomCharacterKey
} from '../../../utils/characterUtils';
import usePremiumCharacters from '../../../hooks/usePremiumCharacters'; // ADDED
import styles from './StoryWindow.module.css';

// Character lookup with graceful fallback to shared utils - UPDATED
const getCharacterInfo = (charKey, userCharacters = []) => {
  if (!charKey) {
    return {
      name: 'Assistant',
      thumbnailUrl: null
    };
  }

  // 1) Check for custom characters first - NEW LOGIC
  const isCustom = isCustomCharacterKey(charKey);
  if (isCustom) {
    const customChar = userCharacters.find(c => c.character_key === charKey);
    if (customChar) {
      return {
        name: customChar.display_name,
        thumbnailUrl: customChar.avatar_url, // Use custom avatar URL
        isCustom: true
      };
    }
  }

  // 2) Try static character metadata first
  for (const category of characterCategories) {
    const found = category.characters?.find((c) => c.key === charKey);
    if (found) {
      return {
        name: found.name,
        thumbnailUrl: found.thumbnailUrl || getCharacterThumbnailUrl(charKey, false),
        isCustom: false
      };
    }
  }

  // 3) Fallback: use shared helpers (handles custom `user_45_imhotep` keys)
  const name = getDisplayNameFromKey(charKey);
  const thumbnailUrl = getCharacterThumbnailUrl(
    charKey,
    isCustomCharacterKey(charKey)
  );

  return { name, thumbnailUrl, isCustom: isCustomCharacterKey(charKey) };
};

/**
 * Message shape expected:
 * { id?: string, role: 'user'|'assistant'|'system', content: string,
 *   character_key?: string, speaker?: string, isLive?: boolean }
 *
 * Props:
 * - messages: Message[]
 * - characterKey: string (fallback for assistant avatar/name)
 * - openingBanner?: string  // optional: shown when messages.length === 0
 */
function MessageItem({ message, characterKey, userCharacters, style, onSizeChange }) {
  const containerRef = useRef(null);

  // Observe height and report to virtual list
  useEffect(() => {
    if (!containerRef.current || !onSizeChange) return;
    const el = containerRef.current;

    // Initial measure
    onSizeChange(el.getBoundingClientRect().height || 120);

    // Resize observer for dynamic growth (e.g., streaming)
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onSizeChange(entry.contentRect.height || 120);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [onSizeChange]);

  if (message.role === 'user') {
    return (
      <div style={style}>
        <div ref={containerRef} className={styles.messageWrapper}>
          <div className={styles.userMessage}>
            <div className={styles.messageContent}>{message.content}</div>
          </div>
        </div>
      </div>
    );
  }

  if (message.role === 'system') {
    return (
      <div style={style}>
        <div ref={containerRef} className={styles.messageWrapper}>
          <div className={styles.systemMessage}>{message.content}</div>
        </div>
      </div>
    );
  }

  // assistant / character
  const speakerKey =
    message.character_key || message.speaker || characterKey || 'assistant';
  const { name: speakerName, thumbnailUrl } = getCharacterInfo(speakerKey, userCharacters);

  return (
    <div style={style}>
      <div ref={containerRef} className={styles.messageWrapper}>
        <div className={styles.characterMessage}>
          <div
            className={styles.characterAvatar}
            style={
              thumbnailUrl
                ? {
                    backgroundImage: `url(${thumbnailUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }
                : {}
            }
          >
            {!thumbnailUrl && (
              <span className={styles.avatarFallback}>
                {speakerName.charAt(0)}
              </span>
            )}
          </div>

          <div className={styles.messageContent}>
            <div className={styles.speakerName}>{speakerName}</div>
            <div className={styles.messageText}>
              {message.content}
              {message.isLive && <span className={styles.caretBlink}>▍</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StoryMessages({
  messages,
  characterKey,
  openingBanner
}) {
  const { userCharacters = [] } = usePremiumCharacters(); // ADDED HOOK
  const listRef = useRef(null);
  const sizeMapRef = useRef({});

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length]);

  // Virtual list size plumbing
  const getItemSize = useCallback(
    (index) => sizeMapRef.current[index] || 120,
    []
  );

  const setItemSize = useCallback((index, size) => {
    sizeMapRef.current[index] = Math.max(60, size); // minimum height
    if (listRef.current) {
      // resetAfterIndex ensures react-window recalculates subsequent items
      listRef.current.resetAfterIndex(index, false);
    }
  }, []);

  // Empty state with optional opening banner
  if (messages.length === 0) {
    return (
      <div className={styles.messagesContainer}>
        {openingBanner ? (
          <div className={styles.openingBanner}>
            <div className={styles.bannerContent}>
              <div className={styles.bannerIcon}>🎭</div>
              <div className={styles.bannerText}>{openingBanner}</div>
              <div className={styles.bannerHint}>
                Send a message to begin your adventure…
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.emptyMessages}>
            <div className={styles.emptyIcon}>📖</div>
            <h3>Begin Your Story</h3>
            <p>
              Your adventure awaits. Send your first message to start the
              journey.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.messagesContainer}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={listRef}
            height={height}
            width={width}
            itemCount={messages.length}
            itemSize={getItemSize}
            estimatedItemSize={120}
            overscanCount={5}
          >
            {({ index, style }) => {
              const message = messages[index];
              return (
                <MessageItem
                  message={message}
                  characterKey={characterKey}
                  userCharacters={userCharacters} // PASS USER CHARACTERS
                  style={style}
                  onSizeChange={(h) => setItemSize(index, h)}
                />
              );
            }}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}