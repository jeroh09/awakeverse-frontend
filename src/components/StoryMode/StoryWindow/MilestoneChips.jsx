// src/components/StoryMode/StoryWindow/MilestoneChips.jsx
import React, { useState } from 'react';
import styles from './MilestoneChips.module.css';

/**
 * Display milestone progress as interactive chips
 */
export default function MilestoneChips({ milestones, currentMilestoneId }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!milestones || milestones.length === 0) {
    return null;
  }

  const handleToggle = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className={styles.milestonesContainer}>
      <div className={styles.milestonesLabel}>Milestones</div>
      
      <div className={styles.milestonesList}>
        {milestones.map((milestone) => {
          const isCurrent = milestone.id === currentMilestoneId;
          const isExpanded = expandedId === milestone.id;
          const status = milestone.status || 'not_started';
          const progress = Math.round((milestone.progress || 0) * 100);

          // Status icons
          const statusIcon = {
            complete: '✅',
            in_progress: '🔄',
            not_started: '⏸️',
            adapted: '🔀'
          }[status] || '⏸️';

          return (
            <div
              key={milestone.id}
              className={`${styles.milestoneChip} ${
                isCurrent ? styles.current : ''
              } ${styles[status]}`}
              onClick={() => handleToggle(milestone.id)}
            >
              <div className={styles.chipHeader}>
                <span className={styles.chipIcon}>{statusIcon}</span>
                <span className={styles.chipNumber}>{milestone.id}</span>
                {isCurrent && <span className={styles.currentBadge}>Current</span>}
              </div>

              <div className={styles.chipTitle}>{milestone.description}</div>

              {status === 'in_progress' && (
                <div className={styles.chipProgress}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>{progress}%</span>
                </div>
              )}

              {/* Expanded details */}
              {isExpanded && (
                <div className={styles.chipDetails}>
                  {milestone.criteria && (
                    <div className={styles.detailRow}>
                      <strong>Criteria:</strong> {milestone.criteria}
                    </div>
                  )}
                  {milestone.estimated_turns > 0 && (
                    <div className={styles.detailRow}>
                      <strong>Est. turns:</strong> {milestone.estimated_turns}
                    </div>
                  )}
                  {milestone.user_adapted && (
                    <div className={styles.adaptedNote}>
                      ℹ️ Adapted to your choices
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}