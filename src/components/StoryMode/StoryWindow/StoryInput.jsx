// src/components/StoryMode/StoryWindow/StoryInput.jsx
// Updated with mobile keyboard handling

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square } from 'lucide-react';
import { getDisplayNameFromKey } from '../../../utils/characterUtils';
import useKeyboardHeight from '../../../hooks/useKeyboardHeight'; // ✅ NEW IMPORT
import styles from './StoryWindow.module.css';

/**
 * Props:
 * - onSendMessage(text: string)
 * - isSending: boolean    // network in-flight (create, context, etc.)
 * - isStreaming: boolean  // model is currently streaming a reply
 * - onCancelStreaming(): void
 * - placeholder?: string
 * - characterKey?: string // used to build a smart default placeholder
 */
export default function StoryInput({
  onSendMessage,
  isSending = false,
  isStreaming = false,
  onCancelStreaming,
  placeholder,
  characterKey
}) {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef(null);
  const containerRef = useRef(null); // ✅ NEW: Container ref for keyboard handling
  
  // ✅ NEW: Keyboard detection hook
  const { keyboardHeight, isKeyboardVisible } = useKeyboardHeight();

  // Derive a friendly placeholder
  const effectivePlaceholder =
    placeholder ||
    (characterKey
      ? `Continue the story with ${getDisplayNameFromKey(
          characterKey
        )}...`
      : 'Continue the story...');

  // Auto-resize textarea (clamped to 6 lines approx)
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

  // ✅ NEW: Apply keyboard offset to container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (isKeyboardVisible && keyboardHeight > 0) {
      // Move input above keyboard
      container.style.transform = `translateY(-${keyboardHeight}px)`;
      container.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      
      console.log('⌨️ StoryInput: Keyboard visible, moving up by', keyboardHeight);
    } else {
      // Reset position when keyboard hides
      container.style.transform = 'translateY(0)';
      
      console.log('⌨️ StoryInput: Keyboard hidden, resetting position');
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

  // Small helper: check if we're on a narrow/mobile viewport
  const isMobile =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(max-width: 768px)').matches;

  const onKeyDown = (e) => {
    // We only care about Enter
    if (e.key !== 'Enter') return;

    // 📱 MOBILE: Enter should behave like Shift+Enter (newline only)
    if (isMobile) {
      // Do not preventDefault; let the browser insert a newline.
      return;
    }

    // 🖥 DESKTOP: Enter = send, Shift+Enter = newline
    if (!e.shiftKey) {
      e.preventDefault();
      send();
    }
    // If Shift+Enter, default behavior inserts newline
  };

  return (
    <div 
      ref={containerRef} // ✅ NEW: Attach container ref
      className={styles.storyInputContainer}
      // ✅ NEW: Add data attribute for debugging
      data-keyboard-visible={isKeyboardVisible}
    >
      <div className={styles.inputArea}>
        <textarea
          ref={textareaRef}
          className={styles.textInput}
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
  );
}