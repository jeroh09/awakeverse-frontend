// src/components/ScenariosTab/ScenarioChatWindow/FloatingChatInput/index.jsx
// REFACTORED: Modern floating input with Stop button and keyboard handling
// USES: Existing useKeyboardHeight hook from src/hooks/useKeyboardHeight.js

import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, X, Square } from 'lucide-react';
import useKeyboardHeight from '../../../hooks/useKeyboardHeight'; // ✅ Use existing hook
import styles from './FloatingChatInput.module.css';

/**
 * FloatingChatInput - Modern floating input area with gradient fade
 * 
 * @param {Array} starterQuestions - Predefined questions to show as chips
 * @param {Function} onSend - (message: string) => void
 * @param {Function} onStop - () => void - Called when stop button clicked
 * @param {boolean} isSending - Show stop button and disable input while sending
 */
export default function FloatingChatInput({
  starterQuestions = [],
  onSend,
  onStop,
  isSending = false
}) {
  const [inputText, setInputText] = useState('');
  const [showStarters, setShowStarters] = useState(true);
  const textareaRef = useRef(null);
  
  // ✅ Get keyboard height using EXISTING hook (returns object with keyboardHeight + isKeyboardVisible)
  const { keyboardHeight, isKeyboardVisible } = useKeyboardHeight();

  // Defensive: Guard against missing onSend
  if (!onSend || typeof onSend !== 'function') {
    console.error('❌ FloatingChatInput: onSend prop is required');
    return null;
  }

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get correct scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight (content height)
      textarea.style.height = `${textarea.scrollHeight}px`;
      
      // Cap at max-height (120px)
      if (textarea.scrollHeight > 120) {
        textarea.style.height = '120px';
      }
    }
  }, [inputText]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    // Hide starter questions after first message
    setShowStarters(false);

    onSend(trimmed);
    setInputText('');
    
    // Reset textarea height after send
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleStop = () => {
    if (onStop && typeof onStop === 'function') {
      onStop();
    } else {
      console.warn('⚠️ FloatingChatInput: onStop callback not provided');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStarterClick = (question) => {
    setInputText(question);
    setShowStarters(false);
    
    // Focus textarea after clicking starter
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleCloseStarters = () => {
    setShowStarters(false);
  };

  // Observable: Log state
  console.log('💬 FloatingChatInput rendering:', {
    starterQuestionsCount: starterQuestions.length,
    showStarters,
    isSending,
    hasText: inputText.length > 0,
    keyboardHeight,
    isKeyboardVisible
  });

  // Limit starter questions to first 3 for cleaner UI
  const displayStarters = starterQuestions.slice(0, 3);

  // ✅ Apply keyboard offset via inline style (only moves input, not entire page)
  const wrapperStyle = keyboardHeight > 0 
    ? { transform: `translateY(-${keyboardHeight}px)` }
    : {};

  return (
    <div 
      className={styles.floatingInputWrapper}
      style={wrapperStyle}
    >
      {/* Starter Questions Section (with X button) */}
      {showStarters && displayStarters.length > 0 && (
        <div className={styles.starterSection}>
          <div className={styles.starterHeader}>
            <div className={styles.starterLabel}>Suggested questions:</div>
            <button
              className={styles.closeStartersBtn}
              onClick={handleCloseStarters}
              aria-label="Close starter questions"
              type="button"
            >
              <X size={14} />
            </button>
          </div>
          <div className={styles.starterChips}>
            {displayStarters.map((question, index) => (
              <button
                key={index}
                className={styles.starterChip}
                onClick={() => handleStarterClick(question)}
                type="button"
                aria-label={`Use starter question: ${question}`}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Container */}
      <div className={styles.inputContainer}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder="Ask your next question..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={1}
          disabled={isSending}
          aria-label="Message input"
        />
        
        {/* Send/Stop Button - Icon and color swap based on isSending */}
        <button
          className={`${styles.sendButton} ${isSending ? styles.stopButton : ''}`}
          onClick={isSending ? handleStop : handleSend}
          disabled={!isSending && !inputText.trim()}
          aria-label={isSending ? 'Stop generating' : 'Send message'}
        >
          {isSending ? (
            <Square size={18} />
          ) : (
            <ArrowRight size={18} />
          )}
        </button>
      </div>
    </div>
  );
}