// src/components/ScenariosTab/ScenarioChatWindow/FloatingChatInput/index.jsx
// PHASE 5: Floating input area with gradient fade and auto-expanding textarea

import React, { useState, useRef, useEffect } from 'react';
import StarterQuestions from './StarterQuestions';
import { Send } from 'lucide-react';
import styles from './FloatingChatInput.module.css';

/**
 * FloatingChatInput - Floating input area at bottom of chat with gradient fade
 * 
 * @param {Array} starterQuestions - Predefined questions to show as chips
 * @param {Function} onSend - (message: string) => void
 * @param {boolean} isSending - Disable input while sending
 * @param {boolean} showStarters - Whether to show starter questions (default: true on first render)
 */
export default function FloatingChatInput({
  starterQuestions = [],
  onSend,
  isSending = false
}) {
  const [inputText, setInputText] = useState('');
  const [showStarterQuestions, setShowStarterQuestions] = useState(true);
  const textareaRef = useRef(null);

  // Defensive: Guard against missing onSend
  if (!onSend || typeof onSend !== 'function') {
    console.error('❌ FloatingChatInput: onSend prop is required');
    return null;
  }

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
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
    setShowStarterQuestions(false);

    onSend(trimmed);
    setInputText('');
    
    // Reset textarea height after send
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
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
    setShowStarterQuestions(false);
    
    // Focus the textarea when starter question is clicked
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Observable: Log state
  console.log('💬 FloatingChatInput rendering:', {
    starterQuestionsCount: starterQuestions.length,
    showStarterQuestions,
    isSending,
    hasText: inputText.length > 0
  });

  return (
    <div className={styles.floatingInputWrapper}>
      {/* Starter Questions (hide after first message or if no questions) */}
      {showStarterQuestions && starterQuestions.length > 0 && (
        <StarterQuestions
          questions={starterQuestions}
          onQuestionClick={handleStarterClick}
        />
      )}

      {/* Floating Input Container */}
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
        
        <button
          className={styles.sendButton}
          onClick={handleSend}
          disabled={isSending || !inputText.trim()}
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}