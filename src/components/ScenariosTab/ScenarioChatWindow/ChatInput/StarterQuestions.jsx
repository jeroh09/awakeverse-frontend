import React from 'react';

/**
 * StarterQuestions - Horizontal scrolling question chips
 * 
 * @param {Array} questions - Array of question strings
 * @param {Function} onQuestionClick - (question: string) => void
 * @param {string} theme - 'light' or 'awakeverse'
 */
export default function StarterQuestions({
  questions = [],
  onQuestionClick,
  theme = 'light'
}) {
  // Defensive: Guard against invalid questions
  if (!Array.isArray(questions) || questions.length === 0) {
    return null;
  }

  // Defensive: Guard against missing onClick
  if (!onQuestionClick || typeof onQuestionClick !== 'function') {
    console.error('❌ StarterQuestions: onQuestionClick prop is required');
    return null;
  }

  // Show max 5 questions to avoid overwhelming UI
  const visibleQuestions = questions.slice(0, 5);

  return (
    <div 
      className="starter-questions-bar"
      role="list"
      aria-label="Starter questions"
    >
      {visibleQuestions.map((question, idx) => (
        <button
          key={idx}
          className="starter-chip"
          onClick={() => onQuestionClick(question)}
          role="listitem"
          aria-label={`Use starter question: ${question}`}
        >
          {question}
        </button>
      ))}
    </div>
  );
}