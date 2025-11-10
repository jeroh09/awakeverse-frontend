// src/components/StoryMode/StoryWindow/StoryInput.jsx - UPDATED
import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';
import styles from './StoryWindow.module.css';

export default function StoryInput({ onSendMessage, isSending, isStreaming, onCancelStreaming, placeholder = "Continue the story..." }) {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
      
      if (textarea.scrollHeight > 120) {
        textarea.style.height = '120px';
      }
    }
  }, [inputText]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    onSendMessage(trimmed);
    setInputText('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleCancel = () => {
    if (onCancelStreaming) {
      onCancelStreaming();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.storyInputContainer}>
      <div className={styles.inputArea}>
        <textarea
          ref={textareaRef}
          className={styles.textInput}
          placeholder={placeholder}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={1}
          disabled={isSending}
          aria-label="Continue the story"
        />
        
        {isStreaming ? (
          <button
            className={styles.stopButton}
            onClick={handleCancel}
            aria-label="Stop streaming"
          >
            <Square size={18} />
          </button>
        ) : (
          <button
            className={styles.sendButton}
            onClick={handleSend}
            disabled={isSending || !inputText.trim()}
            aria-label="Send message"
          >
            {isSending ? (
              <div className={styles.sendingSpinner}></div>
            ) : (
              <Send size={18} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}