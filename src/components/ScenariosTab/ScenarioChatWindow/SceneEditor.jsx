// src/components/ScenariosTab/ScenarioChatWindow/SceneEditor.jsx
// CP3 — Scene editor: reorder (drag), recaption, swap music, then re-assemble.
// Updated: two-column layout — beat cards left, video right (owned by MediaJobModal).
// Done state is now inline in the bottom bar — no full-page takeover.
// New prop: currentVideoUrl — the video src passed down from MediaJobModal.
// onApplied(updatedJob) still fires when reassembly completes.

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
const POLL_TIMEOUT_MS = 20 * 60 * 1000;

const MUSIC_OPTIONS = [
  { value: '',        label: 'No music' },
  { value: 'debate',  label: 'Debate' },
  { value: 'drama',   label: 'Drama' },
  { value: 'action',  label: 'Action' },
  { value: 'romance', label: 'Romance' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'comedy',  label: 'Comedy' },
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
const DuplicateIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/>
    <path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5"/>
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="2.5 4 13.5 4"/>
    <path d="M5.5 4V2.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V4"/>
    <path d="M12 4l-.6 8.2a1.2 1.2 0 0 1-1.2 1.1H5.8a1.2 1.2 0 0 1-1.2-1.1L4 4"/>
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 8 6 11 13 4"/>
  </svg>
);

// ── One sortable beat card — unchanged ────────────────────────────────────────
function BeatCard({ beat, position, canDelete, onCaptionChange, onDuplicate, onDelete }) {
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
          <div className={styles.metaRight}>
            <span className={styles.seconds}>
              {typeof beat.seconds === 'number' ? `${beat.seconds.toFixed(1)}s` : ''}
            </span>
            <button
              type="button"
              className={styles.cardAction}
              title="Duplicate beat"
              aria-label="Duplicate beat"
              onClick={() => onDuplicate(beat.id)}
            >
              <DuplicateIcon />
            </button>
            <button
              type="button"
              className={`${styles.cardAction} ${styles.cardActionDanger}`}
              title={canDelete ? 'Delete beat' : 'Keep at least one beat'}
              aria-label="Delete beat"
              disabled={!canDelete}
              onClick={() => onDelete(beat.id)}
            >
              <TrashIcon />
            </button>
          </div>
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
// Props:
//   job            — the content job (beats_manifest, id, etc.)
//   currentVideoUrl — current video src, passed from MediaJobModal (updates after apply)
//   onClose        — back button → MediaJobModal sets mode='view'
//   onApplied(job) — fires when reassembly completes; MediaJobModal updates video src

export default function SceneEditor({ job, currentVideoUrl, onClose, onApplied }) {
  const manifest = useMemo(() => {
    const m = job?.beats_manifest;
    if (!m) return null;
    return typeof m === 'string' ? JSON.parse(m) : m;
  }, [job]);

  const idRef = useRef(0);
  const makeId = () => `b${idRef.current++}`;
  const [beats, setBeats] = useState(() =>
    (manifest?.beats || []).map((b) => ({ ...b, id: makeId() }))
  );
  const [ambience, setAmbience] = useState(manifest?.ambience ?? '');
  const [captions, setCaptions] = useState(manifest?.captions ?? true);

  // status: 'editing' | 'applying' | 'done' | 'error'
  const [status,   setStatus]   = useState('editing');
  const [progress, setProgress] = useState(0);
  const [error,    setError]    = useState(null);

  const pollRef  = useRef(null);
  const startRef = useRef(null);

  const initialBeats = useRef(manifest?.beats || []);
  const initial = useRef({
    ambience: manifest?.ambience ?? '',
    capsOn:   manifest?.captions ?? true,
  });

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const musicOptions = useMemo(() => {
    if (ambience && !MUSIC_OPTIONS.some(o => o.value === ambience)) {
      return [...MUSIC_OPTIONS, { value: ambience, label: ambience }];
    }
    return MUSIC_OPTIONS;
  }, [ambience]);

  // Empty guard — show inline, not a full takeover
  if (!manifest || beats.length === 0) {
    return (
      <div className={styles.editor}>
        <div className={styles.empty}>
          <p className={styles.emptyText}>This video has no editable scene data yet.</p>
          <button className={styles.backBtn} onClick={onClose}><BackIcon /> Back</button>
        </div>
      </div>
    );
  }

  const dirty = (() => {
    if (ambience !== initial.current.ambience) return true;
    if (captions !== initial.current.capsOn)   return true;
    const orig = initialBeats.current;
    if (beats.length !== orig.length) return true;
    return beats.some((b, i) =>
      b.clip_url !== orig[i]?.clip_url ||
      (b.caption || '') !== (orig[i]?.caption || '')
    );
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

  const handleDuplicate = (id) =>
    setBeats(items => {
      const i = items.findIndex(b => b.id === id);
      if (i < 0) return items;
      const copy = { ...items[i], id: makeId() };
      return [...items.slice(0, i + 1), copy, ...items.slice(i + 1)];
    });

  const handleDelete = (id) =>
    setBeats(items => (items.length <= 1 ? items : items.filter(b => b.id !== id)));

  const buildManifest = () => ({
    ...manifest,
    ambience: ambience || null,
    captions,
    beats: beats.map(({ id, ...b }, i) => ({ ...b, index: i })),
  });

  const apply = async () => {
    setStatus('applying');
    setError(null);
    setProgress(0.05);
    startRef.current = Date.now();

    try {
      const res = await fetch(`${API_BASE}/api/content/jobs/${job.id}/reassemble`, {
        method:  'POST',
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
            setStatus('done');
            onApplied?.(j);   // MediaJobModal updates currentVideoUrl — video refreshes
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

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.editor}>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
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

      {/* ── Beat card list ───────────────────────────────────────────────── */}
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
                canDelete={beats.length > 1}
                onCaptionChange={handleCaptionChange}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* ── Bottom bar — cycles through all states ───────────────────────── */}
      <div className={styles.bottomBar}>

        {/* Error */}
        {status === 'error' && (
          <p className={styles.error}>{error}</p>
        )}

        {/* Applying — progress */}
        {busy && (
          <div className={styles.progressRow}>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${Math.max(5, Math.round(progress * 100))}%` }}
              />
            </div>
            <span className={styles.progressLabel}>Re-assembling…</span>
          </div>
        )}

        {/* Done — inline confirmation + keep editing */}
        {status === 'done' && !busy && (
          <div className={styles.doneBar}>
            <span className={styles.doneLabel}>
              <CheckIcon /> Scene updated
            </span>
            <button
              className={styles.keepEditingBtn}
              onClick={() => setStatus('editing')}
            >
              Keep editing
            </button>
          </div>
        )}

        {/* Apply button — shown when idle or after done */}
        {!busy && status !== 'done' && (
          <button
            className={styles.applyBtn}
            onClick={apply}
            disabled={!dirty}
            title={dirty ? '' : 'No changes yet'}
          >
            Apply changes
          </button>
        )}

        {/* After done: re-enable apply for further edits */}
        {status === 'done' && (
          <button
            className={styles.applyBtn}
            onClick={apply}
            disabled={!dirty}
            title={dirty ? 'Apply new changes' : 'No new changes'}
          >
            Apply changes
          </button>
        )}

      </div>
    </div>
  );
}