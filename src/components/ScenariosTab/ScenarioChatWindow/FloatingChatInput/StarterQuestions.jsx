// src/components/ScenariosTab/ScenarioChatWindow/FloatingChatInput/StarterQuestions.jsx
// Starter questions shown as chips before first message

import React from 'react';
import styles from './FloatingChatInput.module.css';

/**
 * StarterQuestions - Display predefined questions as clickable chips
 * 
 * @param {Array} questions - Array of starter question strings
 * @param {Function} onQuestionClick - (question: string) => void
 */
export default function StarterQuestions({
  questions = [],
  onQuestionClick = () => {}
}) {
  // Defensive: Validate props
  if (!Array.isArray(questions) || questions.length === 0) {
    return null;
  }

  if (typeof onQuestionClick !== 'function') {
    console.error('❌ StarterQuestions: onQuestionClick must be a function');
    return null;
  }

  // Limit to first 3 questions for cleaner UI
  const displayQuestions = questions.slice(0, 3);

  return (
    <div className={styles.starterQuestions}>
      <div className={styles.starterLabel}>Suggested questions:</div>
      <div className={styles.starterChips}>
        {displayQuestions.map((question, index) => (
          <button
            key={index}
            className={styles.starterChip}
            onClick={() => onQuestionClick(question)}
            type="button"
            aria-label={`Use starter question: ${question}`}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}