import React, { useState, useRef, useEffect } from 'react';
import StarterQuestions from './StarterQuestions';
import { Send } from 'lucide-react';
import './ChatInput.css';

/**
 * ChatInput - Input container with starter questions
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
    hasText: inputText.length > 0
  });

  return (
    <div className={`chat-input-container theme-${theme}`}>
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