// src/components/ScenariosTab/ScenarioChatWindow/SceneEditor.jsx
// CP3 — Scene editor: reorder (drag), recaption, swap music, then re-assemble.
// Self-contained: reads the spine from job.beats_manifest, POSTs an edited
// manifest to /reassemble, polls the same job, and shows the new video.
// No AI — free edits only. Needs: @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable,
  arrayMove, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './SceneEditor.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';
const POLL_MS  = 4000;
const POLL_TIMEOUT_MS = 20 * 60 * 1000;   // 20m hard stop (matches reassemble job_timeout)

// Music beds — keep in sync with your ambience module's supported genres.
// value '' = no ambient bed.
const MUSIC_OPTIONS = [
  { value: '',         label: 'No music' },
  { value: 'debate',   label: 'Debate hall' },
  { value: 'drama',    label: 'Drama' },
  { value: 'mystery',  label: 'Mystery' },
  { value: 'thriller', label: 'Thriller' },
  { value: 'romance',  label: 'Romance' },
];

const csrfToken = () =>
  document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';

// ── Icons ─────────────────────────────────────────────────────────────────────
const GripIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
    <circle cx="5" cy="3" r="1.4"/><circle cx="11" cy="3" r="1.4"/>
    <circle cx="5" cy="8" r="1.4"/><circle cx="11" cy="8" r="1.4"/>
    <circle cx="5" cy="13" r="1.4"/><circle cx="11" cy="13" r="1.4"/>
  </svg>
);
const BackIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="10 3 5 8 10 13"/>
  </svg>
);

// ── One sortable beat card ────────────────────────────────────────────────────
function BeatCard({ beat, position, onCaptionChange }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: beat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex:  isDragging ? 5 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.card}>
      {/* Drag handle only — leaves the caption box free to edit/select */}
      <button
        type="button"
        className={styles.handle}
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripIcon />
      </button>

      <div className={styles.thumbWrap}>
        {beat.still_url
          ? <img src={beat.still_url} className={styles.thumb} alt="" draggable={false} />
          : <div className={styles.thumbFallback} />}
        <span className={styles.posBadge}>{position}</span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span className={styles.speaker}>{beat.speaker || '—'}</span>
          <span className={styles.seconds}>
            {typeof beat.seconds === 'number' ? `${beat.seconds.toFixed(1)}s` : ''}
          </span>
        </div>
        <textarea
          className={styles.caption}
          value={beat.caption || ''}
          placeholder="(no caption)"
          rows={2}
          onChange={(e) => onCaptionChange(beat.id, e.target.value)}
        />
      </div>
    </div>
  );
}

// ── Editor ────────────────────────────────────────────────────────────────────
export default function SceneEditor({ job, onClose, onApplied }) {
  const manifest = useMemo(() => {
    const m = job?.beats_manifest;
    if (!m) return null;
    return typeof m === 'string' ? JSON.parse(m) : m;
  }, [job]);

  const [beats, setBeats] = useState(() =>
    (manifest?.beats || []).map((b, i) => ({ ...b, id: String(b.index ?? i) }))
  );
  const [ambience, setAmbience] = useState(manifest?.ambience ?? '');
  const [captions, setCaptions] = useState(manifest?.captions ?? true);

  const [status,    setStatus]    = useState('editing'); // editing | applying | done | error
  const [progress,  setProgress]  = useState(0);
  const [resultUrl, setResultUrl] = useState(null);
  const [error,     setError]     = useState(null);

  const pollRef  = useRef(null);
  const startRef = useRef(null);

  // Snapshot for dirty-checking
  const initial = useRef({
    order:    (manifest?.beats || []).map(b => String(b.index)),
    captions: (manifest?.beats || []).map(b => b.caption || ''),
    ambience: manifest?.ambience ?? '',
    capsOn:   manifest?.captions ?? true,
  });

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Ensure the stored ambience always appears as an option
  const musicOptions = useMemo(() => {
    if (ambience && !MUSIC_OPTIONS.some(o => o.value === ambience)) {
      return [...MUSIC_OPTIONS, { value: ambience, label: ambience }];
    }
    return MUSIC_OPTIONS;
  }, [ambience]);

  if (!manifest || beats.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>This video has no editable scene data yet.</p>
        <button className={styles.backBtn} onClick={onClose}><BackIcon /> Back</button>
      </div>
    );
  }

  const dirty = (() => {
    const order = beats.map(b => b.id);
    if (order.join() !== initial.current.order.join()) return true;
    if (ambience !== initial.current.ambience) return true;
    if (captions !== initial.current.capsOn) return true;
    // caption text (compare in current order against original-by-id)
    const origById = Object.fromEntries(
      (manifest.beats || []).map(b => [String(b.index), b.caption || ''])
    );
    return beats.some(b => (b.caption || '') !== (origById[b.id] ?? ''));
  })();

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setBeats(items => {
      const from = items.findIndex(b => b.id === active.id);
      const to   = items.findIndex(b => b.id === over.id);
      return arrayMove(items, from, to);
    });
  };

  const handleCaptionChange = (id, text) =>
    setBeats(items => items.map(b => (b.id === id ? { ...b, caption: text } : b)));

  const buildManifest = () => ({
    ...manifest,
    ambience: ambience || null,
    captions,
    // strip the dnd id, renumber index to the new order
    beats: beats.map(({ id, ...b }, i) => ({ ...b, index: i })),
  });

  const apply = async () => {
    setStatus('applying');
    setError(null);
    setProgress(0.05);
    startRef.current = Date.now();

    try {
      const res = await fetch(`${API_BASE}/api/content/jobs/${job.id}/reassemble`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken() },
        credentials: 'include',
        body: JSON.stringify({ manifest: buildManifest() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Reassemble failed: ${res.status}`);

      pollRef.current = setInterval(async () => {
        if (Date.now() - startRef.current > POLL_TIMEOUT_MS) {
          clearInterval(pollRef.current); pollRef.current = null;
          setError('Re-assembly timed out. Please try again.');
          setStatus('error');
          return;
        }
        try {
          const r = await fetch(`${API_BASE}/api/content/jobs/${job.id}`,
            { credentials: 'include' });
          if (!r.ok) return;
          const j = await r.json();
          setProgress(j.progress || 0);
          if (j.status === 'complete') {
            clearInterval(pollRef.current); pollRef.current = null;
            // cache-bust just in case the player clings to the old src
            setResultUrl(`${j.output_url}${j.output_url.includes('?') ? '&' : '?'}t=${Date.now()}`);
            setStatus('done');
            onApplied?.(j);
          } else if (j.status === 'failed') {
            clearInterval(pollRef.current); pollRef.current = null;
            setError(j.error_message || 'Re-assembly failed');
            setStatus('error');
          }
        } catch (_) { /* transient — keep polling */ }
      }, POLL_MS);
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  };

  const busy = status === 'applying';

  // ── Done state ──────────────────────────────────────────────────────────────
  if (status === 'done') {
    return (
      <div className={styles.doneWrap}>
        <p className={styles.doneTitle}>Scene updated</p>
        <video controls autoPlay src={resultUrl} className={styles.doneVideo}>
          Your browser does not support video playback.
        </video>
        <div className={styles.doneActions}>
          <button className={styles.secondaryBtn} onClick={() => setStatus('editing')}>
            Keep editing
          </button>
          <button className={styles.primaryBtn} onClick={onClose}>Done</button>
        </div>
      </div>
    );
  }

  // ── Editing / applying ──────────────────────────────────────────────────────
  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <button className={styles.backBtn} onClick={onClose} disabled={busy}>
          <BackIcon /> Back
        </button>
        <div className={styles.toolbarRight}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Music</span>
            <select
              className={styles.select}
              value={ambience}
              disabled={busy}
              onChange={(e) => setAmbience(e.target.value)}
            >
              {musicOptions.map(o => (
                <option key={o.value || 'none'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={captions}
              disabled={busy}
              onChange={(e) => setCaptions(e.target.checked)}
            />
            <span>Captions</span>
          </label>
        </div>
      </div>

      <p className={styles.hint}>Drag to reorder · edit captions inline</p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={beats.map(b => b.id)} strategy={verticalListSortingStrategy}>
          <div className={styles.list}>
            {beats.map((b, i) => (
              <BeatCard
                key={b.id}
                beat={b}
                position={i + 1}
                onCaptionChange={handleCaptionChange}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {status === 'error' && <p className={styles.error}>{error}</p>}

      <div className={styles.footer}>
        {busy ? (
          <div className={styles.progressRow}>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${Math.max(5, Math.round(progress * 100))}%` }}
              />
            </div>
            <span className={styles.progressLabel}>Re-assembling…</span>
          </div>
        ) : (
          <button
            className={styles.applyBtn}
            onClick={apply}
            disabled={!dirty}
            title={dirty ? '' : 'No changes yet'}
          >
            Apply changes
          </button>
        )}
      </div>
    </div>
  );
}