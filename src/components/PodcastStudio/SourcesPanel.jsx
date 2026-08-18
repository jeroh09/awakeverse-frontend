// src/components/PodcastStudio/SourcesPanel.jsx
//
// Sources Mode view — the entire "From your docs" surface, rendered by
// PodcastStudioPage when scriptMode === 'sources'. PRESENTATION + its own
// data hook (usePodcastSources); the page stays a thin composer.
//
// Same modularity pattern as VoiceBrowser.jsx: self-contained component,
// self-contained CSS module (own tokens), page passes context down.
//
// Props (all from PodcastStudioPage):
//   mode           'solo' | 'interview'   — from podcastMode (the segue choice;
//                                           format is NOT re-chosen here)
//   hostName       string                 — context?.user?.displayName || 'You'
//   guestName      string | null          — first guest's displayName, if any
//   onScriptReady  (lines, meta) => void  — REQUIRED. Receives generated lines
//                                           [{speaker:'host'|'guest', text, citations[]}]
//                                           + meta {scriptId, title, plan}.
//                                           Page maps speakers → speakerIds,
//                                           dispatchLines SET, setScriptMode('lines').
//
// ONE GUEST FOR NOW: generation emits a single GUEST voice. See the
// multi-guest expansion notes in podcast_generate.py before adding GUEST2.

import React, { useCallback, useRef, useState } from 'react';
import usePodcastSources from '../../hooks/usePodcastSources';
import styles from './SourcesPanel.module.css';

const MAX_SELECTED = 5;

const ACCEPT = '.pdf,.docx,.pptx,.txt,.md,.mp3,.m4a,.wav,.ogg,.flac,.webm,.mp4,.mov';

const KIND_ICON = {
  pdf: '📄', docx: '📝', pptx: '📊', txt: '📃',
  url: '🔗', youtube: '▶️', audio: '🎧',
};

const STYLES_BY_MODE = {
  solo:      [['brief', 'Brief'], ['explainer', 'Explainer'], ['keynote', 'Keynote']],
  interview: [['interview', 'Interview'], ['skeptic', 'Skeptic']],
};

const LENGTHS = [[1, '~1 min'], [3, '~3 min'], [5, '~5 min']];
const TONES   = ['Explainer', 'Conversational', 'Executive', 'Playful'];

export default function SourcesPanel({ mode = 'interview', hostName = 'You', guestName, onScriptReady }) {
  const {
    sources, sourcesLoading, addError,
    addSourceFile, addSourceUrl, deleteSource,
    genState, generateScript, resetGeneration,
  } = usePodcastSources();

  const fileInputRef = useRef(null);
  const [urlValue, setUrlValue]   = useState('');
  const [urlOpen, setUrlOpen]     = useState(false);
  const [selected, setSelected]   = useState(new Set()); // sourceIds picked for this episode
  const [style, setStyle]         = useState(STYLES_BY_MODE[mode]?.[0]?.[0] || 'interview');
  const [minutes, setMinutes]     = useState(3);
  const [tone, setTone]           = useState('Explainer');
  const [focus, setFocus]         = useState('');
  const [dragOver, setDragOver]   = useState(false);

  const generating = genState.status === 'submitting'
    || genState.status === 'queued' || genState.status === 'processing';

  const readySelected = [...selected].filter(id =>
    sources.find(s => s.sourceId === id)?.status === 'ready');

  // ── Selection ─────────────────────────────────────────────────────────────

  const toggleSelect = useCallback((sourceId, status) => {
    if (status !== 'ready') return; // only ready sources feed an episode
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(sourceId)) next.delete(sourceId);
      else if (next.size < MAX_SELECTED) next.add(sourceId);
      return next;
    });
  }, []);

  // ── Add sources ───────────────────────────────────────────────────────────

  const handleFiles = useCallback(async (fileList) => {
    for (const file of Array.from(fileList || [])) {
      try {
        const src = await addSourceFile(file);
        // Auto-select new sources once ready is a nicety too far — select on
        // click keeps intent explicit. But queue them visibly at the top.
        void src;
      } catch (e) { /* addError banner shows it */ }
    }
  }, [addSourceFile]);

  const handleUrlAdd = useCallback(async () => {
    if (!urlValue.trim()) return;
    try {
      await addSourceUrl(urlValue);
      setUrlValue('');
      setUrlOpen(false);
    } catch (e) { /* addError banner shows it */ }
  }, [urlValue, addSourceUrl]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer?.files);
  }, [handleFiles]);

  // ── Generate ──────────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!readySelected.length || generating) return;
    try {
      const script = await generateScript({
        sourceIds:     readySelected,
        mode,
        style,
        lengthMinutes: minutes,
        tone,
        focus,
        hostName,
        guestName:     guestName || 'Guest',
      });
      onScriptReady?.(script.lines || [], {
        scriptId: script.scriptId,
        title:    script.title,
        plan:     script.plan,
      });
      resetGeneration();
    } catch (e) {
      // genState.error renders in the panel — nothing else to do here
      console.warn('⚠️ generate-from-sources:', e.message);
    }
  }, [readySelected, generating, generateScript, mode, style, minutes, tone,
      focus, hostName, guestName, onScriptReady, resetGeneration]);

  // ── Render ────────────────────────────────────────────────────────────────

  const StatusChip = ({ s }) => {
    if (s.status === 'ready')
      return <span className={`${styles.chip} ${styles.chipReady}`}>Ready</span>;
    if (s.status === 'error')
      return <span className={`${styles.chip} ${styles.chipError}`}>Failed</span>;
    return (
      <span className={`${styles.chip} ${styles.chipPending}`}>
        <span className={styles.pulse} aria-hidden="true" />
        {s.progressNote || (s.status === 'queued' ? 'Queued' : 'Processing')}
      </span>
    );
  };

  const subline = (s) => {
    if (s.status === 'error') return s.error || 'Something went wrong.';
    const bits = [];
    if (s.wordCount) bits.push(`${s.wordCount.toLocaleString()} words`);
    if (s.durationSeconds) bits.push(`${Math.round(s.durationSeconds / 60)} min`);
    if (s.truncated) bits.push('trimmed to cap');
    return bits.join(' · ') || (s.originUrl || '');
  };

  return (
    <div className={styles.panel}>

      {/* ── Sources column ── */}
      <section className={styles.col} aria-label="Sources">
        <div className={styles.colHead}>
          <span className={styles.colTitle}>Sources</span>
          <span className={styles.colCount}>{selected.size} of {MAX_SELECTED} selected</span>
        </div>

        {addError ? <div className={styles.errorBanner} role="alert">{addError}</div> : null}

        <div className={styles.list}>
          {sourcesLoading && !sources.length ? (
            <div className={styles.empty}>Loading your library…</div>
          ) : !sources.length ? (
            <div className={styles.empty}>
              <strong>No sources yet</strong>
              Add a report, article link, or recording — we'll turn it into your episode.
            </div>
          ) : (
            sources.map(s => {
              const isSel = selected.has(s.sourceId);
              const selectable = s.status === 'ready';
              return (
                <div
                  key={s.sourceId}
                  className={`${styles.sourceRow} ${isSel ? styles.sourceRowSel : ''} ${!selectable ? styles.sourceRowDim : ''}`}
                  role="checkbox"
                  aria-checked={isSel}
                  aria-disabled={!selectable}
                  tabIndex={selectable ? 0 : -1}
                  onClick={() => toggleSelect(s.sourceId, s.status)}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleSelect(s.sourceId, s.status); }
                  }}
                >
                  <span className={styles.kindIcon} aria-hidden="true">{KIND_ICON[s.kind] || '📄'}</span>
                  <div className={styles.sourceMeta}>
                    <div className={styles.sourceLabel}>{s.label}</div>
                    <div className={`${styles.sourceSub} ${s.status === 'error' ? styles.sourceSubErr : ''}`}>
                      {subline(s)}
                    </div>
                  </div>
                  <StatusChip s={s} />
                  <button
                    type="button"
                    className={styles.rowDelete}
                    aria-label={`Delete ${s.label}`}
                    onClick={(e) => { e.stopPropagation(); deleteSource(s.sourceId).catch(() => {}); }}
                  >✕</button>
                </div>
              );
            })
          )}
        </div>

        <div
          className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <p className={styles.dropHint}>Drop files here, or</p>
          <div className={styles.dropBtns}>
            <button type="button" className={styles.actionChip}
              onClick={() => fileInputRef.current?.click()}>⬆ Upload</button>
            <button type="button" className={styles.actionChip}
              onClick={() => setUrlOpen(o => !o)} aria-expanded={urlOpen}>🔗 Paste URL</button>
          </div>
          {urlOpen ? (
            <div className={styles.urlRow}>
              <input
                className={styles.urlInput}
                type="url"
                placeholder="https://…  (article or YouTube)"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleUrlAdd(); }}
              />
              <button type="button" className={styles.actionChip} onClick={handleUrlAdd}>Add</button>
            </div>
          ) : null}
          <p className={styles.dropFormats}>PDF · DOCX · PPTX · TXT · URL · YouTube · audio/video up to 40 min</p>
          <input ref={fileInputRef} type="file" accept={ACCEPT} multiple hidden
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
        </div>
      </section>

      {/* ── Settings column ── */}
      <section className={styles.col} aria-label="Episode settings">
        <div className={styles.colHead}>
          <span className={styles.colTitle}>Episode settings</span>
        </div>

        <div className={styles.formatRow}>
          <span className={styles.formatIcon} aria-hidden="true">{mode === 'solo' ? '🎙' : '🎤'}</span>
          <div className={styles.formatMeta}>
            <div className={styles.formatName}>{mode === 'solo' ? 'Solo voice' : 'Open conversation'}</div>
            <div className={styles.formatSub}>
              {mode === 'solo' ? `${hostName} presents` : `${hostName} hosts · ${guestName || 'add a guest before rendering'}`}
            </div>
          </div>
          <span className={styles.formatTag}>from your format</span>
        </div>

        <p className={styles.fieldLabel}>Style</p>
        <div className={styles.pillRow} role="radiogroup" aria-label="Script style">
          {(STYLES_BY_MODE[mode] || []).map(([val, label]) => (
            <button key={val} type="button" role="radio" aria-checked={style === val}
              className={styles.pill} onClick={() => setStyle(val)}>{label}</button>
          ))}
        </div>

        <div className={styles.twoCol}>
          <div>
            <p className={styles.fieldLabel}>Length</p>
            <div className={styles.pillRow} role="radiogroup" aria-label="Episode length">
              {LENGTHS.map(([val, label]) => (
                <button key={val} type="button" role="radio" aria-checked={minutes === val}
                  className={styles.pill} onClick={() => setMinutes(val)}>{label}</button>
              ))}
            </div>
          </div>
          <div>
            <p className={styles.fieldLabel}>Tone</p>
            <select className={styles.select} value={tone} onChange={(e) => setTone(e.target.value)}>
              {TONES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <p className={styles.fieldLabel}>Focus <span className={styles.optional}>(optional)</span></p>
        <input
          className={styles.focusInput}
          type="text"
          maxLength={400}
          placeholder="e.g. Focus on chapter 3, skip the appendix"
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
        />

        <p className={styles.citationNote}>
          <span aria-hidden="true">❝</span> Factual lines carry citations back to your sources —
          tap a chip in the editor to see the passage.
        </p>

        {genState.error ? <div className={styles.errorBanner} role="alert">{genState.error}</div> : null}

        <div className={styles.generateRow}>
          {generating ? (
            <div className={styles.progressLine} role="status" aria-live="polite">
              <span className={styles.pulse} aria-hidden="true" />
              {genState.status === 'submitting' ? 'Submitting…'
                : genState.status === 'queued' ? 'Waiting for a worker…'
                : (genState.progressNote || 'Working…')}
              <span className={styles.progressHint}>usually under a minute, occasionally a few</span>
            </div>
          ) : (
            <p className={styles.generateHint}>
              {readySelected.length
                ? `Generates a script from ${readySelected.length} source${readySelected.length > 1 ? 's' : ''} → lands in Write Lines`
                : 'Select at least one ready source'}
            </p>
          )}
          <button
            type="button"
            className={styles.generateBtn}
            disabled={!readySelected.length || generating}
            onClick={handleGenerate}
          >
            ✨ Generate script
          </button>
        </div>
      </section>
    </div>
  );
}