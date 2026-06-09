// src/components/ScenariosTab/ScenarioChatWindow/InfoPanel/index.jsx
// Complete rewrite — no Lucide, no emoji. SVG icons throughout.
// Structure: header nav strip · two-zone create panel · chip-style jobs · stage progress.

import React, { useState } from 'react';
import ScenarioListItem from './ScenarioListItem';
import styles from './InfoPanel.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

// ── SVG icon components ───────────────────────────────────────────────────────

const HomeIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <path d="M2 6.5L8 2l6 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5z"/>
    <path d="M6 15V9h4v6"/>
  </svg>
);

const BackIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
    <path d="M9 2L4 7l5 5"/>
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
    <polygon points="3,2 13,8 3,14" strokeLinejoin="round"/>
  </svg>
);

const InfoIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" width="13" height="13" style={{ flexShrink: 0 }}>
    <circle cx="7" cy="7" r="5.5"/>
    <line x1="7" y1="5" x2="7" y2="7.5"/>
    <circle cx="7" cy="9.5" r="0.6" fill="currentColor" stroke="none"/>
  </svg>
);

const WarningIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
    <path d="M8 2L1.5 13h13z"/>
    <line x1="8" y1="7" x2="8" y2="9.5"/>
    <circle cx="8" cy="11.5" r="0.7" fill="currentColor" stroke="none"/>
  </svg>
);

const ScriptIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M9 1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5z"/>
    <polyline points="9 1 9 5 13 5"/>
    <line x1="5" y1="9" x2="11" y2="9"/>
    <line x1="5" y1="11.5" x2="8.5" y2="11.5"/>
  </svg>
);

const AudioIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M3 10V7a5 5 0 0 1 10 0v3"/>
    <path d="M1 10.5h2v3H1z"/>
    <path d="M13 10.5h2v3h-2z"/>
    <path d="M3 13.5A5 5 0 0 0 13 13.5"/>
  </svg>
);

const VideoIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <rect x="1" y="3" width="10" height="10" rx="1.5"/>
    <polyline points="11 6.5 15 4.5 15 11.5 11 9.5"/>
  </svg>
);

const ScreenplayIcon = ({ size = 14 }) => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <rect x="1" y="1" width="12" height="12" rx="1.5"/>
    <line x1="4" y1="4.5" x2="10" y2="4.5"/>
    <line x1="4" y1="7" x2="10" y2="7"/>
    <line x1="4" y1="9.5" x2="7" y2="9.5"/>
  </svg>
);

const NarrativeIcon = ({ size = 14 }) => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M2 2h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2V2z"/>
    <line x1="4" y1="5" x2="10" y2="5"/>
    <line x1="4" y1="7.5" x2="10" y2="7.5"/>
    <line x1="4" y1="10" x2="7" y2="10"/>
  </svg>
);

const DebateIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"
    strokeLinecap="round" width="10" height="10">
    <path d="M1 1.5h5a1 1 0 0 1 1 1v2.5a1 1 0 0 1-1 1H2L1 7.5V1.5z"/>
    <path d="M7.5 4h3.5a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-3l-.5 1.5V5a1 1 0 0 1 .5-1h.5"/>
  </svg>
);

const DramaIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"
    strokeLinecap="round" width="10" height="10">
    <path d="M6 1l1.2 2.5L10 4l-2 2 .5 2.8L6 7.5 3.5 8.8 4 6 2 4l2.8-.5z"/>
  </svg>
);

const ActionIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"
    strokeLinecap="round" width="10" height="10">
    <line x1="2" y1="6" x2="9" y2="6"/>
    <polyline points="6.5 3.5 9 6 6.5 8.5"/>
    <line x1="1" y1="2" x2="1" y2="10"/>
  </svg>
);

const RomanceIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"
    strokeLinecap="round" width="10" height="10">
    <path d="M6 10.5C3.5 8.5 1.2 7 1.2 4.8A2.5 2.5 0 0 1 6 3.8a2.5 2.5 0 0 1 4.8 2c0 2.2-2.3 3.7-4.8 5.7z"/>
  </svg>
);

const MysteryIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"
    strokeLinecap="round" width="10" height="10">
    <circle cx="6" cy="5.5" r="4"/>
    <line x1="6" y1="3.5" x2="6" y2="5.5" strokeWidth="1.6"/>
    <circle cx="6" cy="7.5" r="0.55" fill="currentColor" stroke="none"/>
  </svg>
);

const ComedyIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"
    strokeLinecap="round" width="10" height="10">
    <circle cx="6" cy="6" r="4.5"/>
    <circle cx="4.2" cy="5" r="0.6" fill="currentColor" stroke="none"/>
    <circle cx="7.8" cy="5" r="0.6" fill="currentColor" stroke="none"/>
    <path d="M3.8 7.2c.5 1.2 3.9 1.2 4.4 0"/>
  </svg>
);

const RealIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"
    strokeLinecap="round" width="10" height="10">
    <rect x="1" y="1.5" width="10" height="9" rx="1"/>
    <polyline points="1 8 3.5 5.5 5.5 7.5 7.5 5.5 11 8"/>
  </svg>
);

const AnimeIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"
    strokeLinecap="round" width="10" height="10">
    <circle cx="6" cy="6" r="4.5"/>
    <circle cx="4.3" cy="5.5" r="0.8" fill="currentColor" stroke="none"/>
    <circle cx="7.7" cy="5.5" r="0.8" fill="currentColor" stroke="none"/>
    <path d="M4 8c.5.8 3.5.8 4 0"/>
  </svg>
);

const ToonIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"
    strokeLinecap="round" width="10" height="10">
    <rect x="1.5" y="1.5" width="9" height="9" rx="1.5"/>
    <circle cx="4.5" cy="5" r="0.7" fill="currentColor" stroke="none"/>
    <circle cx="7.5" cy="5" r="0.7" fill="currentColor" stroke="none"/>
    <line x1="4" y1="7.5" x2="8" y2="7.5"/>
  </svg>
);

const ComicIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"
    strokeLinecap="round" width="10" height="10">
    <rect x="1" y="1" width="10" height="10" rx="1"/>
    <line x1="1" y1="5" x2="11" y2="5"/>
    <line x1="1" y1="8" x2="11" y2="8"/>
    <line x1="5" y1="1" x2="5" y2="10"/>
  </svg>
);

const ScenarioIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
    <circle cx="4.5" cy="4.5" r="2"/>
    <circle cx="9.5" cy="4.5" r="2"/>
    <path d="M1 12c0-2.2 1.8-3.5 3.5-3.5"/>
    <path d="M13 12c0-2.2-1.8-3.5-3.5-3.5"/>
    <path d="M4.5 8.5c.5-.2 1.3-.5 2.5-.5s2 .3 2.5.5"/>
  </svg>
);

const ContentIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
    <rect x="1" y="1" width="12" height="12" rx="2"/>
    <line x1="4" y1="7" x2="10" y2="7"/>
    <line x1="4" y1="4.5" x2="10" y2="4.5"/>
    <line x1="4" y1="9.5" x2="7" y2="9.5"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <circle cx="10" cy="10" r="8.5"/>
    <polyline points="6.5 10 9 12.5 13.5 7.5"/>
  </svg>
);

// ── Constants ─────────────────────────────────────────────────────────────────

const CONTENT_TYPES = [
  { id: 'script', label: 'Script', Icon: ScriptIcon },
  { id: 'audio',  label: 'Audio',  Icon: AudioIcon  },
  { id: 'video',  label: 'Scene',  Icon: VideoIcon  },
];

const DURATIONS = [
  { value: 60,  label: '60s',  desc: 'Short'  },
  { value: 120, label: '120s', desc: 'Med'    },
  { value: 180, label: '180s', desc: 'Full'   },
];

const VIDEO_STYLES = [
  { id: 'realistic',  label: 'Real',  Icon: RealIcon  },
  { id: 'anime',      label: 'Anime', Icon: AnimeIcon },
  { id: 'cartoon',    label: 'Toon',  Icon: ToonIcon  },
  { id: 'comic_book', label: 'Comic', Icon: ComicIcon },
];

const SCRIPT_FORMATS = [
  { id: 'screenplay', label: 'Screenplay', Icon: ScreenplayIcon },
  { id: 'narrative',  label: 'Narrative',  Icon: NarrativeIcon  },
];

const STORY_STYLES = [
  { id: 'debate',  label: 'Debate',  Icon: DebateIcon  },
  { id: 'drama',   label: 'Drama',   Icon: DramaIcon   },
  { id: 'action',  label: 'Action',  Icon: ActionIcon  },
  { id: 'romance', label: 'Romance', Icon: RomanceIcon },
  { id: 'mystery', label: 'Mystery', Icon: MysteryIcon },
  { id: 'comedy',  label: 'Comedy',  Icon: ComedyIcon  },
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

function contentTypeLabel(type) {
  return CONTENT_TYPES.find(t => t.id === type)?.label || 'Script';
}

function ContentTypeIcon({ type, size = 12 }) {
  const entry = CONTENT_TYPES.find(t => t.id === type);
  if (!entry) return null;
  return <entry.Icon size={size} />;
}

function jobChipIconClass(type) {
  if (type === 'audio') return styles.jobChipIconAudio;
  if (type === 'video') return styles.jobChipIconVideo;
  return styles.jobChipIconScript;
}

function jobChipMeta(job) {
  if (job.content_type === 'script') return formatCharCount(job.char_count);
  if (job.content_type === 'audio')  return 'MP3';
  return 'MP4';
}

/**
 * Stage-aware progress messages for the video pipeline.
 * Matches the actual pipeline stages in video_assembly_service.py.
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
  const [selectedStoryStyle, setSelectedStoryStyle] = useState('debate');

  const validScenarios = Array.isArray(scenarios) ? scenarios : [];
  const activeScenario = validScenarios.find(s => s.id === currentScenarioId);
  const status         = contentState?.status   || 'idle';
  const progress       = contentState?.progress || 0;
  const pct            = Math.round(progress * 100);
  const isAsync        = ['audio', 'video'].includes(selectedType);

  // ── Shared header nav strip ────────────────────────────────────────────────
  const Header = ({ generating = false }) => (
    <div className={styles.header}>
      <button
        className={styles.homeButton}
        onClick={onHomeClick}
        title="Return to Chat Launcher"
        aria-label="Return to Chat Launcher"
      >
        <HomeIcon />
      </button>
      <div className={styles.headerCenter}>
        <div className={styles.headerLabel}>
          {generating ? 'Generating' : 'Active Scenario'}
        </div>
        <div className={styles.headerScenario}>
          {generating
            ? contentTypeLabel(contentState?.activeJob?.content_type || selectedType)
            : (activeScenario?.title || 'No scenario selected')}
        </div>
      </div>
      {!generating && activeScenario && (
        <span className={styles.headerBadge}>
          {activeScenario.character_keys?.length || 0} chars
        </span>
      )}
    </div>
  );

  // ── CREATING ──────────────────────────────────────────────────────────────
  if (status === 'creating') {
    const activeType    = contentState?.activeJob?.content_type || selectedType;
    const isVideoJob    = activeType === 'video';
    const isAudioJob    = activeType === 'audio';
    const stageMessage  = isVideoJob
      ? videoProgressMessage(pct)
      : isAudioJob
        ? audioProgressMessage(pct)
        : 'Generating screenplay…';
    const timeHint      = isVideoJob
      ? pct < 50
        ? 'Usually takes 8–12 minutes total'
        : 'More than halfway there…'
      : null;

    return (
      <div className={styles.infoPanel}>
        <Header generating />
        <div className={styles.panelBody}>
          <div className={styles.section}>
            <div className={styles.creatingCard}>
              <div className={styles.creatingSpinner} />
              <p className={styles.creatingLabel}>{stageMessage}</p>

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

              {timeHint && (
                <p className={styles.creatingHint}>{timeHint}</p>
              )}

              {isVideoJob && pct < 80 && (
                <div className={styles.stageList}>
                  <div className={`${styles.stageItem} ${pct >= 5  ? styles.stageDone : pct >= 2  ? styles.stageActive : ''}`}>
                    <span className={styles.stageDot} />
                    <span>Voices</span>
                  </div>
                  <div className={`${styles.stageItem} ${pct >= 30 ? styles.stageDone : pct >= 22 ? styles.stageActive : ''}`}>
                    <span className={styles.stageDot} />
                    <span>Images</span>
                  </div>
                  <div className={`${styles.stageItem} ${pct >= 78 ? styles.stageDone : pct >= 50 ? styles.stageActive : ''}`}>
                    <span className={styles.stageDot} />
                    <span>Animate</span>
                  </div>
                  <div className={`${styles.stageItem} ${pct >= 100 ? styles.stageDone : pct >= 85 ? styles.stageActive : ''}`}>
                    <span className={styles.stageDot} />
                    <span>Assemble</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scenarios still accessible during generation */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <ScenarioIcon />
              My Scenarios
            </div>
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
        <div className={styles.panelBody}>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Generation Failed</div>
            <div className={styles.errorCard}>
              <span className={styles.errorCardIcon}><WarningIcon /></span>
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
        <div className={styles.panelBody}>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Ready</div>
            <div className={styles.successCard}>
              <span className={styles.successIcon}>
                <CheckCircleIcon />
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
                  <button className={styles.generateButton} onClick={() => onViewJob(job)}>
                    Play / Download
                  </button>
                </>
              )}

              {type === 'video' && (
                <>
                  <p className={styles.successMeta}>Scene video · {job.duration_seconds}s</p>
                  <button className={styles.generateButton} onClick={() => onViewJob(job)}>
                    Watch / Download
                  </button>
                </>
              )}

              <button className={styles.backLink} onClick={onCloseCreate}>
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── CREATE PANEL ──────────────────────────────────────────────────────────
  if (isCreatePanelOpen) {
    const handleGenerate = async () => {
      try {
        // Video is a two-step: generate the screenplay first, open it for review/edit,
        // then the viewer's "Render Video" button is the actual (paid) fal trigger.
        if (selectedType === 'video') {
          const scriptJob = await onCreateContent({
            contentType:     'script',
            durationSeconds: selectedDuration,
            messageIds:      [],
            scriptFormat:    'screenplay',
            storyStyle:      selectedStoryStyle,
            videoStyle:      selectedVideoStyle,   // carried → viewer pre-selects this look
          });
          const id = scriptJob && (scriptJob.id || scriptJob.job_id);
          if (id) onViewJob({ ...scriptJob, id });
          return;
        }

        await onCreateContent({
          contentType:     selectedType,
          durationSeconds: selectedDuration,
          messageIds:      [],
          videoStyle:      selectedVideoStyle,
          scriptFormat:    selectedType === 'script' ? selectedFormat : 'screenplay',
          storyStyle:      selectedStoryStyle,
        });
      } catch {
        // error surfaced via contentState.error → FAILED block
      }
    };

    return (
      <div className={styles.infoPanel}>
        {/* Create header — back button + title */}
        <div className={styles.createHeader}>
          <button
            className={styles.createBack}
            onClick={onCloseCreate}
            aria-label="Back"
          >
            <BackIcon />
          </button>
          <span className={styles.createTitle}>Create Content</span>
        </div>

        <div className={styles.panelBody}>

          {/* ── Zone A: What to make ── */}
          <div className={styles.zone}>
            <div className={styles.zoneLabel}>What to make</div>
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
                  <span className={styles.typeIcon}><t.Icon size={16} /></span>
                  <span className={styles.typeLabel}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Zone B: How to make it ── */}
          <div className={styles.zone}>
            <div className={styles.zoneLabel}>How to make it</div>

            {/* Script options */}
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
                      <span className={styles.typeIcon}><f.Icon size={14} /></span>
                      <span className={styles.typeLabel}>{f.label}</span>
                    </button>
                  ))}
                </div>

                {selectedFormat === 'narrative' && (
                  <p className={styles.asyncTypeHint}>
                    <InfoIcon />
                    Prose narrative — literary third-person format.
                    Cannot be used for audio or video generation.
                  </p>
                )}

                {selectedFormat === 'screenplay' && (
                  <>
                    <p className={styles.fieldLabel}>Story style</p>
                    <div className={styles.styleGrid}>
                      {STORY_STYLES.map(s => (
                        <button
                          key={s.id}
                          className={[
                            styles.styleButton,
                            selectedStoryStyle === s.id ? styles.styleButtonActive : '',
                          ].filter(Boolean).join(' ')}
                          onClick={() => setSelectedStoryStyle(s.id)}
                          aria-pressed={selectedStoryStyle === s.id}
                          title={s.label}
                        >
                          <span className={styles.styleIcon}><s.Icon /></span>
                          <span className={styles.styleLabel}>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Audio hint */}
            {selectedType === 'audio' && (
              <p className={styles.asyncTypeHint}>
                <InfoIcon />
                Generates character voices from your screenplay. Takes 2–5 minutes.
                Requires a Script first.
              </p>
            )}

            {/* Video options */}
            {selectedType === 'video' && (
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

                <p className={styles.fieldLabel}>Story style</p>
                <div className={styles.styleGrid}>
                  {STORY_STYLES.map(s => (
                    <button
                      key={s.id}
                      className={[
                        styles.styleButton,
                        selectedStoryStyle === s.id ? styles.styleButtonActive : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => setSelectedStoryStyle(s.id)}
                      aria-pressed={selectedStoryStyle === s.id}
                      title={s.label}
                    >
                      <span className={styles.styleIcon}><s.Icon /></span>
                      <span className={styles.styleLabel}>{s.label}</span>
                    </button>
                  ))}
                </div>

                <p className={styles.fieldLabel}>Visual style</p>
                <div className={styles.styleGrid}>
                  {VIDEO_STYLES.map(s => (
                    <button
                      key={s.id}
                      className={[
                        styles.styleButton,
                        selectedVideoStyle === s.id ? styles.styleButtonActive : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => setSelectedVideoStyle(s.id)}
                      aria-pressed={selectedVideoStyle === s.id}
                      title={s.label}
                    >
                      <span className={styles.styleIcon}><s.Icon /></span>
                      <span className={styles.styleLabel}>{s.label}</span>
                    </button>
                  ))}
                </div>
                <p className={styles.asyncTypeHint}>
                  <InfoIcon />
                  Builds the screenplay first — review and edit it, then hit Render Video.
                </p>
              </>
            )}
          </div>

        </div>

        {/* Generate CTA — pinned to bottom */}
        <div className={styles.zoneCta}>
          <button className={styles.generateButton} onClick={handleGenerate}>
            <PlayIcon />
            Generate {contentTypeLabel(selectedType)}
          </button>
        </div>
      </div>
    );
  }

  // ── DEFAULT: jobs list + scenarios ────────────────────────────────────────
  return (
    <div className={styles.infoPanel}>
      <Header />

      <div className={styles.panelBody}>

        {/* Created Content — chip style */}
        {(contentJobsLoading || contentJobs.length > 0) && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <ContentIcon />
                Created Content
              </div>
              {contentJobs.length > 0 && (
                <span className={styles.countBadge}>{contentJobs.length}</span>
              )}
            </div>

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
                    <div className={[styles.jobCardIcon, jobChipIconClass(job.content_type)].join(' ')}>
                      <ContentTypeIcon type={job.content_type} size={12} />
                    </div>
                    <div className={styles.jobCardBody}>
                      <span className={styles.jobCardType}>
                        {contentTypeLabel(job.content_type)} · {job.duration_seconds}s
                      </span>
                      <span className={styles.jobCardMeta}>
                        {jobChipMeta(job)} · {formatJobDate(job.created_at)}
                      </span>
                    </div>
                    <span className={styles.jobCardArrow}>›</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Scenarios */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <ScenarioIcon />
              My Scenarios
            </div>
            {validScenarios.length > 0 && (
              <span className={styles.countBadge}>{validScenarios.length}</span>
            )}
          </div>

          {validScenarios.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>
                <ScenarioIcon />
              </span>
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
    </div>
  );
}