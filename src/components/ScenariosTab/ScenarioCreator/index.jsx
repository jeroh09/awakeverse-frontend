// src/components/ScenariosTab/ScenarioCreator/index.jsx
import React, { useState, useEffect } from 'react';
import { createScenario } from '../../../api';
import CharacterSelector from './CharacterSelector';
import QuestionEditor from './QuestionEditor';
import { getDisplayNameFromKey } from '../../../utils/characterUtils';
import './ScenarioCreator.css';

export default function ScenarioCreator({ 
  template, 
  isOpen, 
  onClose, 
  onSuccess,
  currentScenarioCount = 0 
}) {
  const [step, setStep] = useState(1); // 1: Characters, 2: Details, 3: Questions
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Scenario data state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [starterQuestions, setStarterQuestions] = useState([]);
  const [category, setCategory] = useState('');

  // Initialize from template
  useEffect(() => {
    if (template && isOpen) {
      setTitle(template.title || '');
      setDescription(template.description || '');
      setCategory(template.category || 'general');
      
      // Initialize with template's suggested characters (or empty)
      const chars = template.suggested_characters || template.character_keys || [];
      setSelectedCharacters(chars.slice(0, 4)); // Max 4
      
      // Initialize starter questions
      const questions = template.starter_questions || [];
      setStarterQuestions(questions.length > 0 ? [...questions] : [
        'What are your thoughts on this topic?',
        'How would you approach this situation?',
        'What are the key considerations?'
      ]);
    }
  }, [template, isOpen]);

  // Validation
  const canProceedToStep2 = selectedCharacters.length >= 2 && selectedCharacters.length <= 4;
  const canProceedToStep3 = title.trim().length > 0 && description.trim().length > 0;
  const canSave = canProceedToStep2 && canProceedToStep3 && starterQuestions.length > 0;

  // Check 5-scenario limit
  const atScenarioLimit = currentScenarioCount >= 5;

  // Handle character selection
  const handleCharacterToggle = (characterKey) => {
    setSelectedCharacters(prev => {
      if (prev.includes(characterKey)) {
        // Remove character
        return prev.filter(key => key !== characterKey);
      } else {
        // Add character (if under limit)
        if (prev.length < 4) {
          return [...prev, characterKey];
        }
        return prev; // At max capacity
      }
    });
  };

  // Handle save
  const handleSave = async () => {
    if (!canSave) {
      setError('Please complete all required fields');
      return;
    }

    if (atScenarioLimit) {
      setError('You have reached the maximum of 5 scenarios. Delete one to create a new scenario.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const scenarioData = {
        title: title.trim(),
        description: description.trim(),
        category: category || 'general',
        character_keys: selectedCharacters,
        starter_questions: starterQuestions.filter(q => q.trim().length > 0),
        scenario_type: 'debate', // Default type
        max_simultaneous: Math.min(selectedCharacters.length, 4),
        template_id: template?.id || null
      };

      console.log('🎭 Creating scenario:', scenarioData);

      const result = await createScenario(scenarioData);

      if (result.status === 'success') {
        console.log('✅ Scenario created:', result.scenario);
        onSuccess(result.scenario);
        handleClose();
      } else {
        throw new Error(result.error || 'Failed to create scenario');
      }
    } catch (err) {
      console.error('❌ Failed to create scenario:', err);
      setError(err.message || 'Failed to create scenario. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    setStep(1);
    setError(null);
    onClose();
  };

  // Navigation
  const goToStep = (newStep) => {
    setError(null);
    setStep(newStep);
  };

  if (!isOpen) return null;

  return (
    <div className="scenario-creator-overlay" onClick={handleClose}>
      <div className="scenario-creator-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="creator-header">
          <div className="creator-title-section">
            <h2>Create Scenario</h2>
            {template && (
              <span className="template-badge">
                From template: {template.title}
              </span>
            )}
          </div>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>

        {/* Progress Steps */}
        <div className="creator-steps">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Characters ({selectedCharacters.length}/4)</div>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Details</div>
          </div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Questions</div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="creator-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Scenario Limit Warning */}
        {atScenarioLimit && (
          <div className="creator-warning">
            <span className="warning-icon">🚫</span>
            Maximum of 5 scenarios reached. Delete a scenario to create a new one.
          </div>
        )}

        {/* Content Area */}
        <div className="creator-content">
          {/* Step 1: Character Selection */}
          {step === 1 && (
            <div className="creator-step-content">
              <h3>Select Characters (2-4)</h3>
              <p className="step-description">
                Choose between 2 and 4 characters to participate in this debate scenario.
              </p>
              
              <CharacterSelector
                selectedCharacters={selectedCharacters}
                onCharacterToggle={handleCharacterToggle}
                maxCharacters={4}
              />

              <div className="selected-preview">
                <h4>Selected Characters:</h4>
                {selectedCharacters.length === 0 ? (
                  <p className="empty-state">No characters selected yet</p>
                ) : (
                  <div className="selected-list">
                    {selectedCharacters.map(char => (
                      <div key={char} className="selected-character-chip">
                        <span>{getDisplayNameFromKey(char)}</span>
                        <button 
                          onClick={() => handleCharacterToggle(char)}
                          className="remove-chip"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="creator-step-content">
              <h3>Scenario Details</h3>
              <p className="step-description">
                Give your scenario a title and description.
              </p>

              <div className="form-group">
                <label htmlFor="scenario-title">Title *</label>
                <input
                  id="scenario-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., The Future of AI Ethics"
                  maxLength={100}
                  className="form-input"
                />
                <div className="char-count">{title.length}/100</div>
              </div>

              <div className="form-group">
                <label htmlFor="scenario-description">Description *</label>
                <textarea
                  id="scenario-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this scenario is about..."
                  maxLength={500}
                  rows={4}
                  className="form-textarea"
                />
                <div className="char-count">{description.length}/500</div>
              </div>

              <div className="form-group">
                <label htmlFor="scenario-category">Category</label>
                <select
                  id="scenario-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-select"
                >
                  <option value="philosophy">Philosophy</option>
                  <option value="technology">Technology</option>
                  <option value="business">Business</option>
                  <option value="ethics">Ethics</option>
                  <option value="fiction">Fiction</option>
                  <option value="relationships">Relationships</option>
                  <option value="science">Science</option>
                  <option value="warfare">Warfare</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Starter Questions */}
          {step === 3 && (
            <div className="creator-step-content">
              <h3>Starter Questions</h3>
              <p className="step-description">
                Add questions that users can ask to start the debate.
              </p>

              <QuestionEditor
                questions={starterQuestions}
                onChange={setStarterQuestions}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="creator-footer">
          <div className="footer-left">
            {step > 1 && (
              <button
                onClick={() => goToStep(step - 1)}
                className="nav-button secondary"
                disabled={loading}
              >
                ← Back
              </button>
            )}
          </div>

          <div className="footer-right">
            {step < 3 ? (
              <button
                onClick={() => goToStep(step + 1)}
                className="nav-button primary"
                disabled={
                  (step === 1 && !canProceedToStep2) ||
                  (step === 2 && !canProceedToStep3)
                }
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="save-button"
                disabled={!canSave || loading || atScenarioLimit}
              >
                {loading ? 'Creating...' : 'Create Scenario'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}