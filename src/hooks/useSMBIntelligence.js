// src/hooks/useSMBIntelligence.js
/**
 * useSMBIntelligence
 * ==================
 * Manages all state and API calls for the SMB Intelligence features
 * in Creator Hub Business Mode.
 *
 * Responsibilities:
 *   - Scenario CRUD
 *   - Brief generation trigger + job polling
 *   - Snapshot list, approve, dismiss, note
 *   - Creator notes (shared above Creator/Business toggle)
 *
 * API layer:
 *   Uses the shared `api` axios instance from ../../api.
 *   CSRF is attached automatically by the request interceptor.
 *   No manual token handling needed.
 *
 * Naming map (Frontend → Backend):
 *   scenarios            GET  /api/smb/scenarios
 *   activeScenario       GET  /api/smb/scenarios/:id
 *   snapshots            GET  /api/smb/scenarios/:id/snapshots
 *   pendingSnapshot      derived — first snapshot where status === 'ready_for_review'
 *   jobId / jobStatus    POST /api/smb/scenarios/:id/generate → job_id
 *                        GET  /api/smb/jobs/:job_id            → status
 *   notes                GET  /api/smb/notes
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../api';

// How often to poll a running job (ms)
const POLL_INTERVAL_MS = 5000;


// ─────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────

export default function useSMBIntelligence() {

  // ── Scenarios ────────────────────────────────────────────
  const [scenarios, setScenarios]           = useState([]);
  const [scenariosLoading, setScenariosLoading] = useState(false);
  const [scenariosError, setScenariosError] = useState(null);

  // ── Active scenario + its snapshots ──────────────────────
  const [activeScenario, setActiveScenario] = useState(null);
  const [snapshots, setSnapshots]           = useState([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);

  // ── Brief generation job ─────────────────────────────────
  const [jobId, setJobId]         = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  // 'idle' | 'running' | 'complete' | 'failed'
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const pollRef = useRef(null);   // holds the setInterval id

  // ── Snapshot actions ─────────────────────────────────────
  const [actionLoading, setActionLoading] = useState(null);
  // stores snapshot id currently being actioned, null when idle

  // ── Notes ────────────────────────────────────────────────
  const [notes, setNotes]           = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState(null);

  // ── Scenario creation form ───────────────────────────────
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState(null);


  // ─────────────────────────────────────────────────────────
  // Derived
  // ─────────────────────────────────────────────────────────

  const pendingSnapshot = snapshots.find(s => s.status === 'ready_for_review') || null;
  const approvedSnapshots = snapshots.filter(s => s.status === 'approved');


  // ─────────────────────────────────────────────────────────
  // Scenarios
  // ─────────────────────────────────────────────────────────

  const loadScenarios = useCallback(async () => {
    setScenariosLoading(true);
    setScenariosError(null);
    try {
      const res = await api.get('/smb/scenarios');
      setScenarios(res.data.scenarios || []);
    } catch (err) {
      console.error('useSMBIntelligence: loadScenarios failed', err);
      setScenariosError(err.response?.data?.error || 'Failed to load scenarios');
    } finally {
      setScenariosLoading(false);
    }
  }, []);

  const createScenario = useCallback(async (formData) => {
    // formData: { name, sector, geography, rss_feeds, keyword_filters, competitor_names }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await api.post('/smb/scenarios', formData);
      const newScenario = res.data.scenario;
      setScenarios(prev => [newScenario, ...prev]);
      return newScenario;
    } catch (err) {
      console.error('useSMBIntelligence: createScenario failed', err);
      const msg = err.response?.data?.error || 'Failed to create scenario';
      setCreateError(msg);
      return null;
    } finally {
      setCreating(false);
    }
  }, []);

  const updateScenario = useCallback(async (scenarioId, patch) => {
    try {
      const res = await api.patch(`/smb/scenarios/${scenarioId}`, patch);
      const updated = res.data.scenario;
      setScenarios(prev =>
        prev.map(s => s.id === scenarioId ? updated : s)
      );
      if (activeScenario?.id === scenarioId) {
        setActiveScenario(updated);
      }
      return updated;
    } catch (err) {
      console.error('useSMBIntelligence: updateScenario failed', err);
      return null;
    }
  }, [activeScenario]);

  const deleteScenario = useCallback(async (scenarioId) => {
    try {
      await api.delete(`/smb/scenarios/${scenarioId}`);
      setScenarios(prev => prev.filter(s => s.id !== scenarioId));
      if (activeScenario?.id === scenarioId) {
        setActiveScenario(null);
        setSnapshots([]);
      }
      return true;
    } catch (err) {
      console.error('useSMBIntelligence: deleteScenario failed', err);
      return false;
    }
  }, [activeScenario]);

  const selectScenario = useCallback((scenario) => {
    setActiveScenario(scenario);
  }, []);


  // ─────────────────────────────────────────────────────────
  // Snapshots — load when activeScenario changes
  // ─────────────────────────────────────────────────────────

  const loadSnapshots = useCallback(async (scenarioId) => {
    if (!scenarioId) return;
    setSnapshotsLoading(true);
    try {
      const res = await api.get(`/smb/scenarios/${scenarioId}/snapshots`);
      setSnapshots(res.data.snapshots || []);
    } catch (err) {
      console.error('useSMBIntelligence: loadSnapshots failed', err);
      setSnapshots([]);
    } finally {
      setSnapshotsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeScenario?.id) {
      loadSnapshots(activeScenario.id);
    } else {
      setSnapshots([]);
    }
  }, [activeScenario?.id, loadSnapshots]);


  // ─────────────────────────────────────────────────────────
  // Brief generation + job polling
  // ─────────────────────────────────────────────────────────

  const _stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const _pollJob = useCallback(async (id) => {
    try {
      const res = await api.get(`/smb/jobs/${id}`);
      const status = res.data.status;
      setJobStatus(status);

      if (status === 'complete') {
        _stopPolling();
        setGenerating(false);
        // Reload snapshots so the new one appears
        if (activeScenario?.id) {
          await loadSnapshots(activeScenario.id);
        }
      } else if (status === 'failed') {
        _stopPolling();
        setGenerating(false);
        setGenerateError(res.data.error || 'Brief generation failed');
      }
    } catch (err) {
      console.error('useSMBIntelligence: poll failed', err);
      // Don't stop polling on transient network error — try again next tick
    }
  }, [activeScenario?.id, loadSnapshots, _stopPolling]);

  const generateBrief = useCallback(async (scenarioId) => {
    if (generating) return;   // prevent double-tap
    setGenerating(true);
    setGenerateError(null);
    setJobId(null);
    setJobStatus('running');
    _stopPolling();

    try {
      const res = await api.post(`/smb/scenarios/${scenarioId}/generate`);
      const id = res.data.job_id;
      setJobId(id);

      // Start polling
      pollRef.current = setInterval(() => _pollJob(id), POLL_INTERVAL_MS);

    } catch (err) {
      console.error('useSMBIntelligence: generateBrief failed', err);
      setGenerateError(err.response?.data?.error || 'Failed to start brief generation');
      setGenerating(false);
      setJobStatus('failed');
    }
  }, [generating, _pollJob, _stopPolling]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => _stopPolling();
  }, [_stopPolling]);


  // ─────────────────────────────────────────────────────────
  // Snapshot actions
  // ─────────────────────────────────────────────────────────

  const approveSnapshot = useCallback(async (snapshotId) => {
    setActionLoading(snapshotId);
    try {
      await api.post(`/smb/snapshots/${snapshotId}/approve`);
      // Update local state — avoids a full reload
      setSnapshots(prev =>
        prev.map(s =>
          s.id === snapshotId
            ? { ...s, status: 'approved', reviewed_at: new Date().toISOString() }
            : s
        )
      );
      return true;
    } catch (err) {
      console.error('useSMBIntelligence: approveSnapshot failed', err);
      return false;
    } finally {
      setActionLoading(null);
    }
  }, []);

  const dismissSnapshot = useCallback(async (snapshotId) => {
    setActionLoading(snapshotId);
    try {
      await api.post(`/smb/snapshots/${snapshotId}/dismiss`);
      setSnapshots(prev =>
        prev.map(s =>
          s.id === snapshotId
            ? { ...s, status: 'dismissed', reviewed_at: new Date().toISOString() }
            : s
        )
      );
      return true;
    } catch (err) {
      console.error('useSMBIntelligence: dismissSnapshot failed', err);
      return false;
    } finally {
      setActionLoading(null);
    }
  }, []);

  const updateSnapshotNote = useCallback(async (snapshotId, note) => {
    setActionLoading(snapshotId);
    try {
      const res = await api.patch(`/smb/snapshots/${snapshotId}/note`, { note });
      setSnapshots(prev =>
        prev.map(s =>
          s.id === snapshotId
            ? { ...s, owner_note: res.data.owner_note }
            : s
        )
      );
      return true;
    } catch (err) {
      console.error('useSMBIntelligence: updateSnapshotNote failed', err);
      return false;
    } finally {
      setActionLoading(null);
    }
  }, []);

  const downloadSnapshot = useCallback((snapshotId, format = 'pdf') => {
    // Opens download directly in the browser — no async needed
    const url = `${api.defaults.baseURL}/smb/snapshots/${snapshotId}/download?format=${format}`;
    window.open(url, '_blank');
  }, []);


  // ─────────────────────────────────────────────────────────
  // Notes
  // ─────────────────────────────────────────────────────────

  const loadNotes = useCallback(async (tag = null) => {
    setNotesLoading(true);
    setNotesError(null);
    try {
      const url = tag ? `/smb/notes?tag=${tag}` : '/smb/notes';
      const res = await api.get(url);
      setNotes(res.data.notes || []);
    } catch (err) {
      console.error('useSMBIntelligence: loadNotes failed', err);
      setNotesError(err.response?.data?.error || 'Failed to load notes');
    } finally {
      setNotesLoading(false);
    }
  }, []);

  const createNote = useCallback(async (content, tag = null) => {
    try {
      const res = await api.post('/smb/notes', { content, tag });
      const newNote = res.data.note;
      setNotes(prev => [newNote, ...prev]);
      return newNote;
    } catch (err) {
      console.error('useSMBIntelligence: createNote failed', err);
      return null;
    }
  }, []);

  const updateNote = useCallback(async (noteId, patch) => {
    // patch: { content?, tag? }
    try {
      const res = await api.patch(`/smb/notes/${noteId}`, patch);
      const updated = res.data.note;
      setNotes(prev =>
        prev.map(n => n.id === noteId ? updated : n)
      );
      return updated;
    } catch (err) {
      console.error('useSMBIntelligence: updateNote failed', err);
      return null;
    }
  }, []);

  const deleteNote = useCallback(async (noteId) => {
    try {
      await api.delete(`/smb/notes/${noteId}`);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      return true;
    } catch (err) {
      console.error('useSMBIntelligence: deleteNote failed', err);
      return false;
    }
  }, []);


  // ─────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────

  return {
    // ── Scenarios ──────────────────────────────────────────
    scenarios,
    scenariosLoading,
    scenariosError,
    loadScenarios,
    createScenario,
    updateScenario,
    deleteScenario,
    creating,
    createError,

    // ── Active scenario ────────────────────────────────────
    activeScenario,
    selectScenario,

    // ── Snapshots ──────────────────────────────────────────
    snapshots,
    snapshotsLoading,
    pendingSnapshot,       // derived: first ready_for_review
    approvedSnapshots,     // derived: all approved
    loadSnapshots,

    // ── Brief generation ───────────────────────────────────
    generating,
    jobId,
    jobStatus,
    generateError,
    generateBrief,

    // ── Snapshot actions ───────────────────────────────────
    actionLoading,         // snapshotId currently being acted on, or null
    approveSnapshot,
    dismissSnapshot,
    updateSnapshotNote,
    downloadSnapshot,

    // ── Notes ──────────────────────────────────────────────
    notes,
    notesLoading,
    notesError,
    loadNotes,
    createNote,
    updateNote,
    deleteNote,
  };
}