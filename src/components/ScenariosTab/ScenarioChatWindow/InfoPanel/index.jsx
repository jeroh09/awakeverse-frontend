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

const SCRIPT_FORMATS = [
  { id: 'screenplay', label: 'Screenplay', icon: '🎬' },
  { id: 'narrative',  label: 'Narrative',  icon: '📖' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatJobDate(isoString) {
  if (!isoString) return '';
  const d   = new Date(isoString);
  const now = new Date();
  const isToday =
    d.getDate()     === now.getDate()     &&
    d.getMonth()    === now.getMonth()    &&
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

/**
 * Stage-aware progress messages for the video pipeline.
 * Matches the actual pipeline stages in video_assembly_service.py.
 *   0–5%   parsing
 *   5–22%  audio generation
 *   22–30% audio assembly + character registry
 *   30–50% FLUX images
 *   50–78% Pika submissions + polling
 *   78–85% downloading clips
 *   85–100% FFmpeg assembly
 */
function videoProgressMessage(pct) {
  if (pct < 5)  return 'Parsing screenplay…';
  if (pct < 22) return 'Generating character voices…';
  if (pct < 30) return 'Assembling audio drama…';
  if (pct < 50) return 'Generating scene images…';
  if (pct < 78) return 'Animating scenes — this is the slow part…';
  if (pct < 85) return 'Downloading scene clips…';
  if (pct < 95) return 'Assembling final video…';
  return 'Almost there…';
}

function audioProgressMessage(pct) {
  if (pct < 10) return 'Preparing screenplay…';
  if (pct < 90) return 'Generating character voices…';
  return 'Assembling audio drama…';
}

function friendlyError(rawError) {
  if (!rawError) return 'Something went wrong. Please try again.';
  const e = rawError.toLowerCase();
  if (e.includes('screenplay') || e.includes('script'))
    return 'No screenplay found. Generate a Script first, then try again.';
  if (e.includes('balance') || e.includes('credit') || e.includes('quota'))
    return 'Generation service is temporarily unavailable. Please try again shortly.';
  if (e.includes('timeout') || e.includes('timed out'))
    return 'Generation took too long and timed out. Try a shorter duration.';
  if (e.includes('no clips') || e.includes('assembly'))
    return 'Video assembly failed — some scene clips could not be generated. Try again.';
  if (e.includes('elevenlabs') || e.includes('audio'))
    return 'Voice generation failed. Please try again.';
  if (e.includes('limit'))
    return 'Daily generation limit reached. Try again tomorrow.';
  return 'Generation failed unexpectedly. Please try again.';
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
  const [selectedType,       setSelectedType]       = useState('script');
  const [selectedDuration,   setSelectedDuration]   = useState(180);
  const [selectedVideoStyle, setSelectedVideoStyle] = useState('realistic');
  const [selectedFormat,     setSelectedFormat]     = useState('screenplay');

  const validScenarios = Array.isArray(scenarios) ? scenarios : [];
  const status         = contentState?.status   || 'idle';
  const progress       = contentState?.progress || 0;
  const pct            = Math.round(progress * 100);
  const isAsync        = ['audio', 'video'].includes(selectedType);

  // ── Shared header ─────────────────────────────────────────────────────────
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

  // ── CREATING ──────────────────────────────────────────────────────────────
  if (status === 'creating') {
    // Which content type is actually generating — from the active job if available
    const activeType = contentState?.activeJob?.content_type || selectedType;
    const isVideoJob = activeType === 'video';
    const isAudioJob = activeType === 'audio';

    const stageMessage = isVideoJob
      ? videoProgressMessage(pct)
      : isAudioJob
        ? audioProgressMessage(pct)
        : 'Generating screenplay…';

    // Estimated time hint — only shown for video
    const timeHint = isVideoJob
      ? pct < 50
        ? 'Usually takes 8–12 minutes total'
        : 'More than halfway there…'
      : null;

    return (
      <div className={styles.infoPanel}>
        <Header />
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            {isVideoJob ? '🎬 Generating Scene Video' :
             isAudioJob ? '🎧 Generating Audio Drama' :
             '📄 Generating Script'}
          </h3>

          <div className={styles.creatingCard}>
            {/* Spinner */}
            <div className={styles.creatingSpinner} />

            {/* Stage message */}
            <p className={styles.creatingLabel}>{stageMessage}</p>

            {/* Progress bar — async jobs only */}
            {isAsync && (
              <div className={styles.progressWrapper}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <span className={styles.progressPct}>{pct}%</span>
              </div>
            )}

            {/* Time hint */}
            {timeHint && (
              <p className={styles.creatingHint}>{timeHint}</p>
            )}

            {/* Stage breakdown for video — shows what's coming */}
            {isVideoJob && pct < 80 && (
              <div className={styles.stageList}>
                <div className={`${styles.stageItem} ${pct >= 5  ? styles.stageDone : pct >= 2  ? styles.stageActive : ''}`}>
                  <span className={styles.stageDot} />
                  <span>Voices</span>
                </div>
                <div className={`${styles.stageItem} ${pct >= 30 ? styles.stageDone : pct >= 22 ? styles.stageActive : ''}`}>
                  <span className={styles.stageDot} />
                  <span>Scene images</span>
                </div>
                <div className={`${styles.stageItem} ${pct >= 78 ? styles.stageDone : pct >= 50 ? styles.stageActive : ''}`}>
                  <span className={styles.stageDot} />
                  <span>Animation</span>
                </div>
                <div className={`${styles.stageItem} ${pct >= 100 ? styles.stageDone : pct >= 85 ? styles.stageActive : ''}`}>
                  <span className={styles.stageDot} />
                  <span>Assembly</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── FAILED ────────────────────────────────────────────────────────────────
  if (status === 'failed' && isCreatePanelOpen) {
    const message = friendlyError(contentState?.error);
    return (
      <div className={styles.infoPanel}>
        <Header />
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Generation Failed</h3>
          <div className={styles.errorCard}>
            <span className={styles.errorCardIcon}>⚠️</span>
            <p className={styles.errorCardText}>{message}</p>
            <button
              className={styles.generateButton}
              onClick={() => onCreateContent({
                contentType:     selectedType,
                durationSeconds: selectedDuration,
                messageIds:      [],
                videoStyle:      selectedVideoStyle,
              })}
            >
              Try Again
            </button>
            <button className={styles.backLink} onClick={onCloseCreate}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── COMPLETE ──────────────────────────────────────────────────────────────
  if (status === 'complete' && isCreatePanelOpen && contentState?.activeJob) {
    const job  = contentState.activeJob;
    const type = job.content_type;

    return (
      <div className={styles.infoPanel}>
        <Header />
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Ready ✅</h3>
          <div className={styles.successCard}>
            <span className={styles.successIcon}>
              {type === 'script' ? '📄' : type === 'audio' ? '🎧' : '🎬'}
            </span>
            <p className={styles.successLabel}>
              {contentTypeLabel(type)} generated
            </p>

            {type === 'script' && (
              <>
                <p className={styles.successMeta}>
                  {formatCharCount(job.char_count)} · {job.duration_seconds}s
                </p>
                <button className={styles.generateButton} onClick={() => onViewJob(job)}>
                  View Script
                </button>
              </>
            )}

            {type === 'audio' && (
              <>
                <p className={styles.successMeta}>Audio drama · {job.duration_seconds}s</p>
                <button
                  className={styles.generateButton}
                  onClick={() => onViewJob(job)}
                >
                  🎧 Play / Download
                </button>
              </>
            )}

            {type === 'video' && (
              <>
                <p className={styles.successMeta}>Scene video · {job.duration_seconds}s</p>
                <button
                  className={styles.generateButton}
                  onClick={() => onViewJob(job)}
                >
                  🎬 Watch / Download
                </button>
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

  // ── CREATE PANEL ──────────────────────────────────────────────────────────
  if (isCreatePanelOpen) {
    const handleGenerate = async () => {
      try {
        await onCreateContent({
          contentType:     selectedType,
          durationSeconds: selectedDuration,
          messageIds:      [],
          videoStyle:      selectedVideoStyle,
          scriptFormat:    selectedType === 'script' ? selectedFormat : 'screenplay',
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

              <p className={styles.fieldLabel}>Format</p>
              <div className={styles.typeSelector}>
                {SCRIPT_FORMATS.map(f => (
                  <button
                    key={f.id}
                    className={[
                      styles.typeButton,
                      selectedFormat === f.id ? styles.typeButtonActive : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => setSelectedFormat(f.id)}
                    aria-pressed={selectedFormat === f.id}
                    title={f.label}
                  >
                    <span className={styles.typeIcon}>{f.icon}</span>
                    <span className={styles.typeLabel}>{f.label}</span>
                  </button>
                ))}
              </div>

              {selectedFormat === 'narrative' && (
                <p className={styles.asyncTypeHint}>
                  📖 Prose narrative — literary third-person format.
                  Cannot be used for audio or video generation.
                </p>
              )}
            </>
          )}

          {/* Audio hint */}
          {selectedType === 'audio' && (
            <p className={styles.asyncTypeHint}>
              🎧 Generates character voices from your screenplay. Takes 2–5 minutes.
            </p>
          )}

          {/* Video style + hint */}
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
                🎬 Generates audio + animated scene video. Takes 8–12 minutes.
              </p>
            </>
          )}

          <button className={styles.generateButton} onClick={handleGenerate}>
            Generate {contentTypeLabel(selectedType)}
          </button>

          <button className={styles.backLink} onClick={onCloseCreate}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ── DEFAULT: jobs list + scenarios ────────────────────────────────────────
  return (
    <div className={styles.infoPanel}>
      <Header />

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