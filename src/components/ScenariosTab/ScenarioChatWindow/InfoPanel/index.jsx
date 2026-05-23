// src/components/ScenariosTab/ScenarioChatWindow/InfoPanel/index.jsx
// 2B-2: Expanded into Content Hub — Create panel + jobs list + viewer trigger

import React, { useState } from 'react';
import ScenarioListItem from './ScenarioListItem';
import { Home } from 'lucide-react';
import styles from './InfoPanel.module.css';

const CONTENT_TYPES = [
  {
    id:    'script',
    icon:  '📄',
    label: 'Script',
    soon:  false,
  },
  {
    id:    'audio',
    icon:  '🎧',
    label: 'Audio',
    soon:  true,
  },
  {
    id:    'video',
    icon:  '🎬',
    label: 'Scene',
    soon:  true,
  },
];

const DURATIONS = [
  { value: 60,  label: '60s',  desc: 'Short' },
  { value: 120, label: '120s', desc: 'Medium' },
  { value: 180, label: '180s', desc: 'Full' },
];

// ── Small helpers ─────────────────────────────────────────────────────────────

function formatJobDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return isToday ? `Today ${time}` : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` ${time}`;
}

function formatCharCount(n) {
  if (!n) return '';
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k chars` : `${n} chars`;
}

function contentTypeIcon(type) {
  return CONTENT_TYPES.find(t => t.id === type)?.icon || '📄';
}

function contentTypeLabel(type) {
  return CONTENT_TYPES.find(t => t.id === type)?.label || 'Script';
}

// ─────────────────────────────────────────────────────────────────────────────

export default function InfoPanel({
  scenarios        = [],
  currentScenarioId = null,
  onScenarioSelect  = () => {},
  onHomeClick       = () => {},
  // Content generation props (from useContentGeneration via ScenarioChatWindow)
  contentState      = null,   // { status, activeJob, error }
  contentJobs       = [],     // past completed jobs for this scenario
  contentJobsLoading = false,
  isCreatePanelOpen  = false,
  onCloseCreate      = () => {},
  onCreateContent    = async () => {},
  onViewJob          = () => {},
}) {
  const [selectedType,     setSelectedType]     = useState('script');
  const [selectedDuration, setSelectedDuration] = useState(180);

  // Defensive
  const validScenarios = Array.isArray(scenarios) ? scenarios : [];
  const status         = contentState?.status || 'idle';

  console.log('📋 InfoPanel rendering:', {
    scenariosCount: validScenarios.length,
    currentScenarioId,
    contentStatus: status,
    jobsCount: contentJobs.length,
    isCreatePanelOpen,
  });

  // ── Shared header — always visible ─────────────────────────────────────────
  const Header = () => (
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
  );

  // ── CREATING state ──────────────────────────────────────────────────────────
  if (status === 'creating') {
    return (
      <div className={styles.infoPanel}>
        <Header />
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Creating</h3>
          <div className={styles.creatingCard}>
            <div className={styles.creatingSpinner} />
            <p className={styles.creatingLabel}>Generating your {selectedType}…</p>
            <p className={styles.creatingHint}>This takes a few seconds</p>
          </div>
        </div>
      </div>
    );
  }

  // ── FAILED state (while panel is open) ─────────────────────────────────────
  if (status === 'failed' && isCreatePanelOpen) {
    return (
      <div className={styles.infoPanel}>
        <Header />
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Generation failed</h3>
          <div className={styles.errorCard}>
            <span className={styles.errorCardIcon}>⚠️</span>
            <p className={styles.errorCardText}>
              {contentState?.error || 'Something went wrong'}
            </p>
            <button
              className={styles.generateButton}
              onClick={() => onCreateContent({
                contentType:     selectedType,
                durationSeconds: selectedDuration,
                messageIds:      [],
              })}
            >
              Try again
            </button>
            <button className={styles.backLink} onClick={onCloseCreate}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── COMPLETE state (while panel is open) ───────────────────────────────────
  if (status === 'complete' && isCreatePanelOpen && contentState?.activeJob) {
    const job = contentState.activeJob;
    return (
      <div className={styles.infoPanel}>
        <Header />
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Ready</h3>
          <div className={styles.successCard}>
            <span className={styles.successIcon}>✅</span>
            <p className={styles.successLabel}>
              {contentTypeLabel(job.content_type)} generated
            </p>
            <p className={styles.successMeta}>
              {formatCharCount(job.char_count)} · {job.duration_seconds}s
            </p>
            <button
              className={styles.generateButton}
              onClick={() => onViewJob(job)}
            >
              View {contentTypeLabel(job.content_type)}
            </button>
            <button className={styles.backLink} onClick={onCloseCreate}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── CREATE PANEL (isCreatePanelOpen, status idle) ──────────────────────────
  if (isCreatePanelOpen) {
    const handleGenerate = async () => {
      if (selectedType !== 'script') return; // guard — others are coming soon
      try {
        await onCreateContent({
          contentType:     selectedType,
          durationSeconds: selectedDuration,
          messageIds:      [],
        });
      } catch {
        // error surfaced via contentState.error — handled in FAILED block above
      }
    };

    return (
      <div className={styles.infoPanel}>
        <Header />

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>✨ Create Content</h3>

          {/* Type selector */}
          <p className={styles.fieldLabel}>Output type</p>
          <div className={styles.typeSelector}>
            {CONTENT_TYPES.map(t => (
              <button
                key={t.id}
                className={[
                  styles.typeButton,
                  selectedType === t.id && !t.soon ? styles.typeButtonActive : '',
                  t.soon ? styles.typeButtonSoon : '',
                ].filter(Boolean).join(' ')}
                onClick={() => !t.soon && setSelectedType(t.id)}
                disabled={t.soon}
                title={t.soon ? 'Coming soon' : t.label}
                aria-pressed={selectedType === t.id && !t.soon}
              >
                <span className={styles.typeIcon}>{t.icon}</span>
                <span className={styles.typeLabel}>{t.label}</span>
                {t.soon && (
                  <span className={styles.soonBadge}>Soon</span>
                )}
              </button>
            ))}
          </div>

          {/* Duration selector */}
          <p className={styles.fieldLabel}>Duration</p>
          <div className={styles.durationSelector}>
            {DURATIONS.map(d => (
              <button
                key={d.value}
                className={[
                  styles.durationButton,
                  selectedDuration === d.value ? styles.durationButtonActive : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setSelectedDuration(d.value)}
                aria-pressed={selectedDuration === d.value}
              >
                <span className={styles.durationLabel}>{d.label}</span>
                <span className={styles.durationDesc}>{d.desc}</span>
              </button>
            ))}
          </div>

          {/* Generate */}
          <button
            className={styles.generateButton}
            onClick={handleGenerate}
            disabled={selectedType !== 'script'}
          >
            Generate {contentTypeLabel(selectedType)}
          </button>

          <button className={styles.backLink} onClick={onCloseCreate}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ── DEFAULT: Content list + Scenarios list ─────────────────────────────────
  return (
    <div className={styles.infoPanel}>
      <Header />

      {/* Created Content section — only shown when jobs exist */}
      {(contentJobsLoading || contentJobs.length > 0) && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Created Content</h3>

          {contentJobsLoading ? (
            <div className={styles.jobsLoading}>
              <div className={styles.jobsLoadingBar} />
            </div>
          ) : (
            <div className={styles.jobsList}>
              {contentJobs.map(job => (
                <button
                  key={job.id}
                  className={styles.jobCard}
                  onClick={() => onViewJob(job)}
                  title={`View ${contentTypeLabel(job.content_type)}`}
                >
                  <span className={styles.jobCardIcon}>
                    {contentTypeIcon(job.content_type)}
                  </span>
                  <div className={styles.jobCardBody}>
                    <span className={styles.jobCardType}>
                      {contentTypeLabel(job.content_type)} · {job.duration_seconds}s
                    </span>
                    <span className={styles.jobCardMeta}>
                      {formatCharCount(job.char_count)} · {formatJobDate(job.created_at)}
                    </span>
                  </div>
                  <span className={styles.jobCardArrow}>›</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scenarios list */}
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