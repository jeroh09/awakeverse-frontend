// src/components/ScenariosTab/ScenarioChatWindow/InfoPanel/ScenarioListItem.jsx
// Individual scenario card in the info panel list

import React from 'react';
import styles from './InfoPanel.module.css';

/**
 * ScenarioListItem - Individual scenario in the list
 * 
 * @param {Object} scenario - Scenario object with id, title, character_keys
 * @param {boolean} isActive - Whether this is the currently active scenario
 * @param {Function} onClick - Click handler to switch to this scenario
 */
export default function ScenarioListItem({
  scenario,
  isActive = false,
  onClick = () => {}
}) {
  // Defensive: Validate scenario object
  if (!scenario || !scenario.id) {
    console.error('❌ ScenarioListItem: Invalid scenario object');
    return null;
  }

  // Extract scenario data with defensive defaults
  const {
    id,
    title = 'Untitled Scenario',
    character_keys = [],
    description = ''
  } = scenario;

  // Calculate participant count
  const participantCount = Array.isArray(character_keys) ? character_keys.length : 0;

  // Defensive: Don't render if no participants
  if (participantCount === 0) {
    console.warn('⚠️ ScenarioListItem: Scenario has no participants', id);
    return null;
  }

  return (
    <div
      className={`${styles.scenarioItem} ${isActive ? styles.active : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${title} - ${participantCount} participants${isActive ? ' (current)' : ''}`}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={styles.scenarioTitle}>{title}</div>
      <div className={styles.scenarioMeta}>
        <span className={styles.metaItem}>
          👥 {participantCount} participant{participantCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}