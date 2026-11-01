// src/hooks/usePodcastSources.js
//
// Sources Mode ("From your docs") state + API calls.
// Mirrors usePodcastStudio.js exactly — same CSRF helper, same
// ApiErrorService mapping, same snake_case→camelCase normalisation at the
// fetch boundary, same 202-and-poll pattern.
//
// NAMING CONVENTIONS (Frontend Hook ←→ Backend):
//
//   Hook state / param        Backend field       Endpoint
//   ──────────────────────────────────────────────────────────────────────────
//   sources[].sourceId        source_id           GET  /api/podcast/sources
//   sources[].kind            kind                       (pdf|docx|pptx|txt|url|youtube|audio)
//   sources[].label           label
//   sources[].status          status                     (queued|processing|ready|error)
//   sources[].progressNote    progress_note
//   sources[].wordCount       word_count
//   sources[].durationSeconds duration_seconds
//   sources[].error           error
//
//   file (File)               file (form field)   POST /api/podcast/source
//   url                       url (json)          POST /api/podcast/source
//
//   generate params           body                POST /api/podcast/generate-from-sources
//     sourceIds               sourceIds             (backend accepts camelCase)
//     mode                    mode                  'solo'|'interview'
//     style                   style                 brief|explainer|keynote|interview|skeptic
//     lengthMinutes           lengthMinutes         1–6
//     tone / focus            tone / focus
//     hostName / guestName    hostName / guestName
//   scriptId                  scriptId            ← 202 response
//
//   script poll               GET /api/podcast/source-script/<id>
//     status                  status              queued|processing|ready|error
//     progressNote            progressNote        "planning episode" → "writing dialogue" → "checking grounding"
//     lines[]                 lines               [{speaker:'host'|'guest', text, citations[]}]
//     citations[].claimId     claimId
//     citations[].sourceLabel sourceLabel
//     citations[].anchor      anchor              "p.4" | "§2" | "@12:30"
//     citations[].snippet     snippet             the claim text
//     citations[].verdict     verdict             supported|weak|unsupported|null

import { useState, useCallback, useEffect, useRef } from 'react';
import ApiErrorService from '../services/ApiErrorService';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

const SOURCE_POLL_MS   = 4000;
const SCRIPT_POLL_MS   = 4000;
const SCRIPT_TIMEOUT_MS = 6 * 60 * 1000; // generation is async server-side; 6min hard stop

const getCsrf = () =>
  document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';

// Backend snake_case → frontend camelCase (single place, like the studio hook)
const normaliseSource = (s) => ({
  sourceId:        s.sourceId        ?? s.source_id,
  kind:            s.kind,
  label:           s.label,
  originUrl:       s.originUrl       ?? s.origin_url ?? null,
  status:          s.status,
  progressNote:    s.progressNote    ?? s.progress_note ?? null,
  wordCount:       s.wordCount       ?? s.word_count ?? 0,
  durationSeconds: s.durationSeconds ?? s.duration_seconds ?? null,
  truncated:       !!(s.truncated),
  error:           s.error ?? null,
  createdAt:       s.createdAt       ?? s.created_at ?? null,
});

export default function usePodcastSources() {

  const [sources, setSources]     = useState([]);   // the user's library, newest first
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [addError, setAddError]   = useState(null); // last add-source failure (user-safe)

  // Generation state — one in-flight script at a time (Generate is disabled
  // while pending, so double-clicks can't stack jobs).
  const [genState, setGenState] = useState({
    status: 'idle',            // idle | submitting | queued | processing | ready | failed
    scriptId: null,
    progressNote: null,
    error: null,
  });

  const sourcePollRef = useRef(null);
  const scriptPollRef = useRef(null);

  const stopSourcePolling = useCallback(() => {
    if (sourcePollRef.current) { clearInterval(sourcePollRef.current); sourcePollRef.current = null; }
  }, []);
  const stopScriptPolling = useCallback(() => {
    if (scriptPollRef.current) { clearInterval(scriptPollRef.current); scriptPollRef.current = null; }
  }, []);
  useEffect(() => () => { stopSourcePolling(); stopScriptPolling(); },
    [stopSourcePolling, stopScriptPolling]);

  // ── Library ────────────────────────────────────────────────────────────────

  const loadSources = useCallback(async () => {
    try {
      setSourcesLoading(true);
      const res = await fetch(`${API_BASE}/api/podcast/sources`, { credentials: 'include' });
      if (!res.ok) { console.warn('⚠️ loadSources:', res.status); return; }
      const data = await res.json();
      setSources((data.sources || []).map(normaliseSource));
      console.log(`📚 Sources loaded: ${data.sources?.length}`);
    } catch (e) {
      console.warn('⚠️ loadSources error:', e.message);
    } finally {
      setSourcesLoading(false);
    }
  }, []);

  useEffect(() => { loadSources(); }, [loadSources]);

  // ── Pending-source polling sweep ───────────────────────────────────────────
  // While ANY source is queued/processing, poll each pending one every 4s.
  // The backend's stuck-job guard converts stalls to honest errors, so this
  // loop always terminates.

  const hasPending = sources.some(s => s.status === 'queued' || s.status === 'processing');

  useEffect(() => {
    if (!hasPending) { stopSourcePolling(); return; }
    if (sourcePollRef.current) return; // already sweeping

    sourcePollRef.current = setInterval(async () => {
      const pending = sources.filter(s => s.status === 'queued' || s.status === 'processing');
      for (const src of pending) {
        try {
          const res = await fetch(`${API_BASE}/api/podcast/source/${src.sourceId}`,
            { credentials: 'include' });
          if (!res.ok) continue;
          const data = await res.json();
          const fresh = normaliseSource(data.source || {});
          setSources(prev => prev.map(s => s.sourceId === fresh.sourceId ? fresh : s));
        } catch (e) { /* transient — retry next tick */ }
      }
    }, SOURCE_POLL_MS);

    return stopSourcePolling;
  }, [hasPending, sources, stopSourcePolling]);

  // ── Add a source (file) ────────────────────────────────────────────────────
  // Backend enforces the real caps (type, size, 40-min audio) and returns
  // user-safe 400s; we surface them via ApiErrorService's 400 passthrough.

  const addSourceFile = useCallback(async (file) => {
    if (!file) throw new Error('No file provided');
    setAddError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res  = await fetch(`${API_BASE}/api/podcast/source`, {
        method:      'POST',
        headers:     { 'X-CSRF-Token': getCsrf() },
        credentials: 'include',
        body:        formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        ApiErrorService.log('usePodcastSources.addSourceFile', res.status, data);
        const msg = ApiErrorService.getMessage(res.status, data);
        setAddError(msg);
        throw new Error(msg);
      }
      const src = normaliseSource(data.source || {});
      setSources(prev => [src, ...prev]);
      console.log(`📥 Source queued: ${src.label} (${src.kind})`);
      return src;
    } catch (e) {
      if (!addError) setAddError(e.message);
      throw e;
    }
  }, [addError]);

  // ── Add a source (URL / YouTube) ───────────────────────────────────────────

  const addSourceUrl = useCallback(async (url) => {
    if (!url?.trim()) throw new Error('No URL provided');
    setAddError(null);

    try {
      const res  = await fetch(`${API_BASE}/api/podcast/source`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrf() },
        credentials: 'include',
        body:        JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        ApiErrorService.log('usePodcastSources.addSourceUrl', res.status, data);
        const msg = ApiErrorService.getMessage(res.status, data);
        setAddError(msg);
        throw new Error(msg);
      }
      const src = normaliseSource(data.source || {});
      setSources(prev => [src, ...prev]);
      console.log(`🔗 URL source queued: ${src.label}`);
      return src;
    } catch (e) {
      if (!addError) setAddError(e.message);
      throw e;
    }
  }, [addError]);

  // ── Delete a source ────────────────────────────────────────────────────────

  const deleteSource = useCallback(async (sourceId) => {
    if (!sourceId) throw new Error('sourceId is required');
    try {
      const res = await fetch(`${API_BASE}/api/podcast/source/${sourceId}`, {
        method:      'DELETE',
        headers:     { 'X-CSRF-Token': getCsrf() },
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        ApiErrorService.log('usePodcastSources.deleteSource', res.status, data);
        throw new Error(ApiErrorService.getMessage(res.status, data));
      }
      setSources(prev => prev.filter(s => s.sourceId !== sourceId));
      console.log(`🗑️ Source deleted: ${sourceId}`);
    } catch (e) {
      throw e;
    }
  }, []);

  // ── Generate a script from sources (202 + poll) ────────────────────────────
  //
  // Resolves with the FULL ready script:
  //   { scriptId, title, plan, lines[], citationMap, verifyFlags }
  // Rejects with a user-safe Error on failure/timeout.

  const generateScript = useCallback(async ({
    sourceIds, mode = 'interview', style, lengthMinutes = 3,
    tone = '', focus = '', hostName = 'You', guestName = 'Guest',
  }) => {
    if (!sourceIds?.length) throw new Error('Pick at least one ready source');
    stopScriptPolling();
    setGenState({ status: 'submitting', scriptId: null, progressNote: null, error: null });

    let scriptId;
    try {
      const res  = await fetch(`${API_BASE}/api/podcast/generate-from-sources`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrf() },
        credentials: 'include',
        body: JSON.stringify({
          sourceIds, mode, style, lengthMinutes, tone, focus, hostName, guestName,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        ApiErrorService.log('usePodcastSources.generateScript', res.status, data);
        throw new Error(ApiErrorService.getMessage(res.status, data));
      }
      scriptId = data.scriptId;
      console.log(`🧠 Script generation queued: ${scriptId}`);
      setGenState({ status: 'queued', scriptId, progressNote: null, error: null });
    } catch (e) {
      setGenState({ status: 'failed', scriptId: null, progressNote: null, error: e.message });
      throw e;
    }

    // Poll to ready|error — the backend's staleness guard bounds this too.
    return new Promise((resolve, reject) => {
      const started = Date.now();
      scriptPollRef.current = setInterval(async () => {
        if (Date.now() - started > SCRIPT_TIMEOUT_MS) {
          stopScriptPolling();
          const msg = 'Generation timed out — please try again.';
          setGenState({ status: 'failed', scriptId, progressNote: null, error: msg });
          reject(new Error(msg));
          return;
        }
        try {
          const res = await fetch(`${API_BASE}/api/podcast/source-script/${scriptId}`,
            { credentials: 'include' });
          if (!res.ok) return; // transient — retry next tick
          const { script } = await res.json();
          if (!script) return;

          if (script.status === 'ready') {
            stopScriptPolling();
            console.log(`✅ Script ready: ${scriptId} (${script.lines?.length} lines)`);
            setGenState({ status: 'ready', scriptId, progressNote: null, error: null });
            resolve(script);
          } else if (script.status === 'error') {
            stopScriptPolling();
            const msg = script.error || 'Generation failed — please try again.';
            setGenState({ status: 'failed', scriptId, progressNote: null, error: msg });
            reject(new Error(msg));
          } else {
            // queued | processing — surface the worker's breadcrumb
            setGenState(prev => ({
              ...prev, status: script.status,
              progressNote: script.progressNote || prev.progressNote,
            }));
          }
        } catch (e) { /* transient — retry next tick */ }
      }, SCRIPT_POLL_MS);
    });
  }, [stopScriptPolling]);

  const resetGeneration = useCallback(() => {
    stopScriptPolling();
    setGenState({ status: 'idle', scriptId: null, progressNote: null, error: null });
  }, [stopScriptPolling]);

  return {
    // Library
    sources,          // normalised source objects, newest first
    sourcesLoading,
    addError,         // last add failure (user-safe string) — panel banner
    loadSources,      // () → void — manual refresh
    addSourceFile,    // (File)  → source (queued; sweep polls it to ready)
    addSourceUrl,     // (url)   → source
    deleteSource,     // (sourceId) → void

    // Generation
    genState,         // { status, scriptId, progressNote, error }
    generateScript,   // (params) → Promise<script> — resolves when ready
    resetGeneration,  // () → void
  };
}