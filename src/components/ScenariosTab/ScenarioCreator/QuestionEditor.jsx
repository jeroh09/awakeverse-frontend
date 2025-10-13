// src/components/ScenariosTab/ScenarioCreator/QuestionEditor.jsx
import React, { useState } from 'react';
import './QuestionEditor.css';

export default function QuestionEditor({ questions = [], onChange }) {
  const [newQuestion, setNewQuestion] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState('');

  const MAX_QUESTIONS = 10;
  const MAX_QUESTION_LENGTH = 200;

  // Add new question
  const handleAddQuestion = () => {
    const trimmed = newQuestion.trim();
    
    if (!trimmed) {
      return; // Empty question
    }

    if (questions.length >= MAX_QUESTIONS) {
      alert(`Maximum of ${MAX_QUESTIONS} questions allowed`);
      return;
    }

    // Add question
    onChange([...questions, trimmed]);
    setNewQuestion('');
  };

  // Remove question
  const handleRemoveQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index);
    onChange(updated);
  };

  // Start editing
  const handleStartEdit = (index) => {
    setEditingIndex(index);
    setEditText(questions[index]);
  };

  // Save edit
  const handleSaveEdit = (index) => {
    const trimmed = editText.trim();
    
    if (!trimmed) {
      // If empty, remove the question
      handleRemoveQuestion(index);
    } else {
      // Update question
      const updated = [...questions];
      updated[index] = trimmed;
      onChange(updated);
    }

    setEditingIndex(null);
    setEditText('');
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditText('');
  };

  // Move question up
  const handleMoveUp = (index) => {
    if (index === 0) return;
    
    const updated = [...questions];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
  };

  // Move question down
  const handleMoveDown = (index) => {
    if (index === questions.length - 1) return;
    
    const updated = [...questions];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddQuestion();
    }
  };

  const handleEditKeyDown = (e, index) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit(index);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="question-editor">
      {/* Add New Question */}
      <div className="add-question-section">
        <div className="input-group">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
            onKeyDown={handleKeyDown}
            placeholder="Type a starter question..."
            className="question-input"
            maxLength={MAX_QUESTION_LENGTH}
          />
          <button
            onClick={handleAddQuestion}
            disabled={!newQuestion.trim() || questions.length >= MAX_QUESTIONS}
            className="add-button"
          >
            Add Question
          </button>
        </div>
        <div className="char-counter">
          {newQuestion.length}/{MAX_QUESTION_LENGTH}
        </div>
      </div>

      {/* Questions List */}
      <div className="questions-list">
        {questions.length === 0 ? (
          <div className="empty-questions">
            <p>No starter questions yet</p>
            <p className="hint">Add questions that users can ask to start the debate</p>
          </div>
        ) : (
          questions.map((question, index) => (
            <div key={index} className="question-item">
              {editingIndex === index ? (
                // Edit Mode
                <div className="question-edit-mode">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
                    onKeyDown={(e) => handleEditKeyDown(e, index)}
                    className="question-edit-input"
                    autoFocus
                    maxLength={MAX_QUESTION_LENGTH}
                  />
                  <div className="edit-actions">
                    <button
                      onClick={() => handleSaveEdit(index)}
                      className="save-edit-button"
                      disabled={!editText.trim()}
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="cancel-edit-button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="question-content">
                    <span className="question-number">{index + 1}.</span>
                    <span className="question-text">{question}</span>
                  </div>

                  <div className="question-actions">
                    {/* Move Up */}
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="action-button move"
                      title="Move up"
                    >
                      ↑
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === questions.length - 1}
                      className="action-button move"
                      title="Move down"
                    >
                      ↓
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleStartEdit(index)}
                      className="action-button edit"
                      title="Edit"
                    >
                      ✎
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleRemoveQuestion(index)}
                      className="action-button delete"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Question Count */}
      <div className="questions-footer">
        <span className="question-count">
          {questions.length} question{questions.length !== 1 ? 's' : ''} 
          {questions.length > 0 && ` (max ${MAX_QUESTIONS})`}
        </span>
        
        {questions.length === 0 && (
          <span className="footer-hint">
            💡 Add at least one question to help users start conversations
          </span>
        )}
      </div>
    </div>
  );
}