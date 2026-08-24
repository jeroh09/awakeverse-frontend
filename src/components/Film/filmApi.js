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
import environment from '../../config/environment';

const LLM_TIMEOUT = 125000;   // just over the backend's 120s Gemini ceiling
const QUEUE_TIMEOUT = 30000;  // POSTs that only enqueue (return 202) — quick, but be generous

// ── writers' room (authoring) ──
export const filmStart    = () =>
  api.post('/film/assistant/start').then(r => r.data);

export const filmMessage  = (session_id, message, target_duration) =>
  api.post('/film/assistant/message',
    { session_id, message, ...(target_duration ? { target_duration } : {}) },
    { timeout: LLM_TIMEOUT }).then(r => r.data);

// Streaming variant of filmMessage — bypasses the shared axios instance (axios
// can't hand back a readable ReadableStream in the browser) exactly the way
// api.js's postDebateMessage does for /debate/:id/message: raw fetch, CSRF
// pulled by hand from the av_csrf cookie, credentials included manually.
// Returns the raw Response so the caller (useFilmAuthoring) reads
// response.body as a stream of NDJSON lines — see film_routes.py's
// /assistant/message docstring for the line shapes.
export const filmMessageStream = async (session_id, message, target_duration) => {
  const API_BASE = environment.API_BASE_URL;
  const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';
  const response = await fetch(`${API_BASE}/api/film/assistant/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': decodeURIComponent(csrf),
    },
    credentials: 'include',
    body: JSON.stringify({ session_id, message, ...(target_duration ? { target_duration } : {}) }),
  });

  if (!response.ok) {
    // Mirror axios's error shape closely enough for friendlyError() to still
    // work unmodified: an object with .response.status / .response.data.
    let data = {};
    try { data = await response.json(); } catch (_) {}
    const err = new Error(`HTTP ${response.status}`);
    err.response = { status: response.status, data };
    throw err;
  }
  return response; // caller reads response.body as a stream
};

export const filmFinalize = (session_id) =>
  api.post('/film/assistant/finalize', { session_id }, { timeout: LLM_TIMEOUT }).then(r => r.data);

// ── job (generate + poll + edit) ──
export const filmGenerate = ({ script, title, duration_seconds, video_style, aspect_ratio, intro, outro_theme, film_project_id }) =>
  api.post('/film/generate',
    { script, title, duration_seconds, video_style, aspect_ratio, intro, outro_theme, film_project_id },
    { timeout: QUEUE_TIMEOUT }).then(r => r.data);

export const filmGetJob   = (jobId) =>
  api.get(`/film/jobs/${jobId}`).then(r => r.data);

export const filmCancel   = (jobId) =>
  api.post(`/film/jobs/${jobId}/cancel`, null, { timeout: QUEUE_TIMEOUT }).then(r => r.data);

export const filmReassemble = (jobId, beats, captions) =>
  api.post(`/film/jobs/${jobId}/reassemble`,
    { beats, ...(captions != null ? { captions } : {}) },
    { timeout: QUEUE_TIMEOUT }).then(r => r.data);

export const filmRegenerate = (jobId, beat_index, note, edited_text, present) =>
  api.post(`/film/jobs/${jobId}/regenerate`,
    { beat_index, note: note || null, edited_text: edited_text || null,
      // an empty present list is never a valid instruction — it reads as
      // "cast of nobody" downstream (2026-08-21 narrator-wipe); omit unless
      // there are actual names
      ...(Array.isArray(present) && present.length ? { present } : {}) },
    { timeout: QUEUE_TIMEOUT }).then(r => r.data);

// ── plate review (Plan & review lifecycle: plan → awaiting_review → regenerate → approve) ──
// Save an edited script to the project (before render). The render path reads
// film_projects.script and condense_script fits it to the chosen duration.
export const filmSaveScript = (projectId, script) =>
  api.patch(`/film/projects/${projectId}/script`, { script }, { timeout: QUEUE_TIMEOUT }).then(r => r.data);

// filmPlan is filmGenerate with review:true — the backend routes it to the PLAN
// phase (director + character plates) and pauses at awaiting_review instead of
// rendering straight through. Same body/timeout as filmGenerate.
export const filmPlan = ({ script, title, duration_seconds, video_style, aspect_ratio, intro, outro_theme, film_project_id }) =>
  api.post('/film/generate',
    { script, title, duration_seconds, video_style, aspect_ratio, intro, outro_theme, film_project_id, review: true },
    { timeout: QUEUE_TIMEOUT }).then(r => r.data);

// Regenerate ONE character's plate from an edited description. SYNCHRONOUS on the
// backend (a live Nano call), so it gets the LLM timeout, not the queue one.
export const filmRegeneratePlate = (jobId, name, description) =>
  api.post(`/film/jobs/${jobId}/plate`, { name, description }, { timeout: LLM_TIMEOUT }).then(r => r.data);

// Approve the reviewed plan → starts the full render (Phase 3). Returns 202; the
// job flips to processing and the normal render poll takes over.
export const filmApproveRender = (jobId) =>
  api.post(`/film/jobs/${jobId}/approve`, null, { timeout: QUEUE_TIMEOUT }).then(r => r.data);

// ── image-to-film (internal; consent-gated) ──
// Record acceptance of the image-upload agreement. REQUIRED before any upload —
// the consent record is a standing liability cover, independent of Seedance's
// likeness gate (a render passing that gate does not establish the user's right
// to the face). The backend refuses uploads with a 403 { consent_required:true }
// until this is called.
export const filmUploadConsent = () =>
  api.post('/film/upload-consent', null, { timeout: QUEUE_TIMEOUT }).then(r => r.data);

// Upload a script file → extract text + sections. The FILE becomes the message
// attachment (chip); the returned text is delivered to the director invisibly.
// A flagged (injection) doc returns text:null — caller must not send it onward.
export const filmUploadAttachment = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/film/attachment', form,
    { timeout: LLM_TIMEOUT, headers: { 'Content-Type': 'multipart/form-data' } })
    .then(r => r.data);   // { url, filename, file_type, char_count, sections, injection_detected, text }
};

// Upload a raw image file → Spaces, returns { photo_url }. Reuses the existing,
// proven photo-upload endpoint (multipart; JPEG/PNG/WebP, 10MB max). The stylize
// pass re-hosts the result under the film cache, so the storage namespace here is
// immaterial. This is the file→URL step character-upload needs (it takes a URL).
export const filmUploadPhoto = (file) => {
  const form = new FormData();
  form.append('photo', file);
  return api.post('/podcast/photo/upload', form,
    { timeout: LLM_TIMEOUT, headers: { 'Content-Type': 'multipart/form-data' } })
    .then(r => r.data);   // { photo_url }
};

// Replace a reviewable character's plate with a STYLIZED version of an uploaded
// photo (photo already hosted → pass its URL). SYNCHRONOUS stylize on the backend
// → LLM timeout. Consent-gated (see filmUploadConsent).
export const filmUploadCharacterImage = (jobId, name, photo_url) =>
  api.post(`/film/jobs/${jobId}/character-upload`, { name, photo_url }, { timeout: LLM_TIMEOUT }).then(r => r.data);

// ── film projects (the "movie" record: chat + script + render history) ──
export const filmCreateProject = ({ title, video_style, duration_seconds, aspect_ratio } = {}) =>
  api.post('/film/projects',
    { title, video_style, duration_seconds, aspect_ratio }, { timeout: QUEUE_TIMEOUT }).then(r => r.data);

export const filmListProjects = () =>
  api.get('/film/projects').then(r => r.data);

export const filmGetProject = (projectId) =>
  api.get(`/film/projects/${projectId}`).then(r => r.data);

export const filmDeleteProject = (projectId) =>
  api.delete(`/film/projects/${projectId}`, { timeout: QUEUE_TIMEOUT }).then(r => r.data);

// Map an axios error to a user-safe message — never leak a raw 401/500/stack.
export function friendlyError(e, fallback = 'Something went wrong. Please try again.') {
  const status = e && e.response && e.response.status;
  const data = (e && e.response && e.response.data) || {};
  const detail = data.error || (e && e.message) || '';
  if (e && e.code === 'ECONNABORTED')
    return 'That took longer than expected — it may still be working. Give it a moment and try again.';
  // Shared video budget reached — show the informative hint, not a session error.
  if (status === 403 && /budget/i.test(detail))
    return data.hint || 'You’ve reached your monthly video budget. Upgrade to make more films.';
  if (status === 401 || status === 403 || /csrf|unauthor/i.test(detail))
    return 'Your session expired — please refresh and try again.';
  if (status === 429 || /rate/i.test(detail)) return 'The service is busy — try again in a moment.';
  if (/timeout|network/i.test(String(e && e.message))) return 'Connection hiccup — try that again.';
  return fallback;
}

// ── credits / points ledger ──
// Balance chip + expiry nudge.
export const filmCredits = () =>
  api.get('/credits').then(r => r.data);

// Pre-render cost + affordability, for the confirm UI.
// price('film','180') or price('podcast','default', 13)
export const filmPrice = (content_type, tier, n_beats) =>
  api.get('/credits/price', {
    params: { content_type, tier, ...(n_beats ? { n_beats } : {}) },
  }).then(r => r.data);

// Ledger history — where credits went.
export const filmCreditHistory = (limit = 50) =>
  api.get('/credits/history', { params: { limit } }).then(r => r.data);

// A 402 from a render POST carries { needed, available, short_by, message }.
// Detect it so the UI can show the top-up state instead of a generic error.
export function creditsBlocked(e) {
  const status = e && e.response && e.response.status;
  const data = (e && e.response && e.response.data) || {};
  if (status === 402 || data.error === 'insufficient_credits') {
    return {
      blocked: true,
      needed: data.needed, available: data.available, shortBy: data.short_by,
      title: data.title || 'Not enough credits',
      message: data.message || 'You need more credits to make this.',
    };
  }
  return { blocked: false };
}
// ── Series endpoints — append to src/components/Film/filmApi.js ──────────────
// Same shared `api` axios instance as every other film call, so the CSRF
// interceptor, cookie credentials, and token refresh all apply unchanged. No new
// credit paths: creating a series/episode or promoting/refreshing produces no
// video, so nothing is charged until an episode actually renders (which goes
// through the existing filmGenerate/filmPlan/filmApproveRender flow).

export const filmListSeries = () =>
  api.get('/film/series').then(r => r.data);

export const filmCreateSeries = ({ title, video_style, aspect_ratio, canonical_bible } = {}) =>
  api.post('/film/series',
    { title, video_style, aspect_ratio, canonical_bible },
    { timeout: QUEUE_TIMEOUT }).then(r => r.data);

// Returns { project_id, session_id, episode_ordinal, ... } — open the workspace
// with (project_id, session_id) exactly like a new standalone film.
export const filmCreateEpisode = (seriesId, { title, prior_episode_ids, duration_seconds } = {}) =>
  api.post(`/film/series/${seriesId}/episodes`,
    { title, prior_episode_ids, duration_seconds },
    { timeout: QUEUE_TIMEOUT }).then(r => r.data);

// Promote a finished (Ready) film into a new series — it becomes Episode 1.
export const filmPromoteToSeries = (projectId, { title } = {}) =>
  api.post(`/film/projects/${projectId}/promote-to-series`,
    { title }, { timeout: QUEUE_TIMEOUT }).then(r => r.data);

// Re-approve a series character's canonical plate. Body is either
// { plate_url } (set an approved URL) or { regenerate: true, description? }.
export const filmRefreshCharacterPlate = (seriesId, characterId, body = {}) =>
  api.post(`/film/series/${seriesId}/characters/${characterId}/refresh-plate`,
    body, { timeout: QUEUE_TIMEOUT }).then(r => r.data);

// Delete ONE episode of a series (delete_project semantics server-side: chat
// cascades away, rendered videos survive in My Videos, series canon untouched).
// A 409 means an episode render is in flight — cancel first; friendlyError
// surfaces the server's message as-is.
export const filmDeleteEpisode = (seriesId, projectId) =>
  api.delete(`/film/series/${seriesId}/episodes/${projectId}`,
    { timeout: QUEUE_TIMEOUT }).then(r => r.data);

// Delete a WHOLE series — every episode plus its locked cast & locations, one
// transaction server-side; irreversible. Resolves with casualty counts
// ({ episodes_deleted, characters_deleted, locations_deleted }) for the toast.
// Never touches stored media (shared plate cache) — see film_routes cascade notes.
export const filmDeleteSeries = (seriesId) =>
  api.delete(`/film/series/${seriesId}`, { timeout: QUEUE_TIMEOUT }).then(r => r.data);