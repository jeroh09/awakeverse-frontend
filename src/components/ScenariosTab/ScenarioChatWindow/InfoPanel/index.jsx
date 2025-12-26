// src/components/ScenariosTab/ScenarioChatWindow/InfoPanel/index.jsx
// PHASE 4: Info Panel - Right side panel with scenarios list and home button

import React from 'react';
import ScenarioListItem from './ScenarioListItem';
import { Home } from 'lucide-react';
import styles from './InfoPanel.module.css';

/**
 * InfoPanel - Right side panel showing scenarios list and home button
 * 
 * @param {Array} scenarios - Array of user's scenarios from MyScenariosPanel
 * @param {string} currentScenarioId - ID of currently active scenario
 * @param {Function} onScenarioSelect - (scenarioId) => void - Switch to different scenario
 * @param {Function} onHomeClick - Navigate back to ChatLauncher
 */
export default function InfoPanel({
  scenarios = [],
  currentScenarioId = null,
  onScenarioSelect = () => {},
  onHomeClick = () => {}
}) {
  // Defensive: Validate props
  if (typeof onHomeClick !== 'function') {
    console.error('❌ InfoPanel: onHomeClick must be a function');
    return null;
  }

  if (typeof onScenarioSelect !== 'function') {
    console.error('❌ InfoPanel: onScenarioSelect must be a function');
  }

  // Defensive: Ensure scenarios is array
  const validScenarios = Array.isArray(scenarios) ? scenarios : [];

  // Observable logging
  console.log('📋 InfoPanel rendering:', {
    scenariosCount: validScenarios.length,
    currentScenarioId
  });

  return (
    <div className={styles.infoPanel}>
      {/* Header with Home Button */}
      <div className={styles.header}>
        <button
          className={styles.homeButton}
          onClick={onHomeClick}
          title="Return to Chat Launcher"
          aria-label="Return to Chat Launcher"
        >
          <Home size={22} />
        </button>
      </div>

      {/* Scenarios List Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>My Scenarios</h3>
        
        {validScenarios.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🎭</span>
            <p className={styles.emptyText}>No scenarios yet</p>
          </div>
        ) : (
          <div className={styles.scenariosList}>
            {validScenarios.map(scenario => (
              <ScenarioListItem
                key={scenario.id}
                scenario={scenario}
                isActive={scenario.id === currentScenarioId}
                onClick={() => onScenarioSelect(scenario.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}