// src/components/Film/useFilmJob.js
// A film job's live state: generate → 5s poll → edit, plus cancel / reassemble /
// regenerate (all act on the SAME job, so one poll reflects them). Uses filmApi.

import { useState, useCallback, useRef, useEffect } from 'react';
import { filmGenerate, filmGetJob, filmCancel, filmReassemble, filmRegenerate,
         filmPlan, filmRegeneratePlate, filmApproveRender, filmUploadCharacterImage,
         friendlyError } from './filmApi';

const POLL_MS = 5000;
const POLL_TIMEOUT_MS = 45 * 60 * 1000;

const normBeat = b => ({
  index: b.index,
  kind: b.kind || 'pure_visual',
  seconds: Math.round(b.seconds || 6),
  speaker: (b.speaker || '').trim(),
  caption: (b.caption || '').trim(),
  // Shot description + the attributed cast/lines so the editor shows the beat
  // exactly as the director set it (who's present, whose line is whose).
  visual: (b.visual || b.action || '').trim(),
  present: Array.isArray(b.present_cast) ? b.present_cast.slice() : [],
  lines: Array.isArray(b.lines)
    ? b.lines.map(l => ({ speaker: (l.speaker || '').trim(), text: (l.text || '').trim(),
                          kind: l.kind || 'dialogue' }))
    : [],
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
        visual: done.visual || (p.visual || p.action || '').trim(),
        present: (done.present && done.present.length) ? done.present
                 : (Array.isArray(p.present_cast) ? p.present_cast.slice() : []),
        lines: (done.lines && done.lines.length) ? done.lines
               : (Array.isArray(p.lines) ? p.lines.map(l => ({ speaker: (l.speaker||'').trim(),
                   text: (l.text||'').trim(), kind: l.kind || 'dialogue' })) : []),
        softened: done.softened || !!p.softened,
        status: 'done',
      });
    } else {
      const p = planByIndex.get(i);
      cells.push(p ? {
        index: i, pos: i - 1,
        kind: p.kind || 'pure_visual', seconds: Math.round(p.seconds || 6),
        speaker: (p.speaker || '').trim(), caption: (p.caption || '').trim(),
        visual: (p.visual || p.action || '').trim(),
        present: Array.isArray(p.present_cast) ? p.present_cast.slice() : [],
        lines: Array.isArray(p.lines) ? p.lines.map(l => ({ speaker: (l.speaker||'').trim(),
                 text: (l.text||'').trim(), kind: l.kind || 'dialogue' })) : [],
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

// Detect a 402 insufficient-credits response from generate/plan so the caller can
// show the top-up card instead of a generic error. Shape matches InsufficientCard.
function creditsBlock(e) {
  const status = e && e.response && e.response.status;
  const data = (e && e.response && e.response.data) || {};
  if (status === 402 || data.error === 'insufficient_credits') {
    return {
      needed: data.needed, available: data.available, shortBy: data.short_by,
      title: data.title || 'Not enough credits',
      message: data.message || 'You need more credits to make this.',
    };
  }
  return null;
}

export default function useFilmJob() {
  const [jobId, setJobId]           = useState(null);
  const [status, setStatus]         = useState('idle');   // idle|processing|complete|failed
  const [manifest, setManifest]     = useState(null);
  const [rawProgress, setRawProgress] = useState(0);
  const [outputUrl, setOutputUrl]   = useState(null);
  const [error, setError]           = useState(null);
  const [blocked, setBlocked]       = useState(null);   // 402 insufficient-credits info
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
        // awaiting_review is a PAUSE, not a terminal state: the plan + character
        // plates are ready and nothing changes until the user acts (regenerate /
        // approve). Stop polling so we don't spin for 45 min on a paused job; the
        // manifest (with manifest.review) is already set above for the review UI.
        if (job.status === 'awaiting_review') { stop(); setEditBusy(null); }
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
                                        aspect_ratio = '9:16', intro = false, outro_theme = null,
                                        film_project_id = null, expectedShots = 0 }) => {
    setError(null); setManifest(null); setOutputUrl(null); setStatus('processing');
    expectedRef.current = expectedShots || 0;
    try {
      const data = await filmGenerate({ script, title, duration_seconds, video_style, aspect_ratio, intro, outro_theme, film_project_id });
      const id = data.job_id;
      setJobId(id);
      poll(id);
      return id;
    } catch (e) {
      const b = creditsBlock(e);
      if (b) { setStatus('idle'); setBlocked(b); return null; }
      setStatus('failed'); setError(friendlyError(e)); return null;
    }
  }, [poll]);

  // ── Plate-review lifecycle (Plan & review) ──────────────────────────────────
  // plan(): director + character plates, then PAUSE at awaiting_review. Same body
  // as generate() but routed to the plan phase; the poll drives us THROUGH
  // processing (skeleton + "building plates" pill) and STOPS at awaiting_review.
  const plan = useCallback(async ({ script, title, duration_seconds = 120, video_style = 'anime',
                                    aspect_ratio = '9:16', intro = false, outro_theme = null,
                                    film_project_id = null, expectedShots = 0 }) => {
    setError(null); setManifest(null); setOutputUrl(null); setStatus('processing');
    expectedRef.current = expectedShots || 0;
    try {
      const data = await filmPlan({ script, title, duration_seconds, video_style, aspect_ratio, intro, outro_theme, film_project_id });
      const id = data.job_id;
      setJobId(id);
      poll(id);
      return id;
    } catch (e) {
      const b = creditsBlock(e);
      if (b) { setStatus('idle'); setBlocked(b); return null; }
      setStatus('failed'); setError(friendlyError(e)); return null;
    }
  }, [poll]);

  // regeneratePlate(): synchronous single-plate rebuild from an edited description.
  // Returns the new { name, description, plate_url } so the caller can update its
  // local review state immediately; on failure returns { error } (string) inline.
  const regeneratePlate = useCallback(async (name, description) => {
    if (!jobId) return { error: 'No plan to review yet.' };
    try {
      const r = await filmRegeneratePlate(jobId, name, description);
      // Reflect the new plate in the manifest so any manifest-driven view updates.
      setManifest(m => {
        if (!m) return m;
        const review = { ...(m.review || {}) };
        const chars = { ...(review.characters || {}) };
        chars[name] = { ...(chars[name] || {}), description, plate_url: r.plate_url };
        review.characters = chars;
        return { ...m, review };
      });
      return r;
    } catch (e) { return { error: friendlyError(e) }; }
  }, [jobId]);

  // uploadCharacterImage(): replace a reviewable character's plate with a stylized
  // upload (photo already hosted → pass its URL). Consent-gated on the backend;
  // a 403 { consent_required } surfaces so the caller can show the agreement.
  const uploadCharacterImage = useCallback(async (name, photoUrl) => {
    if (!jobId) return { error: 'No plan to review yet.' };
    try {
      const r = await filmUploadCharacterImage(jobId, name, photoUrl);
      setManifest(m => {
        if (!m) return m;
        const review = { ...(m.review || {}) };
        const chars = { ...(review.characters || {}) };
        chars[name] = { ...(chars[name] || {}), plate_url: r.plate_url, source: 'upload' };
        review.characters = chars;
        return { ...m, review };
      });
      return r;
    } catch (e) {
      const consentRequired = !!(e && e.response && e.response.data && e.response.data.consent_required);
      return { error: friendlyError(e), consentRequired };
    }
  }, [jobId]);

  // approveRender(): commit the reviewed plan → full render (Phase 3). The job
  // flips to processing and the normal render poll resumes.
  const approveRender = useCallback(async () => {
    if (!jobId) return;
    setError(null); setStatus('processing');
    try { await filmApproveRender(jobId); poll(jobId); }
    catch (e) { setError(friendlyError(e)); }
  }, [jobId, poll]);

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
    // awaiting_review resumes WITHOUT polling — it's a pause; the manifest we just
    // set carries the review block, and the user's next action drives the change.
    if (s !== 'complete' && s !== 'failed' && s !== 'cancelled' && s !== 'awaiting_review') poll(render.job_id);
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
    setOutputUrl(null); setError(null); setBlocked(null); setEditBusy(null); expectedRef.current = 0;
  }, [stop]);

  const cells = toCells(manifest, expectedRef.current);
  // Distinguish the plate-review PAUSE from an active render. While a plan job is
  // still 'processing' it shows the render skeleton + a "building character plates"
  // pill (planningPlates); once it reaches awaiting_review, stage is 'plate_review'.
  const phase = (manifest && manifest.phase) || null;
  const isPlanPhase = phase === 'plate_review';   // set by the backend's plan job
  const stage = status === 'awaiting_review' ? 'plate_review'
    : status === 'complete' ? 'edit'
    : status === 'processing' ? 'render'
    : status === 'failed' ? 'failed' : 'idle';
  // "Plates are building" pill: a plan job still processing, not yet paused.
  const planningPlates = isPlanPhase && status === 'processing';
  const reviewCharacters = (manifest && manifest.review && manifest.review.characters) || null;

  const total = Math.max(expectedRef.current, cells.length);
  const done = cells.filter(c => c.status === 'done').length || Math.round(rawProgress * total);
  const progress = { done, total, etaText: etaText(done, total) };
  const jobTitle = (manifest && manifest.source && manifest.source.title) || null;

  return { jobId, status, stage, cells, progress, outputUrl, error, title: jobTitle, editBusy,
    reviewCharacters, planningPlates, blocked, clearBlocked: () => setBlocked(null),
    generate, plan, regeneratePlate, uploadCharacterImage, approveRender,
    cancel, reassemble, regenerate, adopt, reset };
}