// Fixed src/components/InputArea.js - Adding focus props WITHOUT removing existing code
import React, { useEffect, useRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Send, StopCircle } from 'lucide-react';
//import { useBreathingContext } from './BreathingInterface/BreathingInterface';
import styles from './InputArea.module.css';

export default function InputArea({
  value,
  onChange,
  onSend,
  onStop,
  isSending,
  onFocus,    // ← NEW: Add this prop
  onBlur      // ← NEW: Add this prop
}) {
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Get breathing context if available
  let breathing;
  try {
    breathing = useBreathingContext();
  } catch {
    // Not within BreathingInterface - use fallback
    breathing = null;
  }

  // Handle typing detection
  useEffect(() => {
    if (!breathing) return;

    const handleInput = () => {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // User started typing
      breathing.handlers.onTypingStart();

      // Set timeout for typing end
      typingTimeoutRef.current = setTimeout(() => {
        breathing.handlers.onTypingEnd();
      }, 1000); // 1 second after last keystroke
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('input', handleInput);
    }

    return () => {
      if (textarea) {
        textarea.removeEventListener('input', handleInput);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [breathing]);

  // Handle focus/blur - keep existing breathing context logic
  const handleFocus = () => {
    breathing?.handlers.onInputFocus();
  };

  const handleBlur = () => {
    breathing?.handlers.onInputBlur();
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      isSending ? onStop() : onSend();
      
      // End typing when message is sent
      if (breathing && !isSending) {
        breathing.handlers.onTypingEnd();
      }
    }
  };

  return (
    <div className={styles.wrapper}>
      <TextareaAutosize
        ref={textareaRef}
        minRows={1}
        maxRows={5}
        className={styles.textarea}
        placeholder="Type your message…"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}       // ← Direct pass-through as instructed
        onBlur={onBlur}         // ← Direct pass-through as instructed
      />
      <button
        className={styles.sendButton}
        onClick={isSending ? onStop : onSend}
        aria-label={isSending ? 'Stop generating' : 'Send message'}
      >
        {isSending ? <StopCircle size={20} /> : <Send size={20} />}
      </button>
    </div>
  );
}