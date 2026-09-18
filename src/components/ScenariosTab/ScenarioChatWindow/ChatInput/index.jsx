// src/components/ScenariosTab/ScenarioChatWindow/ChatInput/index.jsx
// Updated with mobile keyboard handling

import React, { useState, useRef, useEffect } from 'react';
import StarterQuestions from './StarterQuestions';
import { Send } from 'lucide-react';
import useKeyboardHeight from '../../../../hooks/useKeyboardHeight'; // ✅ NEW IMPORT
import './ChatInput.css';

/**
 * ChatInput - Input container with starter questions
 * NOW WITH KEYBOARD HANDLING
 * 
 * @param {Array} starterQuestions - Predefined questions to show as chips
 * @param {Function} onSend - (message: string) => void
 * @param {boolean} isSending - Disable input while sending
 * @param {string} theme - 'light' or 'awakeverse'
 */
export default function ChatInput({
  starterQuestions = [],
  onSend,
  isSending = false,
  theme = 'light'
}) {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef(null);
  const containerRef = useRef(null); // ✅ NEW: Container ref
  
  // ✅ NEW: Keyboard detection hook
  const { keyboardHeight, isKeyboardVisible } = useKeyboardHeight();

  // Defensive: Guard against missing onSend
  if (!onSend || typeof onSend !== 'function') {
    console.error('❌ ChatInput: onSend prop is required');
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
      
      // Cap at max-height (120px from CSS)
      if (textarea.scrollHeight > 120) {
        textarea.style.height = '120px';
      }
    }
  }, [inputText]);

  // ✅ NEW: Apply keyboard offset to container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (isKeyboardVisible && keyboardHeight > 0) {
      // Move input above keyboard
      container.style.transform = `translateY(-${keyboardHeight}px)`;
      container.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      
      console.log('⌨️ Keyboard visible, moving input up by', keyboardHeight);
    } else {
      // Reset position when keyboard hides
      container.style.transform = 'translateY(0)';
      
      console.log('⌨️ Keyboard hidden, resetting input position');
    }

    // Cleanup
    return () => {
      if (container) {
        container.style.transform = '';
        container.style.transition = '';
      }
    };
  }, [keyboardHeight, isKeyboardVisible]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

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
    // Focus the textarea when starter question is clicked
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Observable: Log state
  console.log('💬 ChatInput rendering:', {
    starterQuestionsCount: starterQuestions.length,
    isSending,
    hasText: inputText.length > 0,
    keyboardHeight, // ✅ NEW
    isKeyboardVisible // ✅ NEW
  });

  return (
    <div 
      ref={containerRef} // ✅ NEW: Attach container ref
      className={`chat-input-container theme-${theme}`}
      // ✅ NEW: Add data attribute for debugging
      data-keyboard-visible={isKeyboardVisible}
    >
      {/* Starter Questions Bar */}
      {starterQuestions.length > 0 && (
        <StarterQuestions
          questions={starterQuestions}
          onQuestionClick={handleStarterClick}
          theme={theme}
        />
      )}

      {/* Input Area */}
      <div className="input-area">
        <textarea
          ref={textareaRef}
          className="text-input"
          placeholder="Ask your next question..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={1}
          disabled={isSending}
          aria-label="Message input"
          style={{
            minHeight: '42px',
            maxHeight: '120px',
            overflowY: 'auto'
          }}
        />
        
        <button
          className="send-button"
          onClick={handleSend}
          disabled={isSending || !inputText.trim()}
          aria-label="Send message"
        >
          <Send size={18} />
          <span className="send-text">Send</span>
        </button>
      </div>
    </div>
  );
}