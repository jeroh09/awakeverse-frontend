// src/components/StoryMode/StoryWindow/StoryMessages.jsx - Message History
import React, { useRef, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import styles from './StoryWindow.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

// Message Item Component
function MessageItem({ message, characterKey }) {
  if (message.user || message.role === 'user') {
    // User message (right-aligned)
    return (
      <div className={styles.messageWrapper}>
        <div className={styles.userMessage}>
          <div className={styles.messageContent}>
            {message.content || message.text}
          </div>
        </div>
      </div>
    );
  } else if (message.speaker === 'system' || message.role === 'system') {
    // System message (centered)
    return (
      <div className={styles.messageWrapper}>
        <div className={styles.systemMessage}>
          {message.content || message.text}
        </div>
      </div>
    );
  } else {
    // Character message (left-aligned with avatar)
    const speaker = message.speaker || message.character_key || characterKey;
    const speakerName = speaker.charAt(0).toUpperCase() + speaker.slice(1);
    
    return (
      <div className={styles.messageWrapper}>
        <div className={styles.characterMessage}>
          <img
            src={`${API_BASE}/character_images/${speaker}.jpg`}
            alt={speakerName}
            className={styles.characterAvatar}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div 
            className={styles.characterAvatarFallback}
            style={{ display: 'none' }}
          >
            {speakerName.charAt(0)}
          </div>
          
          <div className={styles.messageContent}>
            <div className={styles.speakerName}>{speakerName}</div>
            <div className={styles.messageText}>
              {message.content || message.text}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Main Messages Component
export default function StoryMessages({ messages, characterKey }) {
  const listRef = useRef(null);
  const sizeMapRef = useRef({});

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length]);

  // Calculate item size
  const getItemSize = (index) => {
    return sizeMapRef.current[index] || 120;
  };

  const setItemSize = (index, size) => {
    sizeMapRef.current[index] = size;
    if (listRef.current) {
      listRef.current.resetAfterIndex(index);
    }
  };

  // Empty state
  if (messages.length === 0) {
    return (
      <div className={styles.messagesContainer}>
        <div className={styles.emptyMessages}>
          <div className={styles.emptyIcon}>📖</div>
          <h3>Begin Your Story</h3>
          <p>Your adventure awaits. Send your first message to start the journey.</p>
        </div>
      </div>
    );
  }

  // Messages list
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
                <div style={style}>
                  <div
                    ref={(el) => {
                      if (el) {
                        const height = el.getBoundingClientRect().height;
                        if (height !== sizeMapRef.current[index]) {
                          setItemSize(index, height);
                        }
                      }
                    }}
                  >
                    <MessageItem
                      message={message}
                      characterKey={characterKey}
                    />
                  </div>
                </div>
              );
            }}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}