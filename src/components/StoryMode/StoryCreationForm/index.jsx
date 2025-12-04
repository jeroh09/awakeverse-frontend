// src/components/StoryMode/StoryCreationForm/index.jsx
// Complete Creation Form with Scene Style AND Milestone support
import React, { useState, useEffect } from 'react';
import useStoryApi from '../../../hooks/useStoryApi';
import CharacterSelector from './CharacterSelector';
import MilestoneInput from '../StoryCreation/MilestoneInput'; // NEW IMPORT
import { getDisplayNameFromKey } from '../../../utils/characterUtils';
import styles from './StoryCreationForm.module.css';

export default function StoryCreationForm({
  template,
  isOpen,
  onClose = () => {},
  onSuccess = () => {},
}) {
  const [step, setStep] = useState(1); // 1: Character, 2: Details, 3: Milestones
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [title, setTitle] = useState('');
  const [startingSituation, setStartingSituation] = useState('');
  const [primaryObjective, setPrimaryObjective] = useState(''); // NEW: For milestones
  const [customEra, setCustomEra] = useState('');
  const [sceneStyle, setSceneStyle] = useState('');
  const [milestones, setMilestones] = useState([]); // NEW: Milestone state
  const [milestoneValidation, setMilestoneValidation] = useState({ valid: false, message: '' });

  const { createStory } = useStoryApi();

  // Initialize from template when opened
  useEffect(() => {
    if (template && isOpen) {
      setTitle(template.title || '');
      setStartingSituation(template.preset_situation || '');
      setPrimaryObjective(template.preset_objective || ''); // NEW
      setCustomEra(template.preset_era || '');
      setSelectedCharacter(template.preset_character_key || null);
      setSceneStyle(template.scene_prompt || '');
      setMilestones(template.preset_milestones || []); // NEW
    }

    if (!template && isOpen) {
      // Blank create: clear fields
      setTitle('');
      setStartingSituation('');
      setPrimaryObjective(''); // NEW
      setCustomEra('');
      setSelectedCharacter(null);
      setSceneStyle('');
      setMilestones([]); // NEW
    }
  }, [template, isOpen]);

  // Validate milestones for step 3
  useEffect(() => {
    if (step === 3) {
      const validateMilestones = () => {
        if (milestones.length < 2) {
          return { valid: false, message: 'Minimum 2 milestones required' };
        }
        if (milestones.length > 5) {
          return { valid: false, message: 'Maximum 5 milestones allowed' };
        }
        
        // Check each milestone has content
        const emptyMilestones = milestones.filter(m => !m.trim());
        if (emptyMilestones.length > 0) {
          return { valid: false, message: 'All milestones must have content' };
        }
        
        // Check word count
        const invalidWordCount = milestones.filter(m => {
          const wordCount = m.trim().split(/\s+/).length;
          return wordCount < 5 || wordCount > 20;
        });
        
        if (invalidWordCount.length > 0) {
          return { valid: false, message: 'Milestones must be 5-20 words' };
        }
        
        return { valid: true, message: `${milestones.length} milestones ready` };
      };
      
      setMilestoneValidation(validateMilestones());
    }
  }, [milestones, step]);

  // Validation
  const canProceedToStep2 = selectedCharacter !== null;
  const canProceedToStep3 = 
    canProceedToStep2 &&
    title.trim().length > 0 &&
    startingSituation.trim().length > 0 &&
    primaryObjective.trim().length > 10; // NEW: Require objective for milestones

  // Updated save validation to include milestones
  const canSave =
    canProceedToStep3 &&
    milestoneValidation.valid;

  // Character selection
  const handleCharacterSelect = (characterKey) => {
    setSelectedCharacter(characterKey);
  };

  // Close & reset
  const handleClose = () => {
    setStep(1);
    setError(null);
    setSelectedCharacter(null);
    setTitle('');
    setStartingSituation('');
    setPrimaryObjective(''); // NEW
    setCustomEra('');
    setSceneStyle('');
    setMilestones([]); // NEW
    setMilestoneValidation({ valid: false, message: '' });
    onClose();
  };

  // Save / create story
  const handleSave = async () => {
    if (!canSave) {
      setError('Please complete all required fields and ensure milestones are valid');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const storyData = {
        title: title.trim(),
        character_key: selectedCharacter,
        starting_situation: startingSituation.trim(),
        primary_objective: primaryObjective.trim(), // NEW
        template_id: template?.id || null,
        custom_era: customEra || null,
        scene_prompt: sceneStyle.trim() || null,
        custom_milestones: milestones // NEW: Include milestones
      };

      console.log('📖 Creating story with milestones:', storyData);

      const result = await createStory(storyData);

      if (result.success) {
        console.log('✅ Story created with milestones:', result.story);
        onSuccess(result.story);
        handleClose();
      } else {
        throw new Error(result.error || 'Failed to create story');
      }
    } catch (err) {
      console.error('❌ Failed to create story:', err);
      setError(err.message || 'Failed to create story. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Navigation
  const goToStep = (newStep) => {
    setError(null);
    setStep(newStep);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div
        className={styles.creationModal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.titleSection}>
            <h2>Create Story</h2>
            {template && (
              <span className={styles.templateBadge}>
                From template: {template.title}
              </span>
            )}
          </div>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        {/* Progress steps */}
        <div className={styles.progressSteps}>
          <div
            className={`${styles.step} ${
              step >= 1 ? styles.active : ''
            } ${step > 1 ? styles.completed : ''}`}
          >
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepLabel}>Character</div>
          </div>
          <div
            className={`${styles.step} ${
              step >= 2 ? styles.active : ''
            } ${step > 2 ? styles.completed : ''}`}
          >
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepLabel}>Story Details</div>
          </div>
          <div
            className={`${styles.step} ${
              step >= 3 ? styles.active : ''
            }`}
          >
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepLabel}>Milestones</div>
          </div>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          {/* Step 1: Character */}
          {step === 1 && (
            <div className={styles.stepContent}>
              <h3>Select Your Character</h3>
              <p className={styles.stepDescription}>
                Choose the character who will be the protagonist of your story.
              </p>

              <CharacterSelector
                selectedCharacter={selectedCharacter}
                onCharacterSelect={handleCharacterSelect}
              />

              {selectedCharacter && (
                <div className={styles.selectedPreview}>
                  <h4>Selected Character:</h4>
                  <div className={styles.selectedCharacterChip}>
                    <span>{getDisplayNameFromKey(selectedCharacter)}</span>
                    <button
                      onClick={() => setSelectedCharacter(null)}
                      className={styles.removeChip}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <h3>Story Details</h3>
              <p className={styles.stepDescription}>
                Customize your story title, opening scene, and objective.
              </p>

              {/* Title */}
              <div className={styles.formGroup}>
                <label htmlFor="story-title">Title *</label>
                <input
                  id="story-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., The Mystery at Baker Street"
                  maxLength={100}
                  className={styles.formInput}
                />
                <div className={styles.charCount}>{title.length}/100</div>
              </div>

              {/* Starting situation */}
              <div className={styles.formGroup}>
                <label htmlFor="starting-situation">Starting Situation *</label>
                <textarea
                  id="starting-situation"
                  value={startingSituation}
                  onChange={(e) => setStartingSituation(e.target.value)}
                  placeholder="Describe how the story begins..."
                  maxLength={500}
                  rows={6}
                  className={styles.formTextarea}
                />
                <div className={styles.charCount}>
                  {startingSituation.length}/500
                </div>
              </div>

              {/* NEW: Primary Objective */}
              <div className={styles.formGroup}>
                <label htmlFor="primary-objective">Primary Objective *</label>
                <textarea
                  id="primary-objective"
                  value={primaryObjective}
                  onChange={(e) => setPrimaryObjective(e.target.value)}
                  placeholder="What is the main goal of this story? (required for milestone generation)"
                  maxLength={300}
                  rows={3}
                  className={styles.formTextarea}
                />
                <div className={styles.charCount}>
                  {primaryObjective.length}/300
                  <span className={styles.hintText}>
                    {primaryObjective.trim().length < 10 ? ' (10+ characters to generate milestones)' : ''}
                  </span>
                </div>
              </div>

              {/* Era */}
              <div className={styles.formGroup}>
                <label htmlFor="custom-era">Era (Optional)</label>
                <select
                  id="custom-era"
                  value={customEra}
                  onChange={(e) => setCustomEra(e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="">Auto-detect from character</option>
                  <option value="ancient">Ancient Times</option>
                  <option value="medieval">Medieval Era</option>
                  <option value="renaissance">Renaissance</option>
                  <option value="1800s">1800s</option>
                  <option value="1890s">Victorian Era (1890s)</option>
                  <option value="1900s">Early 1900s</option>
                  <option value="1950s">1950s</option>
                  <option value="modern">Modern Day</option>
                  <option value="2050s">Near Future (2050s)</option>
                  <option value="far_future">Far Future</option>
                </select>
              </div>

              {/* Scene Style */}
              <div className={styles.formGroup}>
                <label htmlFor="scene-style">
                  Scene Style (optional){' '}
                  <span style={{ fontWeight: 400, color: '#6b7280' }}>
                    – helps generate your scenic image
                  </span>
                </label>
                <textarea
                  id="scene-style"
                  value={sceneStyle}
                  onChange={(e) => setSceneStyle(e.target.value)}
                  placeholder="e.g., A fog-drenched Victorian alley lit by a single gas lamp."
                  maxLength={220}
                  rows={3}
                  className={styles.formTextarea}
                />
                <div className={styles.charCount}>
                  {sceneStyle.length}/220
                </div>
              </div>

              {/* Selected Character Reminder */}
              {selectedCharacter && (
                <div className={styles.characterReminder}>
                  <span className={styles.reminderLabel}>
                    Selected Character:
                  </span>
                  <span className={styles.reminderValue}>
                    {getDisplayNameFromKey(selectedCharacter)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Milestones */}
          {step === 3 && (
            <div className={styles.stepContent}>
              <h3>Story Milestones</h3>
              <p className={styles.stepDescription}>
                Milestones guide your story's progression. They auto-generate from your objective but can be edited.
              </p>

              {/* Objective Summary */}
              <div className={styles.objectiveSummary}>
                <div className={styles.summaryLabel}>Based on your objective:</div>
                <div className={styles.summaryText}>
                  "{primaryObjective.length > 80 ? primaryObjective.substring(0, 80) + '...' : primaryObjective}"
                </div>
              </div>

              {/* Milestone Input Component */}
              <MilestoneInput
                objective={primaryObjective}
                startingSituation={startingSituation}
                era={customEra || 'modern'}
                characterKey={selectedCharacter}
                onMilestonesChange={setMilestones}
                initialMilestones={milestones}
              />

              {/* Milestone Validation Status */}
              {milestones.length > 0 && (
                <div className={`${styles.validationStatus} ${milestoneValidation.valid ? styles.valid : styles.invalid}`}>
                  <span className={styles.statusIcon}>
                    {milestoneValidation.valid ? '✓' : '⚠️'}
                  </span>
                  <span className={styles.statusText}>
                    {milestoneValidation.message}
                  </span>
                </div>
              )}

              {/* Help Text */}
              <div className={styles.milestoneHelp}>
                <div className={styles.helpItem}>
                  <span className={styles.helpIcon}>💡</span>
                  <span>Milestones adapt as your story progresses</span>
                </div>
                <div className={styles.helpItem}>
                  <span className={styles.helpIcon}>⚡</span>
                  <span>Edit any milestone to match your vision</span>
                </div>
                <div className={styles.helpItem}>
                  <span className={styles.helpIcon}>🔧</span>
                  <span>2-5 milestones recommended for best pacing</span>
                </div>
              </div>

              {/* Selected Character Reminder */}
              {selectedCharacter && (
                <div className={styles.characterReminder}>
                  <span className={styles.reminderLabel}>
                    Story Details:
                  </span>
                  <span className={styles.reminderValue}>
                    {getDisplayNameFromKey(selectedCharacter)} · {title}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className={styles.errorDisplay}>
            <span className={styles.errorIcon}>⚠️</span>
            <span className={styles.errorText}>{error}</span>
          </div>
        )}

        {/* Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.footerLeft}>
            {step > 1 && (
              <button
                type="button"
                className={styles.navButton}
                onClick={() => goToStep(step - 1)}
                disabled={loading}
              >
                ← Back
              </button>
            )}
          </div>

          <div className={styles.footerRight}>
            <button
              type="button"
              className={styles.navButton}
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={() => goToStep(step + 1)}
                className={styles.navButtonPrimary}
                disabled={
                  (step === 1 && !canProceedToStep2) ||
                  (step === 2 && !canProceedToStep3) ||
                  loading
                }
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                className={styles.saveButton}
                disabled={!canSave || loading}
              >
                {loading ? 'Creating...' : 'Create Story'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}