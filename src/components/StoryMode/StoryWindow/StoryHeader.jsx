// src/components/StoryMode/StoryWindow/StoryHeader.jsx
import React, { useState, useMemo } from 'react';
import StoryHomeButton from './StoryHomeButton';
import MilestoneChips from './MilestoneChips';
import styles from './StoryWindow.module.css';

export default function StoryHeader({
  story,
  onBack,
  onClose,
  // Optional: if StoryWindow already has these, you can pass them explicitly.
  milestones,
  currentMilestoneId,
}) {
  const [objectivesOpen, setObjectivesOpen] = useState(false);

  // Prefer onBack, fall back to onClose so it works with existing callers
  const handleBack = onBack || onClose || (() => {});

  const formatEra = (era) => {
    if (!era) return 'Modern';
    const map = {
      ancient: 'Ancient Times',
      medieval: 'Medieval Era',
      renaissance: 'Renaissance',
      '1800s': '1800s',
      '1900s': '1900s',
      'early_1900s': 'Early 1900s',
      'late_1900s': 'Late 1900s',
      'modern': 'Modern Day',
      'future': 'Near Future',
    };
    return map[era] || era;
  };

  const formatCharacter = (keyOrName) => {
    if (!keyOrName) return 'Unknown Character';
    // If backend passes internal key like user_45_imhotep, clean it up
    return keyOrName
      .toString()
      .replace(/^user_\d+_/, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const safeMilestones = useMemo(
    () => milestones || story?.milestones || [],
    [milestones, story],
  );

  const progressPercent =
    story?.overall_progress_percent ??
    story?.objective_progress_percent ??
    story?.progress_percent ??
    null;

  const objectiveTitle =
    story?.current_objective_title ||
    story?.current_objective ||
    story?.story_objective ||
    story?.objective ||
    null;

  const currentActLabel =
    story?.current_act_label ||
    (story?.current_act_name &&
      story?.total_acts &&
      `Act ${story.current_act_number || 1} of ${story.total_acts}`) ||
    story?.current_act_name ||
    null;

  const hasObjectives =
    objectiveTitle || (Array.isArray(safeMilestones) && safeMilestones.length > 0);

  return (
    <>
      {/* MAIN HEADER BAND */}
      <header className={styles.storyHeader}>
        <StoryHomeButton onClick={handleBack} />

        <div className={styles.headerContent}>
          <h1 className={styles.storyTitle}>
            {story?.title || story?.display_title || 'Story In Progress'}
          </h1>

          <div className={styles.storyMeta}>
            {story?.preset_era && (
              <span className={styles.eraBadge}>
                <span>📜</span> {formatEra(story.preset_era)}
              </span>
            )}

            {story?.main_character_key && (
              <span className={styles.characterBadge}>
                <span>🧬</span> {formatCharacter(story.main_character_key)}
              </span>
            )}

            {story?.total_acts && (
              <span className={styles.actBadge}>
                <span>🎭</span>
                {story.current_act_number
                  ? `Act ${story.current_act_number} of ${story.total_acts}`
                  : `${story.total_acts} acts`}
              </span>
            )}

            {Number.isFinite?.(story?.total_turns) && story.total_turns > 0 && (
              <span className={styles.turnsBadge}>
                <span>💬</span> {story.total_turns} turns
              </span>
            )}
          </div>
        </div>

        {/* COMPACT OBJECTIVE SUMMARY + TRIGGER */}
        {hasObjectives && (
          <div className={styles.storyObjectiveChip}>
            <div className={styles.objectiveMini}>Story Objective</div>
            {objectiveTitle && (
              <div className={styles.objectiveSummary}>
                <span>{objectiveTitle}</span>
              </div>
            )}

            <button
              type="button"
              className={styles.objectiveStatusPill}
              onClick={() => setObjectivesOpen(true)}
            >
              <span>
                {currentActLabel ||
                  (story?.total_acts ? 'Objectives' : 'View Objectives')}
              </span>
              {Number.isFinite(progressPercent) && (
                <span className={styles.objectivePercent}>
                  {Math.round(progressPercent)}%
                </span>
              )}
            </button>
          </div>
        )}
      </header>

      {/* OBJECTIVES SLIDE PANEL (overlay, not in main layout flow) */}
      {hasObjectives && (
        <aside
          className={`${styles.objectivesPanel} ${
            objectivesOpen ? styles.objectivesPanelOpen : ''
          }`}
        >
          <div className={styles.objectivesPanelHeader}>
            <div className={styles.objectivesPanelTitle}>Objectives &amp; Acts</div>
            <button
              type="button"
              className={styles.objectivesPanelClose}
              onClick={() => setObjectivesOpen(false)}
            >
              Close ✕
            </button>
          </div>

          {objectiveTitle && (
            <div className={styles.panelObjectiveText}>
              <strong>Story Objective:</strong>
              <br />
              {objectiveTitle}
            </div>
          )}

          <div className={styles.panelProgressTrack}>
            <div
              className={styles.panelProgressFill}
              style={{
                width: Number.isFinite(progressPercent)
                  ? `${Math.max(0, Math.min(100, progressPercent))}%`
                  : '0%',
              }}
            />
          </div>

          <div className={styles.panelMetaRow}>
            <span>
              {currentActLabel ||
                (story?.total_acts
                  ? `Story Acts: ${story.total_acts}`
                  : 'Story Progress')}
            </span>

            {Number.isFinite(progressPercent) && (
              <span className={styles.panelMetaPill}>
                {Math.round(progressPercent)}% complete
              </span>
            )}
          </div>

          {Array.isArray(safeMilestones) && safeMilestones.length > 0 && (
            <>
              <div className={styles.panelMilestonesHeader}>Milestones</div>
              <div className={styles.panelMilestonesList}>
                <MilestoneChips
                  milestones={safeMilestones}
                  currentMilestoneId={currentMilestoneId}
                />
              </div>
            </>
          )}
        </aside>
      )}
    </>
  );
}
