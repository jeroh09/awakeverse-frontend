// src/components/Film/filmApi.js
// Film endpoints on the SHARED axios instance, so the app's CSRF interceptor
// (av_csrf -> X-CSRF-Token), cookie credentials, and one-time token refresh all
// apply automatically — same pattern as getMyScenarios/createScenario in api.js.
//
// IMPORTANT: the shared axios instance defaults to a 10s timeout, but the
// writers'-room calls run LLM generation server-side and routinely take 15-30s
// (a real render-planning turn can approach the backend's 120s Gemini ceiling).
// So the LLM-bound calls pass an explicit longer per-request timeout. Without it
// axios aborts at 10s and the UI shows a false "hiccup" while the backend is
// still working — the exact failure seen in testing.
//
// Placement: src/components/Film/ importing the instance via '../../api'.

import api from '../../api';

const LLM_TIMEOUT = 125000;   // just over the backend's 120s Gemini ceiling
const QUEUE_TIMEOUT = 30000;  // POSTs that only enqueue (return 202) — quick, but be generous

// ── writers' room (authoring) ──
export const filmStart    = () =>
  api.post('/film/assistant/start').then(r => r.data);

export const filmMessage  = (session_id, message, target_duration) =>
  api.post('/film/assistant/message',
    { session_id, message, ...(target_duration ? { target_duration } : {}) },
    { timeout: LLM_TIMEOUT }).then(r => r.data);

export const filmFinalize = (session_id) =>
  api.post('/film/assistant/finalize', { session_id }, { timeout: LLM_TIMEOUT }).then(r => r.data);

// ── job (generate + poll + edit) ──
export const filmGenerate = ({ script, title, duration_seconds, video_style, intro, outro_theme, film_project_id }) =>
  api.post('/film/generate',
    { script, title, duration_seconds, video_style, intro, outro_theme, film_project_id },
    { timeout: QUEUE_TIMEOUT }).then(r => r.data);

export const filmGetJob   = (jobId) =>
  api.get(`/film/jobs/${jobId}`).then(r => r.data);

export const filmCancel   = (jobId) =>
  api.post(`/film/jobs/${jobId}/cancel`, null, { timeout: QUEUE_TIMEOUT }).then(r => r.data);

export const filmReassemble = (jobId, beats, captions) =>
  api.post(`/film/jobs/${jobId}/reassemble`,
    { beats, ...(captions != null ? { captions } : {}) },
    { timeout: QUEUE_TIMEOUT }).then(r => r.data);

export const filmRegenerate = (jobId, beat_index, note, edited_text) =>
  api.post(`/film/jobs/${jobId}/regenerate`,
    { beat_index, note: note || null, edited_text: edited_text || null },
    { timeout: QUEUE_TIMEOUT }).then(r => r.data);

// ── film projects (the "movie" record: chat + script + render history) ──
export const filmCreateProject = ({ title, video_style, duration_seconds } = {}) =>
  api.post('/film/projects',
    { title, video_style, duration_seconds }, { timeout: QUEUE_TIMEOUT }).then(r => r.data);

export const filmListProjects = () =>
  api.get('/film/projects').then(r => r.data);

export const filmGetProject = (projectId) =>
  api.get(`/film/projects/${projectId}`).then(r => r.data);

export const filmDeleteProject = (projectId) =>
  api.delete(`/film/projects/${projectId}`, { timeout: QUEUE_TIMEOUT }).then(r => r.data);

// Map an axios error to a user-safe message — never leak a raw 401/500/stack.
export function friendlyError(e, fallback = 'Something went wrong. Please try again.') {
  const status = e && e.response && e.response.status;
  const detail = (e && e.response && e.response.data && e.response.data.error) || (e && e.message) || '';
  if (e && e.code === 'ECONNABORTED')
    return 'That took longer than expected — it may still be working. Give it a moment and try again.';
  if (status === 401 || status === 403 || /csrf|unauthor/i.test(detail))
    return 'Your session expired — please refresh and try again.';
  if (status === 429 || /rate/i.test(detail)) return 'The service is busy — try again in a moment.';
  if (/timeout|network/i.test(String(e && e.message))) return 'Connection hiccup — try that again.';
  return fallback;
}