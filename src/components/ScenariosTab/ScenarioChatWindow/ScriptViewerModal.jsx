// src/components/ScenariosTab/ScenarioChatWindow/ScriptViewerModal.jsx
// UPDATED: adds edit mode — toggle view/textarea, Save calls PATCH endpoint.
// Full replacement of previous ScriptViewerModal.jsx.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './ScriptViewerModal.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

export default function ScriptViewerModal({ job, scenarioTitle, onClose, onJobUpdated }) {
  if (!job) return null;

  const script    = job.condensed_script || '';
  const charCount = job.char_count       || script.length;
  const duration  = job.duration_seconds || 180;
  const type      = job.content_type     || 'script';

  // ── Edit state ──────────────────────────────────────────────────────────
  const [isEditing,    setIsEditing]    = useState(false);
  const [editedScript, setEditedScript] = useState(script);
  const [isSaving,     setIsSaving]     = useState(false);
  const [saveError,    setSaveError]    = useState(null);
  const [saveSuccess,  setSaveSuccess]  = useState(false);
  const textareaRef = useRef(null);

  // Focus textarea on edit mode entry
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // Keep editedScript in sync if job prop changes (e.g. after save)
  useEffect(() => {
    setEditedScript(job.condensed_script || '');
  }, [job.condensed_script]);

  // ── Escape key ──────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      if (isEditing) {
        handleCancelEdit();
      } else {
        onClose();
      }
    }
  }, [isEditing, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Edit handlers ───────────────────────────────────────────────────────
  const handleEdit = () => {
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedScript(job.condensed_script || '');
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    const trimmed = editedScript.trim();
    if (!trimmed) return;

    const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(`${API_BASE}/api/content/jobs/${job.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf,
        },
        credentials: 'include',
        body: JSON.stringify({ condensed_script: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Save failed: ${response.status}`);
      }

      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 2500);

      // Notify parent to refresh jobs list
      if (onJobUpdated) onJobUpdated(data);

      console.log(`✏️ Script saved: job ${job.id}, ${data.char_count} chars`);

    } catch (error) {
      console.error('❌ Save failed:', error);
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Copy ────────────────────────────────────────────────────────────────
  const handleCopy = async () => {
    const content = isEditing ? editedScript : (job.condensed_script || '');
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const el = document.createElement('textarea');
      el.value = content;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  };

  // ── Download ────────────────────────────────────────────────────────────
  const handleDownload = () => {
    const content  = job.condensed_script || '';
    const filename = `${scenarioTitle || 'screenplay'}_${duration}s.txt`
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_\.]/g, '');

    // Prepend Fountain identifier comment for users who want to rename to .fountain
    const exportContent =
      `# ${scenarioTitle} — ${duration}s Screenplay\n` +
      `# Fountain format — rename to .fountain to import into Final Draft, Highland, WriterDuet\n\n` +
      content;

    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Backdrop ────────────────────────────────────────────────────────────
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isEditing) onClose();
  };

  // ── Live char count ─────────────────────────────────────────────────────
  const displayCharCount = isEditing
    ? editedScript.length
    : charCount;

  return (
    <div
      className={styles.overlay}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Script viewer"
    >
      <div className={styles.modal}>

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerIcon}>📄</span>
            <div>
              <h2 className={styles.headerTitle}>{scenarioTitle}</h2>
              <p className={styles.headerMeta}>
                Fountain screenplay · {duration}s ·{' '}
                {displayCharCount >= 1000
                  ? `${(displayCharCount / 1000).toFixed(1)}k chars`
                  : `${displayCharCount} chars`}
                {isEditing && (
                  <span className={styles.editingBadge}>editing</span>
                )}
                {saveSuccess && (
                  <span className={styles.savedBadge}>✓ saved</span>
                )}
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            {!isEditing ? (
              <>
                <button
                  className={styles.actionButton}
                  onClick={handleEdit}
                  title="Edit script"
                >
                  ✏️ Edit
                </button>
                <button
                  className={styles.actionButton}
                  onClick={handleCopy}
                  title="Copy to clipboard"
                >
                  Copy
                </button>
                <button
                  className={styles.actionButton}
                  onClick={handleDownload}
                  title="Download as .txt"
                >
                  Download
                </button>
              </>
            ) : (
              <>
                <button
                  className={styles.saveButton}
                  onClick={handleSave}
                  disabled={isSaving || !editedScript.trim()}
                  title="Save edits"
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </button>
                <button
                  className={styles.actionButton}
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  title="Discard edits"
                >
                  Cancel
                </button>
              </>
            )}
            <button
              className={styles.closeButton}
              onClick={isEditing ? handleCancelEdit : onClose}
              aria-label="Close viewer"
              title={isEditing ? 'Discard and close' : 'Close (Esc)'}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Save error ──────────────────────────────────────────── */}
        {saveError && (
          <div className={styles.saveError}>
            ⚠️ {saveError}
          </div>
        )}

        {/* ── Body: view or edit ──────────────────────────────────── */}
        <div className={styles.body}>
          {isEditing ? (
            <textarea
              ref={textareaRef}
              className={styles.editTextarea}
              value={editedScript}
              onChange={(e) => setEditedScript(e.target.value)}
              spellCheck={false}
              aria-label="Edit screenplay"
            />
          ) : (
            <pre className={styles.scriptText}>
              {job.condensed_script || ''}
            </pre>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className={styles.footer}>
          <span className={styles.footerText}>
            {isEditing
              ? 'Editing — changes are not saved until you click Save'
              : `"${scenarioTitle}" · ${duration}s · Fountain format`}
          </span>
          <span className={styles.footerHint}>
            {isEditing ? 'Esc to cancel' : 'Esc to close'}
          </span>
        </div>

      </div>
    </div>
  );
}