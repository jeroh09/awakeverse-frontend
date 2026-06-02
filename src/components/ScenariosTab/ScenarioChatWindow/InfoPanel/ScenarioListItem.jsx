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
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"
            strokeLinecap="round" strokeLinejoin="round" width="10" height="10">
            <circle cx="4" cy="4" r="1.8"/>
            <circle cx="8.5" cy="4" r="1.8"/>
            <path d="M1 10.5c0-1.7 1.3-3 3-3"/>
            <path d="M11.5 10.5c0-1.7-1.3-3-3-3"/>
            <path d="M4 7.5c.5-.2 1-.3 2-.3s1.5.1 2 .3"/>
          </svg>
          {participantCount} participant{participantCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}