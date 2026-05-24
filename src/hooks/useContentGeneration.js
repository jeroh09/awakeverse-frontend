// src/hooks/useContentGeneration.js
// Mirrors useVideoGeneration pattern exactly.
// Manages content job state + past jobs list for InfoPanel.

import { useState, useCallback, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

const INITIAL_STATE = {
  status: 'idle',    // 'idle' | 'creating' | 'complete' | 'failed'
  activeJob: null,   // full job dict returned from POST /api/content/generate
  error: null,
};

export default function useContentGeneration(scenarioId) {

  const [state, setState]           = useState(INITIAL_STATE);
  const [jobs, setJobs]             = useState([]);   // past jobs — feeds InfoPanel list
  const [jobsLoading, setJobsLoading] = useState(false);

  // ── Load existing jobs on mount / scenarioId change ──────────────────────
  // Populates InfoPanel with previously generated content immediately on open.
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

  // ── Create content ────────────────────────────────────────────────────────
  // Called from InfoPanel Create panel "Generate" button (not from MessageBubble).
  // MessageBubble only opens the Create panel — it does NOT call this directly.
  const createContent = useCallback(async ({
    contentType    = 'script',
    durationSeconds = 180,
    messageIds     = [],         // empty = use all messages for scenario
    scriptFormat   = 'screenplay',
  } = {}) => {
    if (!scenarioId) {
      console.error('❌ createContent: scenarioId missing');
      return;
    }

    const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';

    setState({ status: 'creating', activeJob: null, error: null });
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed: ${response.status}`);
      }

      console.log('✅ Content job complete:', data.job_id);

      const normalizedJob = { ...data, id: data.id || data.job_id };
      setState({ status: 'complete', activeJob: normalizedJob, error: null });

      // Refresh list so new job appears in InfoPanel immediately
      await loadJobs();

      return data;

    } catch (error) {
      console.error('❌ createContent failed:', error);
      setState({ status: 'failed', activeJob: null, error: error.message });
      throw error;
    }
  }, [scenarioId, loadJobs]);

  // ── Reset to idle (called when user closes viewer or dismisses error) ─────
  const resetContent = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    state,          // { status, activeJob, error }
    jobs,           // ContentJob[] — feeds InfoPanel list
    jobsLoading,
    createContent,  // (params) => Promise<job>
    loadJobs,       // () => void — manual refresh
    resetContent,   // () => void
  };
}