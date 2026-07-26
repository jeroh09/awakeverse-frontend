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

// manifest → storyboard cells. `expected` (from the review shot count) lets us
// render "queued" placeholders for shots that haven't streamed in yet.
function toCells(manifest, expected) {
  const beats = (manifest && manifest.beats) || [];
  const live = !!(manifest && manifest.live);
  const byIndex = new Map(beats.map(b => [b.index, normBeat(b)]));
  const total = Math.max(expected || 0, beats.length);
  if (!total) return [];
  let firstPending = null;
  for (let i = 1; i <= total; i++) if (!byIndex.has(i)) { firstPending = i; break; }
  const cells = [];
  for (let i = 1; i <= total; i++) {
    const b = byIndex.get(i);
    if (b) cells.push({ ...b, status: 'done' });
    else cells.push({
      index: i, kind: 'pure_visual', seconds: 6, speaker: '', caption: '', clipUrl: null,
      durable: false, softened: false,
      status: (live && i === firstPending) ? 'rendering' : 'queued',
    });
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
    pollRef.current = setInterval(async () => {
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
        if (job.status === 'complete') stop();
        if (job.status === 'failed' || job.status === 'cancelled') {
          stop(); setError(job.error_message || 'Render stopped.');
        }
      } catch (e) {
        const s = e && e.response && e.response.status;
        if (s === 404) { stop(); setStatus('failed'); setError('That job is no longer available.'); }
        // any other single failed poll: keep trying until timeout
      }
    }, POLL_MS);
  }, [stop]);

  const generate = useCallback(async ({ script, title, duration_seconds = 120, video_style = 'anime',
                                        intro = false, outro_theme = null, expectedShots = 0 }) => {
    setError(null); setManifest(null); setOutputUrl(null); setStatus('processing');
    expectedRef.current = expectedShots || 0;
    try {
      const data = await filmGenerate({ script, title, duration_seconds, video_style, intro, outro_theme });
      const id = data.job_id;
      setJobId(id);
      poll(id);
      return id;
    } catch (e) { setStatus('failed'); setError(friendlyError(e)); return null; }
  }, [poll]);

  const cancel = useCallback(async () => {
    if (!jobId) return;
    try { await filmCancel(jobId); } catch (_) {}   // poll picks up status=cancelled
  }, [jobId]);

  const reassemble = useCallback(async (editedBeats, captions) => {
    if (!jobId) return;
    setError(null); setStatus('processing');
    try { await filmReassemble(jobId, editedBeats, captions); poll(jobId); }
    catch (e) { setError(friendlyError(e)); }
  }, [jobId, poll]);

  const regenerate = useCallback(async (beatIndex, note) => {
    if (!jobId) return;
    setError(null); setStatus('processing');
    try { await filmRegenerate(jobId, beatIndex, note); poll(jobId); }
    catch (e) { setError(friendlyError(e)); }
  }, [jobId, poll]);

  const reset = useCallback(() => {
    stop();
    setJobId(null); setStatus('idle'); setManifest(null); setRawProgress(0);
    setOutputUrl(null); setError(null); expectedRef.current = 0;
  }, [stop]);

  const cells = toCells(manifest, expectedRef.current);
  const stage = status === 'complete' ? 'edit'
    : status === 'processing' ? 'render'
    : status === 'failed' ? 'failed' : 'idle';
  const total = Math.max(expectedRef.current, cells.length);
  const done = cells.filter(c => c.status === 'done').length || Math.round(rawProgress * total);
  const progress = { done, total, etaText: etaText(done, total) };

  return { jobId, status, stage, cells, progress, outputUrl, error,
    generate, cancel, reassemble, regenerate, reset };
}