// src/components/StoryMode/StoryCreation/MilestoneInput.jsx
import React, { useState, useEffect } from 'react';
import useStoryApi from '../../../hooks/useStoryApi';
import styles from './MilestoneInput.module.css';

/**
 * Milestone Input Component for Story Creation
 * 
 * Features:
 * - Auto-generates milestones when objective is filled
 * - Allows editing/deleting milestones
 * - Validates count (2-5) and length (5-20 words)
 * - Mobile-responsive with collapsed view
 * - No skip button - always generates milestones
 * 
 * 🆕 REFACTORED: Now uses useStoryApi hook for centralized API handling
 */
export default function MilestoneInput({ 
  objective,
  startingSituation,
  era,
  characterKey,
  onMilestonesChange,
  initialMilestones = []
}) {
  const [milestones, setMilestones] = useState(initialMilestones);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [expandedMobile, setExpandedMobile] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 🆕 USE THE HOOK
  const { suggestMilestones } = useStoryApi();

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-generate when objective is filled
  useEffect(() => {
    if (objective && objective.trim().length > 10 && !hasGenerated && !isGenerating) {
      generateMilestones();
    }
  }, [objective, hasGenerated, isGenerating]);

  // Notify parent of changes
  useEffect(() => {
    if (onMilestonesChange) {
      onMilestonesChange(milestones);
    }
  }, [milestones, onMilestonesChange]);

  // 🆕 REFACTORED: Now uses the hook instead of direct fetch
  const generateMilestones = async () => {
    if (!objective || objective.trim().length < 10) {
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Use the centralized API method
      const data = await suggestMilestones({
        objective: objective.trim(),
        starting_situation: startingSituation?.trim() || '',
        era: era || 'modern',
        character_key: characterKey || ''
      });

      // Handle response
      if (data.success && data.milestones && data.milestones.length > 0) {
        setMilestones(data.milestones);
        setHasGenerated(true);
        console.log('✅ Milestones generated via', data.method);
      } else {
        throw new Error('Invalid response from server');
      }

    } catch (error) {
      console.error('❌ Milestone generation failed:', error);
      setGenerationError('Could not generate milestones');
      
      // 🛡️ DEFENSIVE: Use fallback milestones
      const fallbackMilestones = [
        `Establish the current situation for ${objective.toLowerCase()}`,
        `Take first meaningful action toward ${objective.toLowerCase()}`,
        `Navigate significant challenge`,
        `Make decisive breakthrough`,
        `Achieve ${objective.toLowerCase()}`
      ];
      
      setMilestones(fallbackMilestones);
      setHasGenerated(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateMilestones = () => {
    setHasGenerated(false);
    setGenerationError(null);
  };

  const handleMilestoneChange = (index, value) => {
    const updated = [...milestones];
    updated[index] = value;
    setMilestones(updated);
  };

  const handleDeleteMilestone = (index) => {
    if (milestones.length <= 2) {
      alert('You must have at least 2 milestones');
      return;
    }
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleAddMilestone = () => {
    if (milestones.length >= 5) {
      alert('Maximum 5 milestones allowed');
      return;
    }
    setMilestones([...milestones, '']);
  };

  // Validation helper
  const getMilestoneValidation = (milestone) => {
    const wordCount = milestone.trim().split(/\s+/).length;
    
    if (!milestone.trim()) {
      return { valid: false, message: 'Empty milestone' };
    }
    if (wordCount < 5) {
      return { valid: false, message: 'Too short (min 5 words)' };
    }
    if (wordCount > 20) {
      return { valid: false, message: 'Too long (max 20 words)' };
    }
    
    return { valid: true, message: `${wordCount} words` };
  };

  // Check for duplicates
  const hasDuplicates = () => {
    const normalized = milestones.map(m => m.trim().toLowerCase()).filter(Boolean);
    return new Set(normalized).size !== normalized.length;
  };

  // Mobile collapsed view
  if (isMobile && !expandedMobile) {
    const validCount = milestones.filter(m => m.trim()).length;
    
    return (
      <div className={styles.milestoneInputMobile}>
        <div className={styles.mobileHeader}>
          <div className={styles.sectionLabel}>Story Milestones</div>
          <button
            type="button"
            className={styles.expandButton}
            onClick={() => setExpandedMobile(true)}
          >
            {validCount}/5 · View & Edit
          </button>
        </div>
        
        {isGenerating && (
          <div className={styles.generatingNote}>
            <span className={styles.spinner} />
            Generating milestones...
          </div>
        )}
        
        {validCount > 0 && !isGenerating && (
          <div className={styles.mobilePreview}>
            {milestones.slice(0, 3).map((m, i) => (
              m.trim() && (
                <div key={i} className={styles.previewChip}>
                  {i + 1}. {m.length > 40 ? m.substring(0, 40) + '...' : m}
                </div>
              )
            ))}
            {validCount > 3 && (
              <div className={styles.moreIndicator}>
                +{validCount - 3} more
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Desktop/Expanded view
  return (
    <div className={styles.milestoneInput}>
      {isMobile && (
        <div className={styles.mobileBackButton}>
          <button
            type="button"
            onClick={() => setExpandedMobile(false)}
          >
            ← Back
          </button>
        </div>
      )}

      <div className={styles.sectionHeader}>
        <div className={styles.sectionLabel}>Story Milestones</div>
        <div className={styles.sectionHint}>
          {milestones.length}/5 milestones · 2-5 recommended
        </div>
      </div>

      {isGenerating && (
        <div className={styles.generatingState}>
          <div className={styles.spinner} />
          <p>Generating milestones based on your objective...</p>
        </div>
      )}

      {!isGenerating && milestones.length > 0 && (
        <>
          <div className={styles.milestonesList}>
            {milestones.map((milestone, index) => {
              const validation = getMilestoneValidation(milestone);
              
              return (
                <div key={index} className={styles.milestoneItem}>
                  <div className={styles.milestoneHeader}>
                    <span className={styles.milestoneNumber}>{index + 1}</span>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => handleDeleteMilestone(index)}
                      disabled={milestones.length <= 2}
                      title="Delete milestone"
                    >
                      ×
                    </button>
                  </div>

                  <textarea
                    className={`${styles.milestoneTextarea} ${
                      !validation.valid ? styles.invalid : ''
                    }`}
                    value={milestone}
                    onChange={(e) => handleMilestoneChange(index, e.target.value)}
                    placeholder={`Milestone ${index + 1} (5-20 words)`}
                    rows={2}
                  />

                  <div className={styles.milestoneValidation}>
                    {validation.message}
                  </div>
                </div>
              );
            })}
          </div>

          {hasDuplicates() && (
            <div className={styles.warningMessage}>
              ⚠️ You have duplicate milestones
            </div>
          )}

          <div className={styles.actionsRow}>
            {milestones.length < 5 && (
              <button
                type="button"
                className={styles.addButton}
                onClick={handleAddMilestone}
              >
                + Add Milestone
              </button>
            )}

            <button
              type="button"
              className={styles.regenerateButton}
              onClick={handleRegenerateMilestones}
            >
              Regenerate Milestones
            </button>
          </div>

          {generationError && (
            <div className={styles.errorMessage}>
              {generationError} (using fallback milestones)
            </div>
          )}

          <div className={styles.helpText}>
            💡 Milestones guide your story but will adapt if you take a different direction
          </div>
        </>
      )}
    </div>
  );
}