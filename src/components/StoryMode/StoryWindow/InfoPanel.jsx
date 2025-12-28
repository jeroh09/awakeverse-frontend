// src/components/StoryMode/StoryWindow/InfoPanel.jsx
import React from 'react';
import { Home } from 'lucide-react';
import styles from './InfoPanel.module.css';

/**
 * InfoPanel - Retractable right panel with story metadata
 * 
 * Props:
 * - story: Story object with acts, milestones
 * - collapsed: Boolean indicating panel state
 * - onToggle: Callback to toggle panel
 * - onClose: Callback to return to story list
 */
export default function InfoPanel({ story, collapsed, onToggle, onClose }) {
  // Extract acts and milestones
  const acts = story?.acts || [];
  const milestones = story?.milestones || [];
  const currentAct = story?.current_act || 1;
  const currentMilestoneId = story?.current_milestone_id;

  return (
    <>
      {/* Breadcrumb Toggle Button - Always visible, positioned outside panel */}
      <button 
        className={`${styles.infoPanelToggle} ${collapsed ? styles.toggleCollapsed : ''}`}
        onClick={onToggle}
        title={collapsed ? 'Show info panel' : 'Hide info panel'}
        aria-label={collapsed ? 'Show info panel' : 'Hide info panel'}
      >
        <svg 
          className={styles.breadcrumbIcon}
          style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Info Panel */}
      <aside className={`${styles.infoPanel} ${collapsed ? styles.collapsed : ''}`}>
        
        {/* Panel Header */}
        <div className={styles.infoPanelHeader}>
          <h3 className={styles.infoPanelTitle}>Story Details</h3>
          
          {/* Home Button */}
          <button className={styles.infoHomeButton} onClick={onClose}>
            <Home size={18} />
            Return to Stories
          </button>
        </div>
        
        {/* Panel Content */}
        <div className={styles.infoPanelContent}>
          
          {/* Acts Section */}
          {acts.length > 0 && (
            <div className={styles.infoSection}>
              <div className={styles.infoSectionTitle}>Story Acts</div>
              
              {acts.map((act, index) => {
                const actNumber = index + 1;
                const isActive = actNumber === currentAct;
                const isComplete = actNumber < currentAct;
                
                return (
                  <div 
                    key={act.id || actNumber}
                    className={`${styles.actCard} ${isActive ? styles.active : ''}`}
                  >
                    <div className={styles.actNumber}>Act {actNumber}</div>
                    <div className={styles.actTitle}>{act.title || `Act ${actNumber}`}</div>
                    <div className={styles.actProgress}>
                      {isComplete ? 'Complete' : isActive ? 'In Progress' : 'Not Started'}
                      {act.turns > 0 && ` • ${act.turns} turns`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Milestones Section */}
          {milestones.length > 0 && (
            <div className={styles.infoSection}>
              <div className={styles.infoSectionTitle}>Current Milestones</div>
              
              {milestones.map((milestone) => {
                const isCurrent = milestone.id === currentMilestoneId;
                const status = milestone.status || 'not_started';
                
                // Status icons
                const statusIcon = {
                  complete: '✅',
                  in_progress: '🔄',
                  not_started: '⏸️',
                  adapted: '🔀'
                }[status] || '⏸️';
                
                // Status labels
                const statusLabel = {
                  complete: 'Complete',
                  in_progress: 'Current',
                  not_started: 'Upcoming',
                  adapted: 'Adapted'
                }[status] || 'Upcoming';
                
                return (
                  <div 
                    key={milestone.id}
                    className={`${styles.milestoneItem} ${isCurrent ? styles.current : ''}`}
                  >
                    <div className={styles.milestoneHeader}>
                      <span className={styles.milestoneIcon}>{statusIcon}</span>
                      <span className={styles.milestoneTitle}>
                        {milestone.description || `Milestone ${milestone.id}`}
                      </span>
                      <span className={styles.milestoneStatus}>{statusLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Empty state if no acts/milestones */}
          {acts.length === 0 && milestones.length === 0 && (
            <div className={styles.emptyState}>
              <p>No story structure defined yet.</p>
            </div>
          )}
          
        </div>
      </aside>
    </>
  );
}