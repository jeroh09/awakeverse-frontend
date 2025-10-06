// src/components/ScenariosTab/TemplatesGallery/TemplateDetailModal.jsx
import React from 'react';
import './TemplateDetailModal.css';

export default function TemplateDetailModal({ template, isUnlimited, onClose, onUpgradeRequired }) {
  const handleUseTemplate = () => {
    if (!isUnlimited) {
      onUpgradeRequired('template_access');
      return;
    }
    // TODO: Navigate to scenario creator
    console.log('Using template:', template.id);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="template-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{template.title}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="template-meta">
            <span className="category-badge">
              {template.category?.charAt(0).toUpperCase() + template.category?.slice(1)}
            </span>
            <span className="character-count">
              {template.max_characters || 4} characters max
            </span>
          </div>
          
          <p className="template-full-description">{template.description}</p>
          
          <div className="characters-section">
            <h4>Suggested Characters</h4>
            <div className="character-list">
              {(template.suggested_characters || ['Socrates', 'Aristotle', 'Kant', 'Confucius']).map((char, index) => (
                <div key={index} className="character-item">
                  <div className="character-avatar-small">
                    {typeof char === 'string' ? char.charAt(0).toUpperCase() : char.charAt(0).toUpperCase()}
                  </div>
                  <span className="character-name">
                    {typeof char === 'string' ? char : char}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="questions-section">
            <h4>Starter Questions</h4>
            <div className="questions-list">
              {(template.starter_questions || [
                'Is it moral to sacrifice one person to save five?',
                'How do intent and consequences factor into morality?',
                'Are there universal moral principles?'
              ]).slice(0, 5).map((question, index) => (
                <div key={index} className="question-item">
                  {question}
                </div>
              ))}
            </div>
            {template.starter_questions?.length > 5 && (
              <p className="more-questions">
                +{template.starter_questions.length - 5} more questions
              </p>
            )}
          </div>
        </div>
        
        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button 
            className={`use-template-button ${!isUnlimited ? 'upgrade' : ''}`}
            onClick={handleUseTemplate}
          >
            {isUnlimited ? 'Create Scenario' : 'Upgrade to Create'}
          </button>
        </div>
      </div>
    </div>
  );
}