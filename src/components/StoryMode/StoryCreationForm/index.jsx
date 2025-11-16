// src/components/StoryMode/StoryCreationForm/index.jsx
// Complete Creation Form with Scene Style support
import React, { useState, useEffect } from 'react';
import useStoryApi from '../../../hooks/useStoryApi';
import CharacterSelector from './CharacterSelector';
import { getDisplayNameFromKey } from '../../../utils/characterUtils';
import styles from './StoryCreationForm.module.css';

export default function StoryCreationForm({
  template,
  isOpen,
  onClose = () => {},
  onSuccess = () => {},
}) {
  const [step, setStep] = useState(1); // 1: Character, 2: Details
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [title, setTitle] = useState('');
  const [startingSituation, setStartingSituation] = useState('');
  const [customEra, setCustomEra] = useState('');
  const [sceneStyle, setSceneStyle] = useState(''); // NEW: scene prompt text

  const { createStory } = useStoryApi();

  // Initialize from template when opened
  useEffect(() => {
    if (template && isOpen) {
      setTitle(template.title || '');
      setStartingSituation(template.preset_situation || '');
      setCustomEra(template.preset_era || '');
      setSelectedCharacter(template.preset_character_key || null);
      setSceneStyle(template.scene_prompt || '');
    }

    if (!template && isOpen) {
      // Blank create: clear fields
      setTitle('');
      setStartingSituation('');
      setCustomEra('');
      setSelectedCharacter(null);
      setSceneStyle('');
    }
  }, [template, isOpen]);

  // Validation
  const canProceedToStep2 = selectedCharacter !== null;
  const canSave =
    canProceedToStep2 &&
    title.trim().length > 0 &&
    startingSituation.trim().length > 0;

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
    setCustomEra('');
    setSceneStyle('');
    onClose();
  };

  // Save / create story
  const handleSave = async () => {
    if (!canSave) {
      setError('Please complete all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const scenePromptTrimmed = sceneStyle.trim();

      const storyData = {
        title: title.trim(),
        character_key: selectedCharacter,
        starting_situation: startingSituation.trim(),
        template_id: template?.id || null,
        custom_era: customEra || null,
        // NEW: scene prompt sent to backend
        scene_prompt: scenePromptTrimmed || null,
      };

      console.log('📖 Creating story:', storyData);

      const result = await createStory(storyData);

      if (result.success) {
        console.log('✅ Story created:', result.story);
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
                Customize your story title, opening scene, and era.
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

              {/* NEW: Scene Style */}
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
        </div>

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

            {step === 1 ? (
              <button
                type="button"
                onClick={() => goToStep(step + 1)}
                className={styles.navButtonPrimary}
                disabled={!canProceedToStep2 || loading}
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
