// src/components/ScenariosTab/ScenarioChatWindow/InfoPanel/index.jsx
// Complete rewrite — audio and video enabled, async progress UI, download buttons.

import React, { useState } from 'react';
import ScenarioListItem from './ScenarioListItem';
import { Home } from 'lucide-react';
import styles from './InfoPanel.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

const CONTENT_TYPES = [
  { id: 'script', icon: '📄', label: 'Script', soon: false },
  { id: 'audio',  icon: '🎧', label: 'Audio',  soon: false },
  { id: 'video',  icon: '🎬', label: 'Scene',  soon: false },
];

const DURATIONS = [
  { value: 60,  label: '60s',  desc: 'Short'  },
  { value: 120, label: '120s', desc: 'Medium' },
  { value: 180, label: '180s', desc: 'Full'   },
];

const VIDEO_STYLES = [
  { id: 'realistic',  label: 'Real',   icon: '🎬' },
  { id: 'anime',      label: 'Anime',  icon: '✨' },
  { id: 'cartoon',    label: 'Toon',   icon: '🎨' },
  { id: 'comic_book', label: 'Comic',  icon: '📖' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatJobDate(isoString) {
  if (!isoString) return '';
  const d   = new Date(isoString);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return isToday
    ? `Today ${time}`
    : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
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

function creatingHintText(type) {
  if (type === 'audio') return 'Generating character voices and assembling audio drama…';
  if (type === 'video') return 'Generating audio, scene clips, and assembling video… (20–40 min)';
  return 'This takes a few seconds';
}

// ── Download helper ───────────────────────────────────────────────────────────

async function downloadJobFile(jobId, type) {
  try {
    const url      = `${API_BASE}/api/content/jobs/${jobId}/download-${type}`;
    const response = await fetch(url, { credentials: 'include' });

    if (!response.ok) {
      console.error(`Download failed: ${response.status}`);
      return;
    }

    const blob    = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href        = blobUrl;
    a.download    = type === 'audio'
      ? `audio_drama_${jobId}.mp3`
      : `scene_video_${jobId}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
    console.log(`⬇️ Downloaded ${type} for job ${jobId}`);
  } catch (e) {
    console.error('Download error:', e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function InfoPanel({
  scenarios          = [],
  currentScenarioId  = null,
  onScenarioSelect   = () => {},
  onHomeClick        = () => {},
  contentState       = null,
  contentJobs        = [],
  contentJobsLoading = false,
  isCreatePanelOpen  = false,
  onCloseCreate      = () => {},
  onCreateContent    = async () => {},
  onViewJob          = () => {},
}) {
  const [selectedType,     setSelectedType]     = useState('script');
  const [selectedDuration, setSelectedDuration] = useState(180);
  const [selectedVideoStyle, setSelectedVideoStyle] = useState('realistic');
  const validScenarios = Array.isArray(scenarios) ? scenarios : [];
  const status         = contentState?.status   || 'idle';
  const progress       = contentState?.progress || 0;
  const isAsync        = ['audio', 'video'].includes(selectedType);

  console.log('📋 InfoPanel:', {
    status, progress: Math.round(progress * 100), isCreatePanelOpen,
    jobsCount: contentJobs.length,
  });

  // ── Shared header ──────────────────────────────────────────────────────────
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

  // ── CREATING ───────────────────────────────────────────────────────────────
  if (status === 'creating') {
    const pct = Math.round(progress * 100);
    return (
      <div className={styles.infoPanel}>
        <Header />
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Creating</h3>
          <div className={styles.creatingCard}>
            <div className={styles.creatingSpinner} />
            <p className={styles.creatingLabel}>
              Generating your {selectedType}…
            </p>
            {isAsync && (
              <>
                <div className={styles.asyncProgressBar}>
                  <div
                    className={styles.asyncProgressFill}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className={styles.asyncProgressText}>{pct}%</p>
              </>
            )}
            <p className={styles.creatingHint}>{creatingHintText(selectedType)}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── FAILED ─────────────────────────────────────────────────────────────────
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

  // ── COMPLETE ───────────────────────────────────────────────────────────────
  if (status === 'complete' && isCreatePanelOpen && contentState?.activeJob) {
    const job  = contentState.activeJob;
    const type = job.content_type;

    return (
      <div className={styles.infoPanel}>
        <Header />
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Ready</h3>
          <div className={styles.successCard}>
            <span className={styles.successIcon}>✅</span>
            <p className={styles.successLabel}>
              {contentTypeLabel(type)} generated
            </p>

            {/* Script */}
            {type === 'script' && (
              <>
                <p className={styles.successMeta}>
                  {formatCharCount(job.char_count)} · {job.duration_seconds}s
                </p>
                <button
                  className={styles.generateButton}
                  onClick={() => onViewJob(job)}
                >
                  View Script
                </button>
              </>
            )}

            {/* Audio */}
            {type === 'audio' && (
              <>
                <p className={styles.successMeta}>
                  Audio drama · {job.duration_seconds}s
                </p>
                <button
                  className={styles.generateButton}
                  onClick={() => downloadJobFile(job.id, 'audio')}
                >
                  ⬇ Download MP3
                </button>
              </>
            )}

            {/* Video */}
            {type === 'video' && (
              <>
                <p className={styles.successMeta}>
                  Scene video · {job.duration_seconds}s
                </p>
                <button
                  className={styles.generateButton}
                  onClick={() => downloadJobFile(job.id, 'video')}
                >
                  ⬇ Download MP4
                </button>
                {job.audio_url && (
                  <button
                    className={`${styles.generateButton} ${styles.generateButtonSecondary}`}
                    onClick={() => downloadJobFile(job.id, 'audio')}
                  >
                    ⬇ Download MP3 (audio track)
                  </button>
                )}
              </>
            )}

            <button className={styles.backLink} onClick={onCloseCreate}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── CREATE PANEL ───────────────────────────────────────────────────────────
  if (isCreatePanelOpen) {
    const handleGenerate = async () => {
      try {
        await onCreateContent({
          contentType:     selectedType,
          durationSeconds: selectedDuration,
          messageIds:      [],
          videoStyle:      selectedVideoStyle,
        });
      } catch {
        // error surfaced via contentState.error → FAILED block
      }
    };

    return (
      <div className={styles.infoPanel}>
        <Header />
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>✨ Create Content</h3>

          {/* Output type */}
          <p className={styles.fieldLabel}>Output type</p>
          <div className={styles.typeSelector}>
            {CONTENT_TYPES.map(t => (
              <button
                key={t.id}
                className={[
                  styles.typeButton,
                  selectedType === t.id ? styles.typeButtonActive : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setSelectedType(t.id)}
                aria-pressed={selectedType === t.id}
                title={t.label}
              >
                <span className={styles.typeIcon}>{t.icon}</span>
                <span className={styles.typeLabel}>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Duration — script only */}
          {selectedType === 'script' && (
            <>
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
            </>
          )}

          {/* Context hint for async types */}
          {selectedType !== 'script' && (
            <p className={styles.asyncTypeHint}>
              {selectedType === 'audio'
                ? '🎧 Generates character voices from your screenplay'
                : '🎬 Generates audio + full scene video from your screenplay. Takes 20–40 min.'}
            </p>
          )}
 
          {selectedType === 'video' && (
            <>
              <p className={styles.fieldLabel}>Visual style</p>
              <div className={styles.typeSelector}>
                {VIDEO_STYLES.map(s => (
                  <button
                    key={s.id}
                    className={[
                      styles.typeButton,
                      selectedVideoStyle === s.id ? styles.typeButtonActive : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => setSelectedVideoStyle(s.id)}
                    aria-pressed={selectedVideoStyle === s.id}
                    title={s.label}
                  >
                    <span className={styles.typeIcon}>{s.icon}</span>
                    <span className={styles.typeLabel}>{s.label}</span>
                  </button>
                ))}
              </div>
              <p className={styles.asyncTypeHint}>
                🎬 Generates audio + full scene video. Takes 20–40 min.
              </p>
            </>
          )}
 

          <button
            className={styles.generateButton}
            onClick={handleGenerate}
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

  // ── DEFAULT: jobs list + scenarios ─────────────────────────────────────────
  return (
    <div className={styles.infoPanel}>
      <Header />

      {/* Created Content */}
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
                      {job.content_type === 'script'
                        ? formatCharCount(job.char_count)
                        : job.content_type === 'audio' ? 'MP3' : 'MP4'
                      } · {formatJobDate(job.created_at)}
                    </span>
                  </div>
                  <span className={styles.jobCardArrow}>›</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scenarios */}
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