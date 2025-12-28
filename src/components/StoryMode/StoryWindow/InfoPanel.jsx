// src/components/StoryMode/StoryWindow/InfoPanel.jsx
import React from 'react';
import { Home } from 'lucide-react';
import styles from './InfoPanel.module.css';

/**
 * InfoPanel - Retractable right panel with story metadata and progress
 * 
 * Props:
 * - story: Story object with metadata, progress data, milestones
 * - collapsed: Boolean indicating panel state
 * - onToggle: Callback to toggle panel
 * - onClose: Callback to return to story list
 */
export default function InfoPanel({ story, collapsed, onToggle, onClose }) {
  // Extract progress data (from progressData merged into story object)
  const primaryObjective = story?.primary_objective || "Navigate the unfolding story";
  const currentAct = story?.current_act || 1;
  const totalActs = 3;
  const overallProgress = story?.overall_progress || 0;
  const progressPercent = Math.round(overallProgress * 100);
  const turns = story?.total_turns || 0;
  
  // Extract act mapping
  const actMapping = story?.act_mapping || {};
  const currentActData = actMapping[currentAct.toString()] || {};
  const actName = currentActData.name || 'Unknown';
  const actTitle = `Act ${currentAct} · ${actName}`;
  
  // Extract milestones
  const milestones = story?.milestones || [];
  const currentMilestoneId = story?.current_milestone_id;

  return (
    <>
      {/* Breadcrumb Toggle Button - Always visible, positioned outside panel */}
      <button 
        className={`${styles.infoPanelToggle} ${collapsed ? styles.toggleCollapsed : ''}`}
        onClick={onToggle}
        title={collapsed ? 'Show objectives panel' : 'Hide objectives panel'}
        aria-label={collapsed ? 'Show objectives panel' : 'Hide objectives panel'}
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
          <h3 className={styles.infoPanelTitle}>Objectives & Acts</h3>
          
          {/* Home Button */}
          <button className={styles.infoHomeButton} onClick={onClose}>
            <Home size={18} />
            <span>Home</span>
          </button>
        </div>
        
        {/* Panel Content */}
        <div className={styles.infoPanelContent}>
          
          {/* PRIMARY OBJECTIVE SECTION */}
          <div className={styles.panelMainObjective}>
            <strong>Story Objective:</strong>
            <br />
            {primaryObjective}
          </div>
          
          {/* ACT PROGRESS SECTION */}
          <div className={styles.panelProgressSection}>
            {/* Act header line */}
            <div className={styles.panelActLine}>
              <span className={styles.panelActTitle}>{actTitle}</span>
              <span className={styles.panelActBadge}>
                Act {currentAct} / {totalActs}
              </span>
            </div>
            
            {/* Progress track */}
            <div className={styles.panelProgressTrack}>
              <div
                className={styles.panelProgressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            
            {/* Meta row - turn counter and % complete */}
            <div className={styles.panelMetaRow}>
              {turns > 0 && (
                <span>💬 {turns} turn{turns === 1 ? '' : 's'} so far</span>
              )}
              
              {progressPercent > 0 && (
                <span className={styles.panelMetaPill}>
                  {progressPercent}% complete
                </span>
              )}
            </div>
          </div>
          
          {/* MILESTONES SECTION */}
          {milestones && milestones.length > 0 && (
            <>
              <div className={styles.milestonesHeader}>Milestones</div>
              <div className={styles.milestonesList}>
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
                  
                  // Progress percentage for this milestone
                  const milestoneProgress = milestone.progress || 0;
                  const milestoneProgressPct = Math.round(milestoneProgress * 100);
                  
                  return (
                    <div 
                      key={milestone.id}
                      className={`${styles.milestoneCard} ${isCurrent ? styles.current : ''} ${styles[status]}`}
                    >
                      <div className={styles.milestoneHeader}>
                        <span className={styles.milestoneIcon}>{statusIcon}</span>
                        <span className={styles.milestoneDescription}>
                          {milestone.description}
                        </span>
                      </div>
                      
                      <div className={styles.milestoneFooter}>
                        <span className={styles.milestoneStatus}>{statusLabel}</span>
                        
                        {milestoneProgress > 0 && milestoneProgress < 1 && (
                          <span className={styles.milestoneProgress}>
                            {milestoneProgressPct}%
                          </span>
                        )}
                        
                        {milestone.estimated_turns > 0 && status !== 'complete' && (
                          <span className={styles.milestoneTurns}>
                            ~{milestone.estimated_turns} turns
                          </span>
                        )}
                      </div>
                      
                      {/* Progress bar for in-progress milestones */}
                      {status === 'in_progress' && milestoneProgress > 0 && (
                        <div className={styles.milestoneProgressBar}>
                          <div 
                            className={styles.milestoneProgressFill}
                            style={{ width: `${milestoneProgressPct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          
        </div>
      </aside>
    </>
  );
}