// src/components/ScenariosTab/ScenarioChatWindow/ScriptViewerModal.jsx
// 80% viewport modal overlaying the full chat window.
// Renders at ScenarioChatWindow level — above everything.

import React, { useEffect, useCallback } from 'react';
import styles from './ScriptViewerModal.module.css';

export default function ScriptViewerModal({ job, scenarioTitle, onClose }) {
  if (!job) return null;

  const script    = job.condensed_script || '';
  const charCount = job.char_count       || script.length;
  const duration  = job.duration_seconds || 180;
  const type      = job.content_type     || 'script';

  // ── Close on Escape ──────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Copy to clipboard ────────────────────────────────────────────────────
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      // Brief visual feedback handled by CSS :active
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = script;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  };

  // ── Download as .txt ────────────────────────────────────────────────────
  const handleDownload = () => {
    const filename = `${scenarioTitle || 'screenplay'}_${duration}s.txt`
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_\.]/g, '');

    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Backdrop click to close ──────────────────────────────────────────────
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className={styles.overlay}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={`${type} viewer`}
    >
      <div className={styles.modal}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerIcon}>📄</span>
            <div>
              <h2 className={styles.headerTitle}>{scenarioTitle}</h2>
              <p className={styles.headerMeta}>
                Screenplay · {duration}s · {charCount >= 1000
                  ? `${(charCount / 1000).toFixed(1)}k chars`
                  : `${charCount} chars`}
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              className={styles.actionButton}
              onClick={handleCopy}
              title="Copy to clipboard"
              aria-label="Copy script"
            >
              Copy
            </button>
            <button
              className={styles.actionButton}
              onClick={handleDownload}
              title="Download as .txt"
              aria-label="Download script"
            >
              Download
            </button>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close viewer"
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Script body ─────────────────────────────────────────────── */}
        <div className={styles.body}>
          <pre className={styles.scriptText}>{script}</pre>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className={styles.footer}>
          <span className={styles.footerText}>
            Generated from &ldquo;{scenarioTitle}&rdquo; &middot; {duration}s
          </span>
          <span className={styles.footerHint}>Press Esc to close</span>
        </div>

      </div>
    </div>
  );
}