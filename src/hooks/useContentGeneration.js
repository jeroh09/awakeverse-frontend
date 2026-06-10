// src/hooks/useContentGeneration.js
// Complete rewrite — adds async polling for audio and video jobs.
// Script (201) → immediate complete.
// Audio/Video (202) → poll every 5s until complete or failed.

import { useState, useCallback, useEffect, useRef } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

const POLL_INTERVAL_MS = 5000;   // poll every 5s
const POLL_TIMEOUT_MS  = 45 * 60 * 1000;  // 45min hard stop (matches job_timeout)

const INITIAL_STATE = {
  status:    'idle',      // 'idle' | 'creating' | 'complete' | 'failed'
  activeJob: null,        // full job dict
  error:     null,
  progress:  0,           // 0.0 → 1.0, from job.progress during polling
};

export default function useContentGeneration(scenarioId) {

  const [state,       setState]      = useState(INITIAL_STATE);
  const [jobs,        setJobs]       = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  const pollingRef   = useRef(null);   // setInterval handle
  const startTimeRef = useRef(null);   // when polling started

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
          error:  'Generation timed out. Please try again.',
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

        const job = await response.json();
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
            error:     job.error_message || 'Generation failed',
            progress:  0,
          });
        } else if (jobStatus === 'cancelled') {
          stopPolling();
          setState({ status: 'idle', activeJob: null, error: null, progress: 0 });
          await loadJobs();
        }
        // 'processing' / 'pending' → keep polling

      } catch (e) {
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
  } = {}) => {
    if (!scenarioId) {
      console.error('❌ createContent: scenarioId missing');
      return;
    }

    const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';

    // Stop any existing poll before starting a new job
    stopPolling();
    setState({ status: 'creating', activeJob: null, error: null, progress: 0 });

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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed: ${response.status}`);
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
      console.error('❌ createContent failed:', error);
      stopPolling();
      setState({ status: 'failed', activeJob: null, error: error.message, progress: 0 });
      throw error;
    }
  }, [scenarioId, loadJobs, stopPolling, startPolling]);

  // ── Reset ─────────────────────────────────────────────────────────────────

  const resetContent = useCallback(() => {
    stopPolling();
    setState(INITIAL_STATE);
  }, [stopPolling]);

  // ── Cancel (stop) an in-flight job ──────────────────────────────────────────

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

  // ── Delete a job (+ its stored media) ───────────────────────────────────────

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
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Delete failed: ${res.status}`);
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

  // ── Generate a poster (sync; returns a content_type='poster' job) ──────────

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
      if (!res.ok) throw new Error(data.error || `Poster failed: ${res.status}`);

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
      console.error('❌ generatePoster failed:', e);
      stopPolling();
      setState({ status: 'failed', activeJob: null, error: e.message, progress: 0 });
      throw e;
    }
  }, [scenarioId, startPolling, stopPolling]);

  return {
    state,          // { status, activeJob, error, progress }
    jobs,           // ContentJob[] — past completed jobs
    jobsLoading,
    createContent,  // (params) => Promise<job>
    generatePoster, // (params) => Promise<job> — sync poster
    cancelContent,  // (jobId) => void — stop an in-flight job
    deleteJob,      // (jobId) => void — delete a job + its media
    loadJobs,       // () => void — manual refresh
    resetContent,   // () => void
  };
}