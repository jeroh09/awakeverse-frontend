// src/components/PodcastStudio/SourcesPanel.jsx
//
// Sources Mode — "From your docs". Redesign v3 (approved mockup):
//   • Panel headers ("Sources" / "Episode settings"), NotebookLM-calm.
//   • Solid double-ring drop area; rigid source rows (icon | name | pill | ✕)
//     that can NEVER be stretched by a long filename — names block-truncate
//     with a hover tooltip that only exists when the name actually overflows.
//   • Fixed-width status pills in the double-indigo-ring language; all
//     statuses collapse to plain words: Preparing / Ready / Failed.
//   • Speakers strip (full-width, double indigo ring) — format is shown,
//     never re-asked (it was chosen on the entry screen).
//   • Three setting cards (Conversation style / Tone / Length) — each opens
//     a centered pop-out with friendly, plain-language options.
//   • ONE action: "Write my podcast" (pen SVG — no icon libraries), with a
//     four-step live tracker. On success the page's onScriptReady moves the
//     user to Edit Lines automatically.
//
// Presentation + its own data hook (usePodcastSources) — the page stays a
// thin composer. Same modularity pattern as VoiceBrowser.jsx.
//
// Props (from PodcastStudioPage):
//   mode           'solo' | 'interview'
//   hostName       string
//   guestName      string | null
//   onScriptReady  (lines, meta) => void   — REQUIRED
//
// ONE GUEST FOR NOW — expansion notes live in podcast_generate.py.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import usePodcastSources from '../../hooks/usePodcastSources';
import styles from './SourcesPanel.module.css';

const MAX_SELECTED = 5;
const ACCEPT = '.pdf,.docx,.pptx,.txt,.md,.mp3,.m4a,.wav,.ogg,.flac,.webm,.mp4,.mov';

const KIND_ICON = {
  pdf: '📄', docx: '📝', pptx: '📊', txt: '📃',
  url: '🔗', youtube: '▶️', audio: '🎧',
};

// Backend progress notes → plain language for the row subline.
const FRIENDLY_NOTE = (note, status) => {
  if (!note) return status === 'queued' ? 'in line…' : 'reading it now…';
  if (note.startsWith('transcribing')) return "we're listening to it now…";
  if (note.includes('ledger'))         return 'noting the key points…';
  if (note.includes('extract'))        return 'reading it now…';
  return note;
};

// ── Setting definitions: friendly names ↔ backend values ────────────────────
const STYLE_OPTIONS = {
  interview: [
    { value: 'interview', name: 'Warm interview',
      desc: 'You guide with curious questions; your guest explains things clearly. The classic, friendly listen.' },
    { value: 'skeptic', name: 'Challenge the claims',
      desc: 'You push back and play devil\u2019s advocate; your guest defends every point with evidence from your sources. More tension, more engaging.' },
  ],
  solo: [
    { value: 'brief', name: 'Quick briefing',
      desc: 'Tight and direct \u2014 the key facts up front, no warm-up. Best for updates.' },
    { value: 'explainer', name: 'Clear teacher',
      desc: 'Patient and simple \u2014 one idea at a time, everyday words.' },
    { value: 'keynote', name: 'Keynote energy',
      desc: 'A rhetorical build with callbacks and a strong landing line.' },
  ],
};
const TONE_OPTIONS = [
  { value: 'clear and patient, plain everyday language', name: 'Clear teacher',
    desc: 'Patient and simple \u2014 one idea at a time, everyday words, no jargon.' },
  { value: 'light, warm and conversational',             name: 'Friendly chat',
    desc: 'Light and easygoing \u2014 like two colleagues talking over coffee.' },
  { value: 'tight, direct, numbers first',               name: 'Straight to it',
    desc: 'Tight and direct \u2014 key numbers first, zero fluff. Good for busy audiences.' },
  { value: 'energetic with light wit',                   name: 'A little playful',
    desc: 'Energetic with some personality \u2014 a touch of wit where it fits.' },
];
const LENGTH_OPTIONS = [
  { value: 1, name: 'Quick take · ~1 min', desc: 'One key idea, delivered punchy. Great for social clips.' },
  { value: 3, name: 'Standard · ~3 min',   desc: 'The sweet spot \u2014 a few connected points with room to breathe.' },
  { value: 5, name: 'Deep dive · ~5 min',  desc: 'Room to explore, compare, and challenge. Best with 2+ sources.' },
];

// Four-step tracker ← genState mapping
const STEPS = [
  { key: 'read',  label: 'Reading your sources' },
  { key: 'plan',  label: 'Planning the episode' },
  { key: 'write', label: 'Writing the conversation' },
  { key: 'check', label: 'Checking every claim' },
];
const stepIndexFor = (genState) => {
  const note = genState.progressNote || '';
  if (note.includes('grounding') || note.includes('check')) return 3;
  if (note.includes('writing') || note.includes('dialogue')) return 2;
  if (note.includes('plan')) return 1;
  return 0; // submitting / queued / just started
};

// Inline SVGs — no icon libraries.
const PenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
);
const UpIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
);
const ChevIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
);
const TickIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
);
const BubbleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);
const SlidersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4"/></svg>
);
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
);

// Backdrop image lives in public/images/ and is referenced at RUNTIME so
// webpack never tries to resolve it (CSS url() would — see the note in the
// CSS module). PUBLIC_URL keeps sub-path deployments working.
const BACKDROP_URL = `${process.env.PUBLIC_URL || ''}/images/podcast_studio_ambience.jpg`;

export default function SourcesPanel({ mode = 'interview', hostName = 'You', guestName, onScriptReady }) {
  const {
    sources, sourcesLoading, addError,
    addSourceFile, addSourceUrl, deleteSource,
    genState, generateScript, resetGeneration,
  } = usePodcastSources();

  const fileInputRef = useRef(null);
  const listRef      = useRef(null);
  const [urlValue, setUrlValue] = useState('');
  const [urlOpen, setUrlOpen]   = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [dragOver, setDragOver] = useState(false);
  const [truncated, setTruncated] = useState({}); // sourceId → bool (tooltip only when needed)

  const styleOptions = STYLE_OPTIONS[mode] || STYLE_OPTIONS.interview;
  const [style, setStyle]     = useState(styleOptions[0]);
  const [tone, setTone]       = useState(TONE_OPTIONS[0]);
  const [length, setLength]   = useState(LENGTH_OPTIONS[1]);
  const [focus, setFocus]     = useState('');
  const [modal, setModal]     = useState(null); // 'style' | 'tone' | 'length' | null

  const generating = ['submitting', 'queued', 'processing'].includes(genState.status);
  const readySelected = useMemo(
    () => [...selected].filter(id => sources.find(s => s.sourceId === id)?.status === 'ready'),
    [selected, sources]);

  // ── measured truncation: tooltip only where the name actually overflows ──
  useEffect(() => {
    const measure = () => {
      const next = {};
      listRef.current?.querySelectorAll('[data-name-for]').forEach(el => {
        next[el.dataset.nameFor] = el.scrollWidth > el.clientWidth + 1;
      });
      setTruncated(next);
    };
    const t = setTimeout(measure, 30); // after paint
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); };
  }, [sources]);

  // Esc closes the pop-out
  useEffect(() => {
    if (!modal) return;
    const onKey = (e) => { if (e.key === 'Escape') setModal(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modal]);

  // ── actions ──────────────────────────────────────────────────────────────
  const toggleSelect = useCallback((sourceId, status) => {
    if (status !== 'ready') return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(sourceId)) next.delete(sourceId);
      else if (next.size < MAX_SELECTED) next.add(sourceId);
      return next;
    });
  }, []);

  const handleFiles = useCallback(async (fileList) => {
    for (const file of Array.from(fileList || [])) {
      try { await addSourceFile(file); } catch (e) { /* addError banner shows it */ }
    }
  }, [addSourceFile]);

  const handleUrlAdd = useCallback(async () => {
    if (!urlValue.trim()) return;
    try { await addSourceUrl(urlValue); setUrlValue(''); setUrlOpen(false); }
    catch (e) { /* addError banner shows it */ }
  }, [urlValue, addSourceUrl]);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    handleFiles(e.dataTransfer?.files);
  }, [handleFiles]);

  const handleWrite = useCallback(async () => {
    if (!readySelected.length || generating) return;
    try {
      const script = await generateScript({
        sourceIds:     readySelected,
        mode,
        style:         style.value,
        lengthMinutes: length.value,
        tone:          tone.value,
        focus,
        hostName,
        guestName:     guestName || 'Guest',
      });
      onScriptReady?.(script.lines || [], {
        scriptId: script.scriptId, title: script.title, plan: script.plan,
      });
      resetGeneration();
    } catch (e) {
      console.warn('⚠️ write-my-podcast:', e.message); // genState.error renders below
    }
  }, [readySelected, generating, generateScript, mode, style, length, tone,
      focus, hostName, guestName, onScriptReady, resetGeneration]);

  // ── sub-renderers ────────────────────────────────────────────────────────
  const subline = (s) => {
    if (s.status === 'error')       return s.error || 'Something went wrong.';
    if (s.status !== 'ready')       return FRIENDLY_NOTE(s.progressNote, s.status);
    const bits = [];
    if (s.wordCount)       bits.push(`${s.wordCount.toLocaleString()} words`);
    if (s.durationSeconds) bits.push(`${Math.round(s.durationSeconds / 60)} min`);
    if (s.truncated)       bits.push('trimmed to fit');
    return bits.join(' · ') || (s.originUrl || '');
  };

  const StatusPill = ({ s }) => {
    if (s.status === 'ready') return <span className={`${styles.pill} ${styles.pillReady}`}>Ready</span>;
    if (s.status === 'error') return <span className={`${styles.pill} ${styles.pillError}`}>Failed</span>;
    return <span className={styles.pill}><span className={styles.pulseDot} aria-hidden="true" />Preparing</span>;
  };

  const stepIdx = stepIndexFor(genState);
  const modalDef = modal === 'style'
    ? { title: 'Conversation style', desc: mode === 'solo' ? 'How should you deliver it?' : 'How should the two of you talk?', options: styleOptions, current: style, set: setStyle }
    : modal === 'tone'
    ? { title: 'Tone', desc: 'The personality of the writing.', options: TONE_OPTIONS, current: tone, set: setTone }
    : modal === 'length'
    ? { title: 'Length', desc: 'How long should the episode run?', options: LENGTH_OPTIONS, current: length, set: setLength }
    : null;

  const initials = (n) => (n || 'G').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className={styles.panel}>
      {/* ambient studio still — under the ::after gradient overlay, under all content */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: `url(${BACKDROP_URL})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}
      />
      <div className={styles.grid}>

        {/* ════ SOURCES ════ */}
        <section className={`${styles.col} ${styles.colL}`} aria-label="Sources">
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Sources</h2>
            <span className={styles.panelSub}>{selected.size} of {MAX_SELECTED} picked</span>
          </div>
          <div className={styles.panelBody}>

            <div
              className={`${styles.drop} ${dragOver ? styles.dropActive : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <p className={styles.dropHint}>Add the material your episode will be built from</p>
              <div className={styles.dropBtns}>
                <button type="button" className={styles.chipBtn} onClick={() => fileInputRef.current?.click()}>
                  <UpIcon /> Upload files
                </button>
                <button type="button" className={styles.chipBtn} onClick={() => setUrlOpen(o => !o)} aria-expanded={urlOpen}>
                  🔗 Paste a link
                </button>
              </div>
              {urlOpen ? (
                <div className={styles.urlRow}>
                  <input
                    className={styles.urlInput} type="url" autoFocus
                    placeholder="https://…  (article or YouTube)"
                    value={urlValue}
                    onChange={(e) => setUrlValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleUrlAdd(); }}
                  />
                  <button type="button" className={styles.chipBtn} onClick={handleUrlAdd}>Add</button>
                </div>
              ) : null}
              <p className={styles.formats}>PDF · Word · Slides · Text · Web links · YouTube · Audio or video up to 40 min</p>
              <input ref={fileInputRef} type="file" accept={ACCEPT} multiple hidden
                onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
            </div>

            {addError ? <div className={styles.errorBanner} role="alert">{addError}</div> : null}

            {(!sources.length && !sourcesLoading) ? (
              <div className={styles.emptyLib}>
                <strong>Nothing here yet</strong>
                Add a report, a link, or a recording — it becomes the raw material for your episode.
              </div>
            ) : (
              <div className={styles.srcList} ref={listRef}>
                {sources.map(s => {
                  const isSel = selected.has(s.sourceId);
                  const selectable = s.status === 'ready';
                  return (
                    <div
                      key={s.sourceId}
                      className={`${styles.src} ${isSel ? styles.srcSel : ''} ${!selectable ? styles.srcDim : ''} ${truncated[s.sourceId] ? styles.srcTruncated : ''}`}
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
                      <span className={styles.srcIcon} aria-hidden="true">{KIND_ICON[s.kind] || '📄'}</span>
                      <span className={styles.srcCell}>
                        <span className={styles.srcTip} role="tooltip">{s.label}</span>
                        <span className={styles.srcName} data-name-for={s.sourceId}>{s.label}</span>
                        <span className={`${styles.srcMeta} ${s.status === 'error' ? styles.srcMetaErr : ''}`}>{subline(s)}</span>
                      </span>
                      <StatusPill s={s} />
                      <TickIcon className={styles.tick} />
                      <button
                        type="button" className={styles.srcDel}
                        aria-label={`Delete ${s.label}`}
                        onClick={(e) => { e.stopPropagation(); deleteSource(s.sourceId).catch(() => {}); }}
                      >✕</button>
                    </div>
                  );
                })}
              </div>
            )}

            <p className={styles.pickHint}>
              Tap a <b>Ready</b> item to pick it for this episode · your items stay saved for next time
            </p>
          </div>
        </section>

        {/* ════ EPISODE SETTINGS ════ */}
        <section className={styles.col} aria-label="Episode settings">
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Episode settings</h2>
          </div>
          <div className={styles.panelBody}>

            <div className={styles.speakers}>
              <span className={`${styles.avatarC} ${styles.avatarHost}`}>{initials(hostName) || 'You'}</span>
              {mode !== 'solo' ? (
                <span className={`${styles.avatarC} ${styles.avatarGuest}`}>{initials(guestName || 'G')}</span>
              ) : null}
              <span className={styles.spkNames}>
                <span className={styles.spkMain}>
                  {mode === 'solo' ? `${hostName} presents`
                    : `${hostName} hosts · ${guestName || 'add a guest before rendering'}`}
                </span>
                <span className={styles.spkSub}>
                  {mode === 'solo' ? 'Solo voice — one presenter' : 'Open conversation — two voices'}
                </span>
              </span>
              <span className={styles.spkTag}>chosen at the start</span>
            </div>

            <div className={styles.cards}>
              <button type="button" className={styles.setCard} onClick={() => setModal('style')}>
                <span className={styles.cardIc}><BubbleIcon /></span>
                <span className={styles.cardLbl}>Conversation style</span>
                <span className={styles.cardVal}><span className={styles.cardValTxt}>{style.name}</span> <ChevIcon /></span>
              </button>
              <button type="button" className={styles.setCard} onClick={() => setModal('tone')}>
                <span className={styles.cardIc}><SlidersIcon /></span>
                <span className={styles.cardLbl}>Tone</span>
                <span className={styles.cardVal}><span className={styles.cardValTxt}>{tone.name}</span> <ChevIcon /></span>
              </button>
              <button type="button" className={styles.setCard} onClick={() => setModal('length')}>
                <span className={styles.cardIc}><ClockIcon /></span>
                <span className={styles.cardLbl}>Length</span>
                <span className={styles.cardVal}><span className={styles.cardValTxt}>{length.name}</span> <ChevIcon /></span>
              </button>
            </div>

            <p className={styles.fieldLabel}>Anything specific? <span className={styles.optional}>— optional, one sentence</span></p>
            <input
              className={styles.focusInput} type="text" maxLength={400}
              placeholder="e.g. Focus on the zero-trust migration, skip the appendix"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
            />

            <p className={styles.receipt}>
              <span className={styles.receiptQ} aria-hidden="true">❝</span>
              Every factual line arrives wearing a small receipt, like{' '}
              <span className={styles.rchip}>❝ whitepaper · p.4</span> — tap it in the editor to read the exact passage.
            </p>

            {genState.error ? <div className={styles.errorBanner} role="alert">{genState.error}</div> : null}
          </div>
        </section>
      </div>

      {/* ════ THE ONE ACTION ════ */}
      <div className={styles.foot}>
        {generating ? (
          <div className={styles.steps} role="status" aria-live="polite">
            {STEPS.map((st, i) => (
              <span key={st.key}
                className={`${styles.step} ${i < stepIdx ? styles.stepDone : i === stepIdx ? styles.stepDoing : ''}`}>
                <span className={styles.stepB}>{i < stepIdx ? '✓' : ''}</span>
                {st.label}
              </span>
            ))}
          </div>
        ) : (
          <p className={styles.footHint}>
            {readySelected.length
              ? <>Writes your full podcast script from the {readySelected.length} picked source{readySelected.length > 1 ? 's' : ''} — then opens it in <b>Edit Lines</b> automatically.</>
              : 'Pick at least one Ready item on the left.'}
          </p>
        )}
        <button
          type="button" className={styles.writeBtn}
          disabled={!readySelected.length || generating}
          onClick={handleWrite}
        >
          <PenIcon /> {generating ? 'Writing…' : 'Write my podcast'}
        </button>
      </div>

      {/* ════ CENTRAL POP-OUT ════ */}
      {modalDef ? (
        <div className={styles.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label={modalDef.title}>
            <div className={styles.mHead}>
              <span>
                <h3 className={styles.mTitle}>{modalDef.title}</h3>
                <p className={styles.mDesc}>{modalDef.desc}</p>
              </span>
              <button type="button" className={styles.mClose} aria-label="Close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className={styles.mBody}>
              {modalDef.options.map(o => (
                <button
                  key={o.name} type="button"
                  className={`${styles.optRow} ${modalDef.current.name === o.name ? styles.optRowOn : ''}`}
                  onClick={() => modalDef.set(o)}
                >
                  <span className={styles.radio} aria-hidden="true" />
                  <span>
                    <span className={styles.optName}>{o.name}</span>
                    <span className={styles.optDesc}>{o.desc}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className={styles.mFoot}>
              <button type="button" className={styles.doneBtn} onClick={() => setModal(null)}>Done</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}