// src/components/ScenariosTab/ScenarioChatWindow/MediaJobModal.jsx
// Audio/Video preview + download modal.
// Uses blob URL for authenticated playback — no new endpoints needed.
// Info block hidden when media is playing to maximise player space.

import React, { useState, useCallback, useEffect, useRef } from 'react';
import styles from './MediaJobModal.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

async function fetchBlobUrl(jobId, type) {
  const response = await fetch(
    `${API_BASE}/api/content/jobs/${jobId}/download-${type}`,
    { credentials: 'include' }
  );
  if (!response.ok) throw new Error(`Failed to load ${type}: ${response.status}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

async function downloadJobFile(jobId, type) {
  try {
    const blobUrl = await fetchBlobUrl(jobId, type);
    const a       = document.createElement('a');
    a.href        = blobUrl;
    a.download    = type === 'audio'
      ? `audio_drama_${jobId}.mp3`
      : `scene_video_${jobId}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  } catch (e) {
    console.error('Download error:', e);
  }
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

export default function MediaJobModal({ job, scenarioTitle, onClose }) {
  if (!job) return null;

  const type    = job.content_type;
  const isAudio = type === 'audio';
  const isVideo = type === 'video';

  const [previewUrl,     setPreviewUrl]     = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError,   setPreviewError]   = useState(null);
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
      const url = await fetchBlobUrl(job.id, type);
      blobUrlRef.current = url;
      setPreviewUrl(url);
    } catch (e) {
      setPreviewError('Could not load preview. Try downloading instead.');
      console.error('Preview error:', e);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // True once media blob is loaded and player is visible
  const isPlaying = !!previewUrl;

  return (
    <div
      className={styles.overlay}
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
    >
      <div className={[
        styles.modal,
        isVideo && isPlaying ? styles.modalVideo : '',
      ].filter(Boolean).join(' ')}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerIcon}>{isAudio ? <HeadphonesIcon /> : <VideoCameraIcon />}</span>
            <div>
              <h2 className={styles.headerTitle}>
                {isAudio ? 'Audio Drama' : 'Scene Video'}
              </h2>
              <p className={styles.headerMeta}>
                {scenarioTitle} · {job.duration_seconds}s
                {job.created_at && ` · ${formatDate(job.created_at)}`}
              </p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>

          {/* Preview button — before load */}
          {!previewUrl && !previewLoading && !previewError && (
            <button className={styles.previewButton} onClick={handlePreview}>
              <span className={styles.previewIcon}>{isAudio ? <SpeakerIcon /> : <PlayIcon />}</span>
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

          {/* Video player — 16:9 aspect ratio, controls always visible */}
          {previewUrl && isVideo && (
            <div className={styles.videoPlayerWrapper}>
              <video controls autoPlay src={previewUrl} className={styles.videoPlayer}>
                Your browser does not support video playback.
              </video>
            </div>
          )}

          {/* Info block — hidden once media is loaded to give player full space */}
          {!isPlaying && (
            <div className={styles.infoBlock}>
              <span className={styles.infoIcon}>{isAudio ? <MicIcon /> : <FilmIcon />}</span>
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

          {/* Download buttons */}
          <div className={styles.downloadButtons}>
            {isAudio && (
              <button
                className={styles.downloadButton}
                onClick={() => downloadJobFile(job.id, 'audio')}
              >
                <DownloadIcon />
                Download MP3
              </button>
            )}
            {isVideo && (
              <>
                <button
                  className={styles.downloadButton}
                  onClick={() => downloadJobFile(job.id, 'video')}
                >
                  <DownloadIcon />
                  Download MP4
                </button>
                {job.audio_url && (
                  <button
                    className={`${styles.downloadButton} ${styles.downloadButtonSecondary}`}
                    onClick={() => downloadJobFile(job.id, 'audio')}
                  >
                    <DownloadIcon />
                    Download MP3 (audio track)
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.footerText}>&ldquo;{scenarioTitle}&rdquo;</span>
          <span className={styles.footerHint}>Esc to close</span>
        </div>

      </div>
    </div>
  );
}