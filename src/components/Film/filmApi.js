// src/components/Film/filmApi.js
// Film endpoints on the SHARED axios instance, so the app's CSRF interceptor
// (av_csrf -> X-CSRF-Token), cookie credentials, and one-time token refresh all
// apply automatically — same pattern as getMyScenarios/createScenario in api.js.
//
// Placement: this file sits in src/components/Film/ and imports the instance from
// src/api.js via '../../api'. If you relocate it, fix only that one import.
// baseURL is `${API_BASE_URL}/api`, so every path here is relative to /api.

import api from '../../api';

// ── writers' room (authoring) ──
export const filmStart    = () =>
  api.post('/film/assistant/start').then(r => r.data);

export const filmMessage  = (session_id, message, target_duration) =>
  api.post('/film/assistant/message',
    { session_id, message, ...(target_duration ? { target_duration } : {}) }).then(r => r.data);

export const filmFinalize = (session_id) =>
  api.post('/film/assistant/finalize', { session_id }).then(r => r.data);

// ── job (generate + poll + edit) ──
export const filmGenerate = ({ script, title, duration_seconds, video_style, intro, outro_theme }) =>
  api.post('/film/generate',
    { script, title, duration_seconds, video_style, intro, outro_theme }).then(r => r.data);

export const filmGetJob   = (jobId) =>
  api.get(`/film/jobs/${jobId}`).then(r => r.data);

export const filmCancel   = (jobId) =>
  api.post(`/film/jobs/${jobId}/cancel`).then(r => r.data);

export const filmReassemble = (jobId, beats, captions) =>
  api.post(`/film/jobs/${jobId}/reassemble`,
    { beats, ...(captions != null ? { captions } : {}) }).then(r => r.data);

export const filmRegenerate = (jobId, beat_index, note) =>
  api.post(`/film/jobs/${jobId}/regenerate`,
    { beat_index, note: note || null }).then(r => r.data);

// Map an axios error to a user-safe message — never leak a raw 401/500/stack.
export function friendlyError(e, fallback = 'Something went wrong. Please try again.') {
  const status = e && e.response && e.response.status;
  const detail = (e && e.response && e.response.data && e.response.data.error) || (e && e.message) || '';
  if (status === 401 || status === 403 || /csrf|unauthor/i.test(detail))
    return 'Your session expired — please refresh and try again.';
  if (status === 429 || /rate/i.test(detail)) return 'The service is busy — try again in a moment.';
  if (e && (e.code === 'ECONNABORTED' || /timeout|network/i.test(String(e.message))))
    return 'Connection hiccup — try that again.';
  return fallback;
}