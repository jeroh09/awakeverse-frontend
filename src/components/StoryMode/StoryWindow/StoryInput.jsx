// src/components/StoryMode/StoryWindow/StoryInput.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square } from 'lucide-react';
import styles from './StoryWindow.module.css';

/**
 * Props:
 * - onSendMessage(text: string)
 * - isSending: boolean    // network in-flight (create, context, etc.)
 * - isStreaming: boolean  // model is currently streaming a reply
 * - onCancelStreaming(): void
 * - placeholder?: string
 */
export default function StoryInput({
  onSendMessage,
  isSending = false,
  isStreaming = false,
  onCancelStreaming,
  placeholder = 'Continue the story...'
}) {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea (clamped to 6 lines approx)
  const resize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const max = 120; // px cap
    ta.style.height = Math.min(ta.scrollHeight, max) + 'px';
  }, []);

  useEffect(() => { resize(); }, [inputText, resize]);

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

    const isMobile =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(max-width: 768px)').matches;

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return;

    // On mobile: Enter always behaves like Shift+Enter (newline only)
    if (isMobile) {
      // Let the browser insert a newline; don't send
      return;
    }

    // Desktop behavior: Enter = send, Shift+Enter = newline
    if (!e.shiftKey) {
      e.preventDefault();
      onSend();
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
            {isSending ? <div className={styles.sendingSpinner} /> : <Send size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
