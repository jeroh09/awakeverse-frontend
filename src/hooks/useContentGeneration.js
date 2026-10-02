// src/hooks/useContentGeneration.js
// Complete rewrite — adds async polling for audio and video jobs.
// Script (201) → immediate complete.
// Audio/Video (202) → poll every 5s until complete or failed.
//
// ApiErrorService integrated — all user-facing error strings are
// mapped through the service. Raw status codes and stack traces
// never reach the UI. Backend continues to log everything server-side.

import { useState, useCallback, useEffect, useRef } from 'react';
import ApiErrorService from '../services/ApiErrorService';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

const POLL_INTERVAL_MS = 5000;          // poll every 5s
const POLL_TIMEOUT_MS  = 45 * 60 * 1000; // 45min hard stop (matches job_timeout)

const INITIAL_STATE = {
  status:    'idle',   // 'idle' | 'creating' | 'complete' | 'failed'
  activeJob: null,     // full job dict
  error:     null,
  progress:  0,        // 0.0 → 1.0, from job.progress during polling
};

const INITIAL_BUDGET_ERROR = {
  hit:           false,
  secondsUsed:   null,
  budget:        null,
  suggestedTier: null,
};

export default function useContentGeneration(scenarioId) {

  const [state,       setState]      = useState(INITIAL_STATE);
  const [jobs,        setJobs]       = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [budgetError, setBudgetError] = useState(INITIAL_BUDGET_ERROR);
  const [creditBlock, setCreditBlock] = useState(null);   // 402 insufficient-credits info

  const clearBudgetError = useCallback(() => {
    setBudgetError(INITIAL_BUDGET_ERROR);
  }, []);

  const pollingRef   = useRef(null); // setInterval handle
  const startTimeRef = useRef(null); // when polling started

  // ── Polling cleanup ───────────────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      console.log('🛑 Content polling stopped');
    }
  }, []);

  // Stop polling on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Load past jobs ────────────────────────────────────────────────────────

  const loadJobs = useCallback(async () => {
    if (!scenarioId) return;
    try {
      setJobsLoading(true);
      const response = await fetch(
        `${API_BASE}/api/content/scenarios/${scenarioId}/jobs`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
        console.log(`📋 Content jobs loaded: ${data.total}`);
      } else {
        console.warn('⚠️ Failed to load content jobs:', response.status);
      }
    } catch (error) {
      console.error('⚠️ loadJobs error:', error);
    } finally {
      setJobsLoading(false);
    }
  }, [scenarioId]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // ── Polling loop ──────────────────────────────────────────────────────────

  const startPolling = useCallback((jobId, contentType) => {
    stopPolling();
    startTimeRef.current = Date.now();
    console.log(`⏳ Polling content job ${jobId} (${contentType})...`);

    pollingRef.current = setInterval(async () => {
      // Hard timeout guard
      if (Date.now() - startTimeRef.current > POLL_TIMEOUT_MS) {
        stopPolling();
        setState(prev => ({
          ...prev,
          status: 'failed',
          error:  'Generation timed out — please try again.',
        }));
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/api/content/jobs/${jobId}`,
          { credentials: 'include' }
        );

        if (!response.ok) {
          console.warn('⚠️ Poll request failed:', response.status);
          return;
        }

        const job       = await response.json();
        const jobStatus = job.status;

        // Always update progress
        setState(prev => ({
          ...prev,
          progress:  job.progress || prev.progress,
          activeJob: { ...job, id: job.id || jobId },
        }));

        console.log(
          `📊 Poll: job=${jobId} status=${jobStatus} ` +
          `progress=${Math.round((job.progress || 0) * 100)}%`
        );

        if (jobStatus === 'complete') {
          stopPolling();
          setState({
            status:    'complete',
            activeJob: { ...job, id: job.id || jobId },
            error:     null,
            progress:  1,
          });
          await loadJobs();

        } else if (jobStatus === 'failed') {
          stopPolling();
          setState({
            status:    'failed',
            activeJob: null,
            // job.error_message comes from the backend worker — already a safe string
            error:     job.error_message || 'Generation failed — please try again.',
            progress:  0,
          });

        } else if (jobStatus === 'cancelled') {
          stopPolling();
          setState({ status: 'idle', activeJob: null, error: null, progress: 0 });
          await loadJobs();
        }
        // 'processing' / 'pending' → keep polling

      } catch (e) {
        // Polling errors are transient — log and retry on next interval
        console.warn('⚠️ Polling error (will retry):', e.message);
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling, loadJobs]);

  // ── Create content ────────────────────────────────────────────────────────

  const createContent = useCallback(async ({
    contentType     = 'script',
    durationSeconds = 180,
    messageIds      = [],
    scriptFormat    = 'screenplay',
    storyStyle      = 'debate',
    videoStyle      = 'realistic',
    intro           = false,
    outro           = false,
  } = {}) => {
    if (!scenarioId) {
      console.error('❌ createContent: scenarioId missing');
      return;
    }

    const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';

    // Stop any existing poll before starting a new job
    stopPolling();
    setState({
      status:    'creating',
      activeJob: { content_type: contentType, progress: 0 }, // known up-front so progress UI shows
      error:     null,
      progress:  0,
    });

    console.log('📝 Creating content:', { contentType, durationSeconds, scenarioId });

    try {
      const response = await fetch(`${API_BASE}/api/content/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf,
        },
        credentials: 'include',
        body: JSON.stringify({
          scenario_id:      scenarioId,
          content_type:     contentType,
          duration_seconds: durationSeconds,
          message_ids:      messageIds,
          script_format:    scriptFormat,
          story_style:      storyStyle,
          video_style:      videoStyle,
          intro:            intro,
          outro:            outro,
        }),
      });

      const data = await response.json();

      if (!response.ok) {

        // ── Insufficient credits (402) — the points ledger's gate ────────────
        // Replaces the retired seconds-budget 403. Populates creditBlock →
        // caller renders the InsufficientCreditsBanner. Does NOT set state.error.
        if (response.status === 402 || data.error === 'insufficient_credits') {
          setCreditBlock({
            needed:    data.needed,
            available: data.available,
            shortBy:   data.short_by,
            title:     data.title,
            message:   data.message,
          });
          setState(prev => ({ ...prev, status: 'idle', activeJob: null, progress: 0 }));
          return;
        }

        // ── Budget gate — 403 with known shape (RETIRED: backend no longer 403s
        // on budget; kept as a harmless fallback so any legacy path still surfaces). ─
        if (ApiErrorService.isBudgetError(response.status, data)) {
          setBudgetError({
            hit:           true,
            secondsUsed:   data.seconds_used   ?? null,
            budget:        data.budget          ?? null,
            suggestedTier: data.suggested_tier  ?? null,
          });
          // Reset to idle — do not leave spinner running
          setState(prev => ({
            ...prev,
            status:    'idle',
            activeJob: null,
            progress:  0,
          }));
          // Return undefined — caller (ScenarioChatWindow) checks budgetError.hit
          return;
        }

        // ── fal / Nano / Hailuo credit exhaustion ────────────────────────────
        // Logged server-side. Show a specific user message so they know it's us.
        if (ApiErrorService.isFalCreditError(response.status, data)) {
          ApiErrorService.log('useContentGeneration.createContent', response.status, data);
          throw new Error(ApiErrorService.getMessage(response.status, data));
        }

        // ── All other errors ─────────────────────────────────────────────────
        ApiErrorService.log('useContentGeneration.createContent', response.status, data);
        throw new Error(ApiErrorService.getMessage(response.status, data));
      }

      // ── 201: Script — synchronous complete ───────────────────────────────
      if (response.status === 201) {
        const normalizedJob = { ...data, id: data.id || data.job_id };
        setState({
          status:    'complete',
          activeJob: normalizedJob,
          error:     null,
          progress:  1,
        });
        await loadJobs();
        console.log('✅ Script job complete:', normalizedJob.id);
        return data;
      }

      // ── 202: Audio / Video — async, start polling ─────────────────────────
      if (response.status === 202) {
        const jobId = data.job_id;
        setState({
          status:    'creating',
          activeJob: { id: jobId, content_type: contentType, progress: 0 },
          error:     null,
          progress:  0,
        });
        startPolling(jobId, contentType);
        console.log(`⏳ Async job queued: ${jobId} (${contentType})`);
        return data;
      }

      // Unexpected success status — treat as complete
      const normalizedJob = { ...data, id: data.id || data.job_id };
      setState({ status: 'complete', activeJob: normalizedJob, error: null, progress: 1 });
      await loadJobs();
      return data;

    } catch (error) {
      // error.message is already user-friendly at this point —
      // either mapped by ApiErrorService above or a network failure.
      ApiErrorService.log('useContentGeneration.createContent [catch]', 0, { error: error.message });
      stopPolling();
      setState({
        status:    'failed',
        activeJob: null,
        error:     ApiErrorService.getNetworkMessage(error),
        progress:  0,
      });
      throw error;
    }
  }, [scenarioId, loadJobs, stopPolling, startPolling]);

  // ── Reset ─────────────────────────────────────────────────────────────────

  const resetContent = useCallback(() => {
    stopPolling();
    setState(INITIAL_STATE);
  }, [stopPolling]);

  // ── Cancel (stop) an in-flight job ───────────────────────────────────────

  const cancelContent = useCallback(async (jobId) => {
    console.log('🛑 cancelContent called with jobId=', jobId);
    if (!jobId) { console.warn('cancelContent: no jobId — aborting'); return; }
    const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';
    // Optimistic: stop polling + return UI to idle; worker stops at next beat.
    stopPolling();
    setState(INITIAL_STATE);
    try {
      await fetch(`${API_BASE}/api/content/jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrf },
        credentials: 'include',
      });
      console.log(`🛑 Cancel requested: job ${jobId}`);
    } catch (e) {
      console.warn('⚠️ cancel request failed:', e.message);
    } finally {
      await loadJobs();
    }
  }, [stopPolling, loadJobs]);

  // ── Delete a job (+ its stored media) ────────────────────────────────────

  const deleteJob = useCallback(async (jobId) => {
    console.log('🗑️ deleteJob called with jobId=', jobId);
    if (!jobId) { console.warn('deleteJob: no jobId — aborting'); return; }
    const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';
    try {
      const res = await fetch(`${API_BASE}/api/content/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf },
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        ApiErrorService.log('useContentGeneration.deleteJob', res.status, body);
        throw new Error(ApiErrorService.getMessage(res.status, body));
      }
      console.log(`🗑️ Deleted job ${jobId}`);
      // If we deleted the job currently shown, clear it.
      setState(prev =>
        prev.activeJob?.id === jobId ? INITIAL_STATE : prev
      );
    } catch (e) {
      console.error('❌ deleteJob failed:', e);
    } finally {
      await loadJobs();
    }
  }, [loadJobs]);

  // ── Generate a poster (sync; returns a content_type='poster' job) ─────────

  const generatePoster = useCallback(async ({
    title = '', aspect = 'portrait', videoStyle = 'realistic', prompt = '',
  } = {}) => {
    if (!scenarioId) return;
    const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';
    stopPolling();
    setState({ status: 'creating', activeJob: { content_type: 'poster', progress: 0 }, error: null, progress: 0 });
    try {
      const res = await fetch(`${API_BASE}/api/content/scenarios/${scenarioId}/poster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'include',
        body: JSON.stringify({ title, aspect, video_style: videoStyle, prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        ApiErrorService.log('useContentGeneration.generatePoster', res.status, data);
        throw new Error(ApiErrorService.getMessage(res.status, data));
      }

      // Async (202): poster renders on the RQ worker → poll until complete.
      const jobId = data.job_id || data.id;
      setState({
        status:    'creating',
        activeJob: { id: jobId, content_type: 'poster', progress: 0 },
        error:     null,
        progress:  0,
      });
      startPolling(jobId, 'poster');
      console.log(`⏳ Poster queued: ${jobId}`);
      return data;
    } catch (e) {
      ApiErrorService.log('useContentGeneration.generatePoster [catch]', 0, { error: e.message });
      stopPolling();
      setState({
        status:    'failed',
        activeJob: null,
        error:     ApiErrorService.getNetworkMessage(e),
        progress:  0,
      });
      throw e;
    }
  }, [scenarioId, startPolling, stopPolling]);

  // ── Suggest critical messages (pre-select) ────────────────────────────────
  // GET the LLM-ranked critical message ids for the "choose what goes in" step.
  // Defensive: never throws. Returns { suggested_ids: number[] | null }.
  //   • array  → use these as the pre-checked set
  //   • null   → caller should fall back to "all selected" (today's behaviour)
  const suggestMessages = useCallback(async () => {
    if (!scenarioId) return { suggested_ids: null };
    try {
      const response = await fetch(
        `${API_BASE}/api/content/scenarios/${scenarioId}/suggest-messages`,
        { credentials: 'include' }
      );
      if (!response.ok) {
        console.warn('🎯 suggestMessages: non-OK', response.status);
        return { suggested_ids: null };
      }
      const data = await response.json();
      return {
        suggested_ids: Array.isArray(data.suggested_ids) ? data.suggested_ids : null,
      };
    } catch (error) {
      console.warn('🎯 suggestMessages failed:', error);
      return { suggested_ids: null };
    }
  }, [scenarioId]);

  return {
    state,            // { status, activeJob, error, progress }
    jobs,             // ContentJob[] — past completed jobs
    jobsLoading,
    budgetError,      // { hit, ... } — legacy seconds-budget (retired; no longer fires)
    creditBlock,      // { needed, available, shortBy, title, message } — set on a 402
    createContent,    // (params) => Promise<job> — returns undefined on a credit block
    suggestMessages,  // () => Promise<{ suggested_ids: number[] | null }>
    generatePoster,   // (params) => Promise<job>
    cancelContent,    // (jobId) => void — stop an in-flight job
    deleteJob,        // (jobId) => void — delete a job + its media
    loadJobs,         // () => void — manual refresh
    resetContent,     // () => void
    clearBudgetError, // () => void — reset (legacy) budget banner
    clearCreditBlock: () => setCreditBlock(null),   // () => void — reset the 402 banner
  };
}