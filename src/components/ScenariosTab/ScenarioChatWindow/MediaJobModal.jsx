// src/components/ScenariosTab/ScenarioChatWindow/MediaJobModal.jsx
// Download modal for audio and video ContentJobs.
// Renders when viewingJob.content_type is 'audio' or 'video'.
// ScriptViewerModal handles 'script' jobs.

import React, { useCallback, useEffect } from 'react';
import styles from './MediaJobModal.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

async function downloadJobFile(jobId, type) {
  try {
    const response = await fetch(
      `${API_BASE}/api/content/jobs/${jobId}/download-${type}`,
      { credentials: 'include' }
    );
    if (!response.ok) {
      console.error('Download failed:', response.status);
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

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function MediaJobModal({ job, scenarioTitle, onClose }) {
  if (!job) return null;

  const type     = job.content_type;
  const isAudio  = type === 'audio';
  const isVideo  = type === 'video';

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

  return (
    <div
      className={styles.overlay}
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={`${type} job details`}
    >
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerIcon}>
              {isAudio ? '🎧' : '🎬'}
            </span>
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
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <div className={styles.infoBlock}>
            <span className={styles.infoIcon}>
              {isAudio ? '🎙️' : '🎞️'}
            </span>
            <div className={styles.infoText}>
              <p className={styles.infoTitle}>
                {isAudio
                  ? 'Multi-voice audio drama'
                  : 'Scene video with character voices'}
              </p>
              <p className={styles.infoDesc}>
                {isAudio
                  ? 'Characters voiced by ElevenLabs with accent-matched profiles. '
                    + 'Download as MP3 to use in any audio player or podcast app.'
                  : 'AI-generated scene visuals combined with character audio. '
                    + 'Download as MP4 to use in your video editor or share directly.'}
              </p>
            </div>
          </div>

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
          <span className={styles.footerText}>
            Generated from &ldquo;{scenarioTitle}&rdquo;
          </span>
          <span className={styles.footerHint}>Esc to close</span>
        </div>

      </div>
    </div>
  );
}
