// src/components/Film/useFilmJob.js
// A film job's live state: generate → 5s poll → edit, plus cancel / reassemble /
// regenerate (all act on the SAME job, so one poll reflects them). Uses filmApi.

import { useState, useCallback, useRef, useEffect } from 'react';
import { filmGenerate, filmGetJob, filmCancel, filmReassemble, filmRegenerate, friendlyError } from './filmApi';

const POLL_MS = 5000;
const POLL_TIMEOUT_MS = 45 * 60 * 1000;

const normBeat = b => ({
  index: b.index,
  kind: b.kind || 'pure_visual',
  seconds: Math.round(b.seconds || 6),
  speaker: (b.speaker || '').trim(),
  caption: (b.caption || '').trim(),
  clipUrl: b.clip_url || null,
  durable: !!b.durable,
  softened: !!b.softened,
});

// manifest → storyboard cells. The backend pushes { plan:[shot skeletons],
// beats:[rendered-so-far w/ clip_url], live, total } the MOMENT the director
// finishes — so we build the card grid from `plan` immediately (shot info, no
// clips), then overlay `beats` clips by index as each shot renders. `expected`
// (from a review count) is a fallback when no plan is present.
function toCells(manifest, expected) {
  const plan = (manifest && manifest.plan) || [];
  const beats = (manifest && manifest.beats) || [];
  const live = !!(manifest && manifest.live);
  const rendered = new Map(beats.map(b => [b.index, normBeat(b)]));

  // NOT live → a completed or freshly-EDITED film: the durable beats ARE the
  // truth (in their current order), so cut / duplicate / reorder reflect at once.
  // The `plan` is only the live-render progress skeleton; ignore it here.
  if (!live && beats.length) {
    return beats.map((b, pos) => ({ ...normBeat(b), pos, status: 'done' }));
  }

  // Live render: build the card grid from the plan skeleton immediately, overlay
  // rendered clips by index as each shot finishes.
  const total = Math.max(plan.length, beats.length, expected || 0);
  if (!total) return [];
  const planByIndex = new Map(plan.map(s => [s.index, s]));
  let firstPending = null;
  for (let i = 1; i <= total; i++) if (!rendered.has(i)) { firstPending = i; break; }

  const cells = [];
  for (let i = 1; i <= total; i++) {
    const done = rendered.get(i);
    if (done) {
      const p = planByIndex.get(i) || {};
      cells.push({
        ...done, pos: i - 1,
        kind: done.kind || p.kind || 'pure_visual',
        speaker: done.speaker || (p.speaker || '').trim(),
        caption: done.caption || (p.caption || '').trim(),
        softened: done.softened || !!p.softened,
        status: 'done',
      });
    } else {
      const p = planByIndex.get(i);
      cells.push(p ? {
        index: i, pos: i - 1,
        kind: p.kind || 'pure_visual', seconds: Math.round(p.seconds || 6),
        speaker: (p.speaker || '').trim(), caption: (p.caption || '').trim(),
        clipUrl: null, durable: false, softened: !!p.softened,
        status: (live && i === firstPending) ? 'rendering' : 'queued',
      } : {
        index: i, pos: i - 1, kind: 'pure_visual', seconds: 6, speaker: '', caption: '',
        clipUrl: null, durable: false, softened: false,
        status: (live && i === firstPending) ? 'rendering' : 'queued',
      });
    }
  }
  return cells;
}

function etaText(done, total, secsPerShot = 130) {
  const left = Math.max(0, total - done) * secsPerShot;
  if (left <= 0) return '';
  const m = Math.round(left / 60);
  return m >= 1 ? `~${m} min left` : '<1 min left';
}

export default function useFilmJob() {
  const [jobId, setJobId]           = useState(null);
  const [status, setStatus]         = useState('idle');   // idle|processing|complete|failed
  const [manifest, setManifest]     = useState(null);
  const [rawProgress, setRawProgress] = useState(0);
  const [outputUrl, setOutputUrl]   = useState(null);
  const [error, setError]           = useState(null);
  const [editBusy, setEditBusy]     = useState(null);   // null | label while an edit applies

  const pollRef = useRef(null);
  const startedRef = useRef(0);
  const expectedRef = useRef(0);

  const stop = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);
  useEffect(() => stop, [stop]);

  const poll = useCallback((id) => {
    stop();
    startedRef.current = Date.now();
    const tick = async () => {
      if (Date.now() - startedRef.current > POLL_TIMEOUT_MS) {
        stop(); setStatus('failed'); setError('This is taking too long — please try again.');
        return;
      }
      try {
        const job = await filmGetJob(id);
        setStatus(job.status || 'processing');
        setRawProgress(typeof job.progress === 'number' ? job.progress : 0);
        if (job.beats_manifest) {
          const m = typeof job.beats_manifest === 'string' ? JSON.parse(job.beats_manifest) : job.beats_manifest;
          setManifest(m);
        }
        if (job.output_url) setOutputUrl(job.output_url);
        if (job.status === 'complete') { stop(); setEditBusy(null); }
        if (job.status === 'failed' || job.status === 'cancelled') {
          stop(); setEditBusy(null); setError(job.error_message || 'Render stopped.');
        }
      } catch (e) {
        const s = e && e.response && e.response.status;
        if (s === 404) { stop(); setStatus('failed'); setError('That job is no longer available.'); }
        // any other single failed poll: keep trying until timeout
      }
    };
    tick();                              // fire immediately so the plan/cards show at once
    pollRef.current = setInterval(tick, POLL_MS);
  }, [stop]);

  const generate = useCallback(async ({ script, title, duration_seconds = 120, video_style = 'anime',
                                        intro = false, outro_theme = null, film_project_id = null,
                                        expectedShots = 0 }) => {
    setError(null); setManifest(null); setOutputUrl(null); setStatus('processing');
    expectedRef.current = expectedShots || 0;
    try {
      const data = await filmGenerate({ script, title, duration_seconds, video_style, intro, outro_theme, film_project_id });
      const id = data.job_id;
      setJobId(id);
      poll(id);
      return id;
    } catch (e) { setStatus('failed'); setError(friendlyError(e)); return null; }
  }, [poll]);

  // Restore an existing render on resume (from GET /projects/:id → render block).
  const adopt = useCallback((render) => {
    if (!render || !render.job_id) return;
    setJobId(render.job_id);
    const s = render.status || 'processing';
    setStatus(s);
    if (render.output_url) setOutputUrl(render.output_url);
    if (render.beats_manifest) {
      try {
        const m = typeof render.beats_manifest === 'string' ? JSON.parse(render.beats_manifest) : render.beats_manifest;
        setManifest(m);
        if (m && m.total) expectedRef.current = m.total;
      } catch (_) {}
    }
    if (s !== 'complete' && s !== 'failed' && s !== 'cancelled') poll(render.job_id);
  }, [poll]);

  const cancel = useCallback(async () => {
    if (!jobId) return;
    try { await filmCancel(jobId); } catch (_) {}   // poll picks up status=cancelled
  }, [jobId]);

  const reassemble = useCallback(async (editedBeats, captions) => {
    if (!jobId) return;
    setError(null); setEditBusy('Reassembling your film…'); setStatus('processing');
    try { await filmReassemble(jobId, editedBeats, captions); poll(jobId); }
    catch (e) { setError(friendlyError(e)); setEditBusy(null); }
  }, [jobId, poll]);

  const regenerate = useCallback(async (beatIndex, note, editedText) => {
    if (!jobId) return;
    setError(null); setEditBusy(`Regenerating shot ${beatIndex}…`); setStatus('processing');
    try { await filmRegenerate(jobId, beatIndex, note, editedText); poll(jobId); }
    catch (e) { setError(friendlyError(e)); setEditBusy(null); }
  }, [jobId, poll]);

  const reset = useCallback(() => {
    stop();
    setJobId(null); setStatus('idle'); setManifest(null); setRawProgress(0);
    setOutputUrl(null); setError(null); setEditBusy(null); expectedRef.current = 0;
  }, [stop]);

  const cells = toCells(manifest, expectedRef.current);
  const stage = status === 'complete' ? 'edit'
    : status === 'processing' ? 'render'
    : status === 'failed' ? 'failed' : 'idle';
  const total = Math.max(expectedRef.current, cells.length);
  const done = cells.filter(c => c.status === 'done').length || Math.round(rawProgress * total);
  const progress = { done, total, etaText: etaText(done, total) };
  const jobTitle = (manifest && manifest.source && manifest.source.title) || null;

  return { jobId, status, stage, cells, progress, outputUrl, error, title: jobTitle, editBusy,
    generate, cancel, reassemble, regenerate, adopt, reset };
}