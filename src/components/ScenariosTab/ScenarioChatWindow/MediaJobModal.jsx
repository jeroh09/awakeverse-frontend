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
            <span className={styles.headerIcon}>{isAudio ? '🎧' : '🎬'}</span>
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
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>

          {/* Preview button — before load */}
          {!previewUrl && !previewLoading && !previewError && (
            <button className={styles.previewButton} onClick={handlePreview}>
              <span className={styles.previewIcon}>{isAudio ? '🔊' : '▶'}</span>
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
              <span className={styles.infoIcon}>{isAudio ? '🎙️' : '🎞️'}</span>
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
                <span className={styles.downloadIcon}>⬇</span>
                Download MP3
              </button>
            )}
            {isVideo && (
              <>
                <button
                  className={styles.downloadButton}
                  onClick={() => downloadJobFile(job.id, 'video')}
                >
                  <span className={styles.downloadIcon}>⬇</span>
                  Download MP4
                </button>
                {job.audio_url && (
                  <button
                    className={`${styles.downloadButton} ${styles.downloadButtonSecondary}`}
                    onClick={() => downloadJobFile(job.id, 'audio')}
                  >
                    <span className={styles.downloadIcon}>⬇</span>
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