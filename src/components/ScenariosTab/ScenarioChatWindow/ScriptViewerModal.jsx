// src/components/ScenariosTab/ScenarioChatWindow/ScriptViewerModal.jsx
// UPDATED: full-page view — no overlay wrapper. Root div IS the page.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import useCredits from '../../../hooks/useCredits';
import styles from './ScriptViewerModal.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

const VIDEO_STYLES = [
  { id: 'realistic',  label: 'Realistic' },
  { id: 'anime',      label: 'Anime' },
  { id: 'cartoon',    label: 'Cartoon' },
  { id: 'comic_book', label: 'Comic' },
];

export default function ScriptViewerModal({ job, scenarioTitle, onClose, onJobUpdated, onRenderVideo, hasPoster = false }) {
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

  // ── Render-video state ────────────────────────────────────────────────────
  const [videoStyle,   setVideoStyle]   = useState(job.video_style || 'realistic');
  const [isRendering,  setIsRendering]  = useState(false);
  const [includeIntro, setIncludeIntro] = useState(hasPoster);
  const [includeOutro, setIncludeOutro] = useState(true);

  // ── Render cost (video is priced by duration tier: 60/120/180 → 360/680/1000).
  // Exact price, so we can gate the button on affordability and offer a top-up path
  // rather than let a click 402 behind this full-page modal.
  const credits = useCredits();
  const [sceneCost, setSceneCost] = useState(null);   // { price, affordable, ... }
  useEffect(() => {
    const tier = duration <= 60 ? '60' : duration <= 120 ? '120' : '180';
    credits.priceFor('video', tier).then(setSceneCost);
  }, [duration, credits.balance]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setEditedScript(job.condensed_script || '');
    }
  }, [job.condensed_script, isEditing]);

  useEffect(() => {
    setVideoStyle(job.video_style || 'realistic');
  }, [job.id, job.video_style]);

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

      if (onJobUpdated) onJobUpdated(data);
      console.log(`✏️ Script saved: job ${job.id}, ${data.char_count} chars`);

    } catch (error) {
      console.error('❌ Save failed:', error);
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRenderVideo = async () => {
    if (!onRenderVideo || isRendering) return;
    setIsRendering(true);
    try {
      await onRenderVideo(videoStyle, includeIntro, includeOutro);
    } catch (e) {
      console.error('❌ Render video failed:', e);
      setIsRendering(false);
    }
  };

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

  const handleDownload = () => {
    const content  = job.condensed_script || '';
    const filename = `${scenarioTitle || 'screenplay'}_${duration}s.txt`
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_\.]/g, '');

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

  const displayCharCount = isEditing ? editedScript.length : charCount;

  // ── Poster: image viewer ───────────────────────────────────────────────
  if (job.content_type === 'poster') {
    return (
      <div className={styles.page} role="main" aria-label="Poster viewer">
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerIcon}>🖼️</span>
            <div>
              <h2 className={styles.headerTitle}>{scenarioTitle}</h2>
              <p className={styles.headerMeta}>Poster · {job.video_style || 'realistic'}</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <a
              className={styles.actionButton}
              href={job.output_url}
              target="_blank"
              rel="noreferrer"
              download
              title="Download poster"
            >
              Download
            </a>
            <button className={styles.closeButton} onClick={onClose} aria-label="Back">
              ✕
            </button>
          </div>
        </div>
        <div className={styles.body} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={job.output_url}
            alt={`${scenarioTitle} poster`}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }}
          />
        </div>
      </div>
    );
  }

  // ── Script viewer / editor ─────────────────────────────────────────────
  return (
    <div className={styles.page} role="main" aria-label="Script viewer">

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
              {isEditing && <span className={styles.editingBadge}>editing</span>}
              {saveSuccess && <span className={styles.savedBadge}>✓ saved</span>}
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          {!isEditing ? (
            <>
              <button className={styles.actionButton} onClick={handleEdit} title="Edit script">
                ✏️ Edit
              </button>
              <button className={styles.actionButton} onClick={handleCopy} title="Copy to clipboard">
                Copy
              </button>
              <button className={styles.actionButton} onClick={handleDownload} title="Download as .txt">
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
            aria-label={isEditing ? 'Discard and close' : 'Back to chat'}
            title={isEditing ? 'Discard and close' : 'Back (Esc)'}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Save error ──────────────────────────────────────────── */}
      {saveError && (
        <div className={styles.saveError}>⚠️ {saveError}</div>
      )}

      {/* ── Body ────────────────────────────────────────────────── */}
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

      {/* ── Render bar ──────────────────────────────────────────── */}
      {!isEditing && onRenderVideo && (job.condensed_script || '').trim() && (
        <div className={styles.renderBar}>
          <div className={styles.renderStyles}>
            <span className={styles.renderLabel}>Visual style</span>
            <div className={styles.styleGrid}>
              {VIDEO_STYLES.map(s => (
                <button
                  key={s.id}
                  type="button"
                  className={[
                    styles.styleButton,
                    videoStyle === s.id ? styles.styleButtonActive : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setVideoStyle(s.id)}
                  aria-pressed={videoStyle === s.id}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <label className={styles.introToggle}>
            <input
              type="checkbox"
              checked={includeIntro}
              onChange={(e) => setIncludeIntro(e.target.checked)}
            />
            <span>
              Branded intro
              <small>{hasPoster ? 'opens with your poster' : 'generates a wide title card'}</small>
            </span>
          </label>

          <label className={styles.introToggle}>
            <input
              type="checkbox"
              checked={includeOutro}
              onChange={(e) => setIncludeOutro(e.target.checked)}
            />
            <span>
              Credits
              <small>closes with the cast</small>
            </span>
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
            {sceneCost && (
              <span style={{
                fontFamily: "'Inter', system-ui, sans-serif", fontSize: '0.68rem',
                fontWeight: 600, whiteSpace: 'nowrap',
                color: sceneCost.affordable === false ? '#F59E0B' : '#818CF8',
              }}>
                ~{Number(sceneCost.price).toLocaleString()} credits
                {credits.balance != null && ` · ${Number(credits.balance).toLocaleString()} left`}
                {sceneCost.affordable === false && (
                  <>{' · '}
                    <span
                      onClick={() => { window.location.href = '/billing'; }}
                      style={{ textDecoration: 'underline', cursor: 'pointer' }}
                    >Top up</span>
                  </>
                )}
              </span>
            )}
            <button
              className={styles.renderButton}
              onClick={handleRenderVideo}
              disabled={isRendering || sceneCost?.affordable === false}
              title={sceneCost?.affordable === false
                ? 'Not enough credits — top up to render'
                : 'Generate the video from this screenplay'}
            >
              {isRendering ? 'Starting…' : '▶  Render Video'}
            </button>
          </div>


        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className={styles.footer}>
        <span className={styles.footerText}>
          {isEditing
            ? 'Editing — changes are not saved until you click Save'
            : `"${scenarioTitle}" · ${duration}s · Fountain format`}
        </span>
        <span className={styles.footerHint}>
          {isEditing ? 'Esc to cancel' : 'Esc to go back'}
        </span>
      </div>

    </div>
  );
}