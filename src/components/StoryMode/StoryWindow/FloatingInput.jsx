// src/components/StoryMode/StoryWindow/FloatingInput.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square } from 'lucide-react';
import { getDisplayNameFromKey } from '../../../utils/characterUtils';
import useKeyboardHeight from '../../../hooks/useKeyboardHeight';
import styles from './FloatingInput.module.css';

/**
 * FloatingInput - Floating input area with keyboard detection
 * 
 * Props:
 * - onSendMessage: Callback for sending messages
 * - isSending: Boolean indicating network activity
 * - isStreaming: Boolean indicating streaming state
 * - onCancelStreaming: Callback to cancel streaming
 * - characterKey: Character key for placeholder
 * - infoPanelCollapsed: Boolean indicating if info panel is collapsed
 */
export default function FloatingInput({
  onSendMessage,
  isSending = false,
  isStreaming = false,
  onCancelStreaming,
  characterKey,
  infoPanelCollapsed = false
}) {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef(null);
  const containerRef = useRef(null);
  
  // Keyboard detection hook (existing from your codebase)
  const { keyboardHeight, isKeyboardVisible } = useKeyboardHeight();

  // Derive placeholder
  const effectivePlaceholder = characterKey
    ? `Continue the story with ${getDisplayNameFromKey(characterKey)}...`
    : 'Continue the story...';

  // Auto-resize textarea
  const resize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const max = 120; // px cap
    ta.style.height = Math.min(ta.scrollHeight, max) + 'px';
  }, []);

  useEffect(() => {
    resize();
  }, [inputText, resize]);

  // Apply keyboard offset to container (mobile)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (isKeyboardVisible && keyboardHeight > 0) {
      // Move input above keyboard
      container.style.transform = `translateY(-${keyboardHeight}px)`;
      container.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    } else {
      // Reset position when keyboard hides
      container.style.transform = 'translateY(0)';
    }

    // Cleanup
    return () => {
      if (container) {
        container.style.transform = '';
        container.style.transition = '';
      }
    };
  }, [keyboardHeight, isKeyboardVisible]);

  const resetTextarea = () => {
    const ta = textareaRef.current;
    if (ta) ta.style.height = 'auto';
  };

  const send = () => {
    const text = inputText.trim();
    if (!text || isSending) return;
    onSendMessage?.(text);
    setInputText('');
    resetTextarea();
  };

  // Check if mobile viewport
  const isMobile = typeof window !== 'undefined' &&
                   window.matchMedia &&
                   window.matchMedia('(max-width: 768px)').matches;

  const onKeyDown = (e) => {
    if (e.key !== 'Enter') return;

    // Mobile: Enter = newline only
    if (isMobile) return;

    // Desktop: Enter = send, Shift+Enter = newline
    if (!e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`${styles.floatingInputContainer} ${infoPanelCollapsed ? styles.infoCollapsed : ''}`}
      data-keyboard-visible={isKeyboardVisible}
    >
      <div className={styles.floatingInputWrapper}>
        <div className={styles.floatingInput}>
          <textarea
            ref={textareaRef}
            className={styles.inputTextarea}
            placeholder={effectivePlaceholder}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            disabled={isSending}
            aria-label="Continue the story"
            spellCheck
          />

          {isStreaming ? (
            <button
              className={styles.stopButton}
              onClick={onCancelStreaming}
              aria-label="Stop streaming"
              type="button"
            >
              <Square size={18} />
            </button>
          ) : (
            <button
              className={styles.sendButton}
              onClick={send}
              disabled={isSending || !inputText.trim()}
              aria-label="Send message"
              type="button"
              title={inputText.trim() ? 'Send (Enter)' : 'Type a message'}
            >
              {isSending ? (
                <div className={styles.sendingSpinner} />
              ) : (
                <Send size={18} />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}