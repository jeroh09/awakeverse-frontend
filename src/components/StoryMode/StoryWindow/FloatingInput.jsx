// src/components/StoryMode/StoryWindow/FloatingInput.jsx
// REFACTORED: Modern floating input matching ScenarioChatWindow design

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight, Square } from 'lucide-react';
import { getDisplayNameFromKey } from '../../../utils/characterUtils';
import useKeyboardHeight from '../../../hooks/useKeyboardHeight';
import styles from './FloatingInput.module.css';

/**
 * FloatingInput - Modern floating input with gradient fade
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
  
  // Keyboard detection hook
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

  const handleStop = () => {
    onCancelStreaming?.();
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

  // Apply keyboard offset via inline style (ONLY moves wrapper, not entire container)
  const wrapperStyle = keyboardHeight > 0 
    ? { transform: `translateY(-${keyboardHeight}px)` }
    : {};

  return (
    <div 
      className={`${styles.floatingInputContainer} ${infoPanelCollapsed ? styles.infoCollapsed : ''}`}
    >
      <div 
        className={styles.floatingInputWrapper}
        style={wrapperStyle}
      >
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

          {/* Send/Stop Button - Icon swap based on streaming */}
          <button
            className={`${styles.sendButton} ${isStreaming ? styles.stopButton : ''}`}
            onClick={isStreaming ? handleStop : send}
            disabled={!isStreaming && (isSending || !inputText.trim())}
            aria-label={isStreaming ? 'Stop streaming' : 'Send message'}
            type="button"
            title={isStreaming ? 'Stop streaming' : (inputText.trim() ? 'Send (Enter)' : 'Type a message')}
          >
            {isStreaming ? (
              <Square size={18} />
            ) : isSending ? (
              <div className={styles.sendingSpinner} />
            ) : (
              <ArrowRight size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}