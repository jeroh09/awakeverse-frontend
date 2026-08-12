// src/components/PodcastStudio/VoiceBrowser.jsx
//
// Tall, accessible voice-browser overlay. This is PRESENTATION ONLY — it reuses
// the page's existing handlers and data, and changes none of the original logic:
//
//   • selecting a voice        → onSelect(speakerId, voiceId)   (= handleSelectVoice)
//   • previewing a voice       → onPreview(voiceId, previewUrl) (= handlePlayPreview)
//   • the "My Voice" clone     → sourced from voiceClone, selected via onSelect
//   • recording / re-recording → onCloneRecord()                (= handleCloneRecord)
//
// It manages ONLY its own transient filter state (search / gender / accent),
// which resets every time it opens (per product decision). The library list is
// filtered exactly like the old grid was — voices.filter by gender — plus the
// new search + accent. The clone (gender "neutral", isClone) is rendered in the
// pinned "Your voice" group and, as before, is never part of the gendered grid.
//
// Open/close is driven by the parent: pass `speaker` to open, null to close.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './VoiceBrowser.module.css';

export default function VoiceBrowser({
  speaker,                 // speaker object to pick for, or null/undefined = closed
  voices = [],             // from usePodcastStudio (includes clone as isClone)
  voiceClone,              // { voiceId, cloneName } | null
  playingPreviewId,
  onPreview,               // (voiceId, previewUrl) => void
  onSelect,                // (speakerId, voiceId) => void
  onClose,                 // () => void
  // recorder passthrough (same objects the page already owns)
  cloningVoice,
  cloneRecSeconds = 0,
  cloneSubmitting,
  cloneError,
  onCloneRecord,
}) {
  const open = !!speaker;
  const [q, setQ] = useState('');
  const [gender, setGender] = useState('female');
  const [accent, setAccent] = useState('all');

  const searchRef = useRef(null);
  const dialogRef = useRef(null);
  const restoreFocusRef = useRef(null);

  const isHost = speaker?.role === 'host' || speaker?.speakerId === 'user';

  // Reset filters every open (decision: fresh each speaker) + focus search.
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement;
    setQ('');
    setAccent('all');
    setGender(speaker?.gender === 'male' ? 'male' : 'female');
    const t = setTimeout(() => searchRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open, speaker]);

  const handleClose = useCallback(() => {
    onClose?.();
    const el = restoreFocusRef.current;
    if (el && typeof el.focus === 'function') setTimeout(() => el.focus(), 0);
  }, [onClose]);

  // Esc to close + basic focus trap while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); handleClose(); return; }
      if (e.key !== 'Tab') return;
      const root = dialogRef.current;
      if (!root) return;
      const f = [...root.querySelectorAll('button,input,[tabindex]:not([tabindex="-1"])')]
        .filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  // Distinct accents for the chip strip (library voices only, current gender).
  const accents = useMemo(() => {
    const set = new Set(
      voices.filter(v => !v.isClone && v.gender === gender).map(v => v.accent).filter(Boolean)
    );
    return [...set].sort();
  }, [voices, gender]);

  const accentCount = (a) =>
    voices.filter(v => !v.isClone && v.gender === gender && v.accent === a).length;

  // Same base filter as the old grid (gender), plus accent + free-text search.
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return voices.filter(v => {
      if (v.isClone) return false;
      if (v.gender !== gender) return false;
      if (accent !== 'all' && v.accent !== accent) return false;
      if (needle) {
        const hay = `${v.displayName} ${v.accent} ${v.vibe || ''}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [voices, gender, accent, q]);

  if (!open) return null;

  const selectedId = speaker.voiceId;
  const pick = (voiceId) => { onSelect?.(speaker.speakerId, voiceId); handleClose(); };

  const Wave = () => (
    <span className={styles.wave} aria-hidden="true"><span /><span /><span /><span /></span>
  );

  const VoiceCard = ({ v }) => {
    const checked = selectedId === v.voiceId;
    const playing = playingPreviewId === v.voiceId;
    return (
      <div
        className={styles.voiceCard}
        role="radio"
        aria-checked={checked}
        tabIndex={checked ? 0 : -1}
        onClick={(e) => { if (e.target.closest(`.${styles.previewBtn}`)) return; pick(v.voiceId); }}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pick(v.voiceId); }
        }}
      >
        <div className={styles.vMeta}>
          <div className={styles.vName}>{v.displayName}</div>
          <div className={styles.vSub}>{v.accent}<span className={styles.dot}>·</span>{v.gender}</div>
          {v.vibe ? <div className={styles.vVibe}>{v.vibe}</div> : null}
        </div>
        {v.previewUrl ? (
          <button
            type="button"
            className={styles.previewBtn}
            aria-label={`Preview ${v.displayName}`}
            aria-pressed={playing}
            onClick={(e) => { e.stopPropagation(); onPreview?.(v.voiceId, v.previewUrl); }}
          >
            <Wave />
          </button>
        ) : null}
        {checked ? (
          <svg className={styles.checkTick} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
        ) : null}
      </div>
    );
  };

  return (
    <div className={styles.backdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className={styles.browser} role="dialog" aria-modal="true" aria-labelledby="vbTitle" ref={dialogRef}>
        <div className={styles.head}>
          <div className={styles.title} id="vbTitle">
            Choose a voice
            <small>for {speaker.displayName || speaker.speakerId}</small>
          </div>
          <button type="button" className={styles.close} aria-label="Close voice browser" onClick={handleClose}>✕</button>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrap} role="search">
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            <label htmlFor="vbSearch" className={styles.srOnly}>Search voices by name, accent, or style</label>
            <input
              id="vbSearch"
              ref={searchRef}
              className={styles.search}
              type="search"
              autoComplete="off"
              placeholder="Search name, accent, or style…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-describedby="vbCount"
            />
            {q ? (
              <button type="button" className={styles.clearBtn} aria-label="Clear search" onClick={() => { setQ(''); searchRef.current?.focus(); }}>✕</button>
            ) : null}
          </div>

          <div className={styles.segmented} role="radiogroup" aria-label="Filter by gender">
            {['female', 'male'].map(g => (
              <button
                key={g}
                type="button"
                role="radio"
                aria-checked={gender === g}
                className={styles.seg}
                onClick={() => { setGender(g); setAccent('all'); }}
              >
                {g === 'female' ? '♀ Female' : '♂ Male'}
              </button>
            ))}
          </div>

          <div className={styles.chipScroll} role="group" aria-label="Filter by accent">
            <button type="button" role="checkbox" aria-checked={accent === 'all'}
              className={styles.chip} onClick={() => setAccent('all')}>All</button>
            {accents.map(a => (
              <button key={a} type="button" role="checkbox" aria-checked={accent === a}
                className={styles.chip} onClick={() => setAccent(a)}>
                {a}<span className={styles.count}>{accentCount(a)}</span>
              </button>
            ))}
          </div>

          <div className={styles.countLine}>
            <span id="vbCount" role="status" aria-live="polite">
              <strong>{list.length}</strong> {list.length === 1 ? 'voice' : 'voices'}
            </span>
          </div>
        </div>

        <div className={styles.list} role="radiogroup" aria-label="Voices">
          {/* pinned Your voice group */}
          <div className={styles.groupLabel}>🔒 Your voice</div>
          {voiceClone ? (
            <div
              className={styles.voiceCard}
              role="radio"
              aria-checked={selectedId === voiceClone.voiceId}
              tabIndex={selectedId === voiceClone.voiceId ? 0 : -1}
              onClick={() => pick(voiceClone.voiceId)}
              onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pick(voiceClone.voiceId); } }}
            >
              <div className={styles.vMeta}>
                <div className={styles.vName}>🎙 {voiceClone.cloneName || 'My Voice'}</div>
                <div className={styles.vSub}>your voice</div>
                <div className={styles.vVibe}>Cloned from your recording</div>
              </div>
              {selectedId === voiceClone.voiceId ? (
                <svg className={styles.checkTick} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
              ) : null}
            </div>
          ) : isHost ? (
            <div className={styles.recRow}>
              <div className={styles.recTitle}>🎙 Clone your voice</div>
              <div className={styles.recBody}>Record 30–60s of natural speech. We'll clone it for all your podcasts — it then appears here as a pick.</div>
              {cloningVoice ? (
                <div className={styles.recCounter} role="status" aria-live="assertive">
                  <span className={styles.recDot} aria-hidden="true" />
                  {`${Math.floor(cloneRecSeconds / 60)}:${String(cloneRecSeconds % 60).padStart(2, '0')}`}
                  <span className={styles.recHint}>— tap stop when done</span>
                </div>
              ) : null}
              {cloneError ? <div className={styles.recError}>{cloneError}</div> : null}
              <button
                type="button"
                className={`${styles.actionChip} ${cloningVoice ? styles.actionChipRec : ''}`}
                onClick={onCloneRecord}
                disabled={cloneSubmitting}
                aria-pressed={!!cloningVoice}
              >
                {cloneSubmitting ? '⏳ Cloning…'
                  : cloningVoice ? `⏹ Stop recording (${cloneRecSeconds}s)`
                  : '⏺ Record my voice'}
              </button>
            </div>
          ) : (
            <div className={styles.recRow}>
              <div className={styles.recBody} style={{ margin: 0 }}>
                No cloned voice yet — record yours from the <b>Host</b> slot, then it's available for any speaker.
              </div>
            </div>
          )}

          {/* library group */}
          <div className={styles.groupLabel}>Library</div>
          {list.length === 0 ? (
            <div className={styles.empty}>
              <strong>No library voices match</strong>
              Try another accent or clear the search.
            </div>
          ) : (
            list.map(v => <VoiceCard key={v.voiceId} v={v} />)
          )}
        </div>
      </div>
    </div>
  );
}