// src/components/ScenariosTab/TemplatesGallery/TemplateDetailModal.jsx - REDESIGNED
import React, { useState } from 'react';
import { characterCategories } from '../../../data/characterCategories';
import ScenarioCreator from '../ScenarioCreator';
import './TemplateDetailModal.css';

export default function TemplateDetailModal({ 
  template, 
  isUnlimited, 
  onClose, 
  onUpgradeRequired,
  currentScenarioCount = 0,
  onScenarioCreated = () => {}
}) {
  const [showCreator, setShowCreator] = useState(false);

  if (!template) {
    return null;
  }

  // Helper function to get character info from characterCategories
  const getCharacterInfo = (charKey) => {
    for (const category of characterCategories) {
      if (category.characters && Array.isArray(category.characters)) {
        const found = category.characters.find(c => c.key === charKey);
        if (found) {
          return {
            name: found.name,
            thumbnailUrl: found.thumbnailUrl
          };
        }
      }
    }
    
    return {
      name: charKey.charAt(0).toUpperCase() + charKey.slice(1),
      thumbnailUrl: null
    };
  };

  const handleUseTemplate = () => {
    if (!isUnlimited) {
      onUpgradeRequired('template_access');
      return;
    }
    
    setShowCreator(true);
  };

  const handleCreatorClose = () => {
    setShowCreator(false);
  };

  const handleCreatorSuccess = (newScenario) => {
    setShowCreator(false);
    onScenarioCreated(newScenario);
    onClose();
  };

  // Safely access template properties with fallbacks
  const templateTitle = template.title || 'Untitled Scenario';
  const templateDescription = template.description || 'No description available';
  const templateCategory = template.category || 'general';
  const maxCharacters = template.max_characters || 4;
  const suggestedCharacters = template.suggested_characters || ['socrates', 'aristotle', 'kant', 'confucius'];
  const starterQuestions = template.starter_questions || [
    'Is it moral to sacrifice one person to save five?',
    'How do intent and consequences factor into morality?',
    'Are there universal moral principles?'
  ];

  return (
    <>
      {/* Template Detail Modal */}
      <div className="modal-overlay" onClick={onClose}>
        <div className="template-detail-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{templateTitle}</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          
          <div className="modal-content">
            <div className="template-specs">
              {/* Meta Info Row */}
              <div className="spec-meta">
                <div className="meta-item">
                  <span className="icon">📁</span>
                  <span>{templateCategory.charAt(0).toUpperCase() + templateCategory.slice(1)}</span>
                </div>
                <div className="meta-item">
                  <span className="icon">👥</span>
                  <span>Up to {maxCharacters} characters</span>
                </div>
                <div className="meta-item">
                  <span className="icon">💬</span>
                  <span>{starterQuestions.length} questions</span>
                </div>
              </div>

              {/* Description */}
              <div className="spec-description">
                {templateDescription}
              </div>

              {/* Characters */}
              <div className="spec-characters">
                <h3>Featured Characters</h3>
                <div className="characters-grid-compact">
                  {suggestedCharacters.map((charKey, index) => {
                    const charInfo = getCharacterInfo(charKey);
                    const initial = charInfo.name.charAt(0).toUpperCase();
                    
                    return (
                      <div key={index} className="character-card-compact">
                        <div 
                          className="character-avatar-compact"
                          title={charInfo.name}
                          style={charInfo.thumbnailUrl ? {
                            backgroundImage: `url(${charInfo.thumbnailUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          } : {}}
                        >
                          {!charInfo.thumbnailUrl && initial}
                        </div>
                        <span className="character-name-compact">
                          {charInfo.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Questions Summary */}
              <div className="spec-questions">
                <h3>Starter Questions</h3>
                <div className="questions-summary">
                  <div className="questions-count">
                    <span className="icon"></span>
                    <span>{starterQuestions.length} questions included</span>
                  </div>
                  <div className="questions-hint">
                    Customize in the next step
                  </div>
                </div>
              </div>
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
              {isUnlimited ? 'Create Dialogue' : 'Upgrade to Create'}
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Creator Modal */}
      {showCreator && (
        <ScenarioCreator
          template={template}
          isOpen={showCreator}
          onClose={handleCreatorClose}
          onSuccess={handleCreatorSuccess}
          currentScenarioCount={currentScenarioCount}
        />
      )}
    </>
  );
}