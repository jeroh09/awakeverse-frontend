// src/components/ScenariosTab/ScenarioChatWindow/MediaJobModal.jsx
// Audio/Video preview + download + share. Full-page view — no overlay wrapper.
// CP3: video jobs get an "Edit Scene" mode that swaps body into SceneEditor.

import React, { useState, useCallback, useEffect, useRef } from 'react';
import styles from './MediaJobModal.module.css';
import SceneEditor from './SceneEditor';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

async function fetchBlobUrl(jobId, endpoint) {
  const response = await fetch(
    `${API_BASE}/api/content/jobs/${jobId}/${endpoint}`,
    { credentials: 'include' }
  );
  if (!response.ok) throw new Error(`Failed to load: ${response.status}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

async function downloadJobFile(jobId, endpoint, filename) {
  try {
    const blobUrl = await fetchBlobUrl(jobId, endpoint);
    const a       = document.createElement('a');
    a.href        = blobUrl;
    a.download    = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  } catch (e) {
    console.error('Download error:', e);
  }
}

async function getShareLink(jobId) {
  const response = await fetch(
    `${API_BASE}/api/content/jobs/${jobId}/share-link`,
    { credentials: 'include' }
  );
  if (!response.ok) throw new Error(`Share link failed: ${response.status}`);
  const data = await response.json();
  return data.share_url;
}

// ── SVG icon components ───────────────────────────────────────────────────────

const HeadphonesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
    <path d="M3 10V7a9 9 0 0 1 18 0v3"/>
    <path d="M1 12h3a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-5z"/>
    <path d="M23 12h-3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-5z"/>
    <path d="M3 17a9 9 0 0 0 9 5 9 9 0 0 0 9-5"/>
  </svg>
);

const VideoCameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
    <rect x="1" y="5" width="14" height="14" rx="2"/>
    <polyline points="15 9 23 5 23 19 15 15"/>
  </svg>
);

const ScriptIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" width="14" height="14">
    <line x1="3" y1="3" x2="13" y2="13"/>
    <line x1="13" y1="3" x2="3" y2="13"/>
  </svg>
);

const SpeakerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
    <circle cx="12" cy="12" r="10"/>
    <polygon points="10 8 18 12 10 16"/>
  </svg>
);

const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
    <rect x="9" y="2" width="6" height="12" rx="3"/>
    <path d="M5 10a7 7 0 0 0 14 0"/>
    <line x1="12" y1="20" x2="12" y2="22"/>
    <line x1="9" y1="22" x2="15" y2="22"/>
  </svg>
);

const FilmIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
    <rect x="2" y="2" width="20" height="20" rx="2"/>
    <line x1="7" y1="2" x2="7" y2="22"/>
    <line x1="17" y1="2" x2="17" y2="22"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <line x1="2" y1="7" x2="7" y2="7"/>
    <line x1="2" y1="17" x2="7" y2="17"/>
    <line x1="17" y1="7" x2="22" y2="7"/>
    <line x1="17" y1="17" x2="22" y2="17"/>
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <polyline points="4 7 8 11 12 7"/>
    <line x1="8" y1="2" x2="8" y2="11"/>
    <line x1="2" y1="14" x2="14" y2="14"/>
  </svg>
);

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <polyline points="3 8 6 11 13 4"/>
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <path d="M11.5 2.5a1.4 1.4 0 0 1 2 2L6 12l-2.8.8.8-2.8z"/>
    <line x1="10" y1="4" x2="12" y2="6"/>
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

export default function MediaJobModal({ job, scenarioTitle, onClose }) {
  if (!job) return null;

  const type     = job.content_type;
  const isAudio  = type === 'audio';
  const isVideo  = type === 'video';
  const isScript = type === 'script';

  const [previewUrl,     setPreviewUrl]     = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError,   setPreviewError]   = useState(null);
  const [copied,         setCopied]         = useState(false);
  const [copyError,      setCopyError]      = useState(false);
  const [mode,           setMode]           = useState('view');  // 'view' | 'edit'
  const blobUrlRef = useRef(null);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const handlePreview = async () => {
    if (previewUrl) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const endpoint = isAudio ? 'download-audio' : 'download-video';
      const url = await fetchBlobUrl(job.id, endpoint);
      blobUrlRef.current = url;
      setPreviewUrl(url);
    } catch (e) {
      setPreviewError('Could not load preview. Try downloading instead.');
      console.error('Preview error:', e);
    } finally {
      setPreviewLoading(false);
    }
  };

  // After a re-assembly drop the stale blob so next Play fetches the new cut
  const handleApplied = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setPreviewUrl(null);
  }, []);

  const handleCopyLink = async () => {
    setCopyError(false);
    try {
      const url = await getShareLink(job.id);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  };

  // Escape only closes in view mode — edit mode owns its own back button
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && mode === 'view') onClose();
  }, [onClose, mode]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const isPlaying = !!previewUrl;
  const isEditing = isVideo && mode === 'edit';

  const headerIcon  = isAudio ? <HeadphonesIcon /> : isVideo ? <VideoCameraIcon /> : <ScriptIcon />;
  const headerTitle = isEditing
    ? 'Edit Scene'
    : isAudio ? 'Audio Drama' : isVideo ? 'Scene Video' : 'Screenplay';

  return (
    <div className={styles.page} role="main" aria-label={headerTitle}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon}>{headerIcon}</span>
          <div>
            <h2 className={styles.headerTitle}>{headerTitle}</h2>
            <p className={styles.headerMeta}>
              {scenarioTitle} · {job.duration_seconds}s
              {job.created_at && ` · ${formatDate(job.created_at)}`}
            </p>
          </div>
        </div>
        <button className={styles.closeButton} onClick={onClose} aria-label="Back to chat">
          <CloseIcon />
        </button>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className={isEditing ? styles.bodyEdit : styles.bodyView}>

        {/* ── EDIT MODE: SceneEditor fills the full body ─────────────── */}
        {isEditing && (
          <SceneEditor
            job={job}
            onClose={() => setMode('view')}
            onApplied={handleApplied}
          />
        )}

        {/* ── VIEW MODE ─────────────────────────────────────────────────── */}
        {!isEditing && (
          <>
            {/* LEFT: player area */}
            <div className={styles.playerCol}>

              {/* Script viewer */}
              {isScript && job.condensed_script && (
                <div className={styles.scriptViewer}>
                  <pre className={styles.scriptText}>{job.condensed_script}</pre>
                </div>
              )}

              {/* Preview trigger */}
              {(isAudio || isVideo) && !previewUrl && !previewLoading && !previewError && (
                <button className={styles.previewButton} onClick={handlePreview}>
                  <span className={styles.previewIcon}>
                    {isAudio ? <SpeakerIcon /> : <PlayIcon />}
                  </span>
                  {isAudio ? 'Play Audio Drama' : 'Play Scene Video'}
                </button>
              )}

              {previewLoading && (
                <div className={styles.previewLoading}>
                  <div className={styles.previewSpinner} />
                  <p>Loading {isAudio ? 'audio' : 'video'}…</p>
                </div>
              )}

              {previewError && (
                <p className={styles.previewError}>{previewError}</p>
              )}

              {/* Audio player */}
              {previewUrl && isAudio && (
                <div className={styles.audioPlayerWrapper}>
                  <audio controls autoPlay src={previewUrl} className={styles.audioPlayer}>
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}

              {/* Video player */}
              {previewUrl && isVideo && (
                <div className={styles.videoPlayerWrapper}>
                  <video controls autoPlay src={previewUrl} className={styles.videoPlayer}>
                    Your browser does not support video playback.
                  </video>
                </div>
              )}

              {/* Info block — hidden once media loaded */}
              {!isPlaying && !isScript && (
                <div className={styles.infoBlock}>
                  <span className={styles.infoIcon}>
                    {isAudio ? <MicIcon /> : <FilmIcon />}
                  </span>
                  <div className={styles.infoText}>
                    <p className={styles.infoTitle}>
                      {isAudio ? 'Multi-voice audio drama' : 'Scene video with character voices'}
                    </p>
                    <p className={styles.infoDesc}>
                      {isAudio
                        ? 'Characters voiced by ElevenLabs with accent-matched profiles.'
                        : 'AI-generated scene visuals combined with character audio.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: actions column */}
            <div className={styles.actionsCol}>

              {/* Share */}
              <button
                className={[
                  styles.shareButton,
                  copied    ? styles.shareButtonCopied : '',
                  copyError ? styles.shareButtonError  : '',
                ].filter(Boolean).join(' ')}
                onClick={handleCopyLink}
              >
                {copied ? <CheckIcon /> : <LinkIcon />}
                {copied ? 'Link copied!' : copyError ? 'Could not copy' : 'Copy shareable link'}
              </button>

              {/* Downloads */}
              <div className={styles.downloadButtons}>

                {isScript && (
                  <>
                    <button
                      className={styles.downloadButton}
                      onClick={() => downloadJobFile(job.id, 'download-script', `screenplay_${job.id}.fountain`)}
                    >
                      <DownloadIcon />
                      <span className={styles.downloadLabel}>
                        Download .fountain
                        <span className={styles.downloadHint}>Highland · WriterDuet · Final Draft</span>
                      </span>
                    </button>
                    <button
                      className={`${styles.downloadButton} ${styles.downloadButtonSecondary}`}
                      onClick={() => downloadJobFile(job.id, 'download-fdx', `screenplay_${job.id}.fdx`)}
                    >
                      <DownloadIcon />
                      <span className={styles.downloadLabel}>
                        Download .fdx
                        <span className={styles.downloadHint}>Final Draft native format</span>
                      </span>
                    </button>
                  </>
                )}

                {isAudio && (
                  <button
                    className={styles.downloadButton}
                    onClick={() => downloadJobFile(job.id, 'download-audio', `audio_drama_${job.id}.mp3`)}
                  >
                    <DownloadIcon />
                    Download MP3
                  </button>
                )}

                {isVideo && (
                  <>
                    <button
                      className={styles.downloadButton}
                      onClick={() => setMode('edit')}
                    >
                      <EditIcon />
                      Edit Scene
                    </button>
                    <button
                      className={styles.downloadButton}
                      onClick={() => downloadJobFile(job.id, 'download-video', `scene_video_${job.id}.mp4`)}
                    >
                      <DownloadIcon />
                      Download MP4
                    </button>
                    {job.audio_url && (
                      <button
                        className={`${styles.downloadButton} ${styles.downloadButtonSecondary}`}
                        onClick={() => downloadJobFile(job.id, 'download-audio', `audio_drama_${job.id}.mp3`)}
                      >
                        <DownloadIcon />
                        Download MP3 (audio track)
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className={styles.footer}>
        <span className={styles.footerText}>&ldquo;{scenarioTitle}&rdquo;</span>
        <span className={styles.footerHint}>
          {isEditing ? 'Editing scene · use Back to return to view' : 'Esc to go back'}
        </span>
      </div>

    </div>
  );
}