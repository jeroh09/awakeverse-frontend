// src/components/PodcastStudio/podcastExtras.js
//
// API calls for the studio's optional extras (2026-10-17): the AI-designed
// opening hook and the sound-effects library. Kept out of usePodcastStudio so
// that hook stays untouched. Same fetch pattern (cookie auth + CSRF header).
//
//   loadExtras()                          GET  /api/podcast/sfx-library
//     → { available, levels, defaultLevel, sounds:[{name,label,when,accent,url}] }
//       available=false → the user isn't on the new overlay stage yet: hide the
//       hook and sound entry points entirely.
//   suggestHook({ lines, comparison, planHook })   POST /api/podcast/suggest-hook
//     → { available, recommend, reason, hook, alternatives }
//   designDataCard({ line, context, hint })         POST /api/podcast/design-data-card
//     → card {kind:'stat'|'chart', …} | null  (only numbers the line actually says)
// Neither ever throws: both are optional features, so failures read as "none".

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';
const getCsrf = () => document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';

export async function loadExtras() {
  const none = { available: false, levels: ['subtle', 'normal', 'bold'], defaultLevel: 'subtle', sounds: [] };
  try {
    const res = await fetch(`${API_BASE}/api/podcast/sfx-library`, { credentials: 'include' });
    if (!res.ok) return none;
    const d = await res.json();
    return { ...none, ...d, sounds: Array.isArray(d.sounds) ? d.sounds : [] };
  } catch (e) {
    return none;
  }
}

export async function suggestHook({ lines, comparison = null, planHook = null }) {
  const none = { available: false, recommend: false, reason: '', hook: null, alternatives: [] };
  try {
    const res = await fetch(`${API_BASE}/api/podcast/suggest-hook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrf() },
      credentials: 'include',
      body: JSON.stringify({ lines, comparison, planHook }),
    });
    if (!res.ok) return none;
    return { ...none, ...(await res.json()) };
  } catch (e) {
    return none;
  }
}

export async function designDataCard({ line, context = [], hint = null }) {
  // POST /api/podcast/design-data-card → { available, card } ; card null = nothing numeric
  try {
    const res = await fetch(`${API_BASE}/api/podcast/design-data-card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrf() },
      credentials: 'include',
      body: JSON.stringify({ line, context, hint }),
    });
    if (!res.ok) return null;
    const d = await res.json();
    return d.card || null;
  } catch (e) {
    return null;
  }
}

// ── hook text helpers (shared by the pop-out and the line chip) ────────────
// The punch word is marked *like this* in hook.text (same as the renderer).
export const plainHookText = (t) => (t || '').replace(/\*/g, '');

export function hookSummary(h) {
  if (!h) return '';
  if (h.kind === 'stat') return [h.number, h.label].filter(Boolean).join(' ');
  if (h.kind === 'versus') return `${h.left || 'A'} vs ${h.right || 'B'}`;
  return plainHookText(h.text);
}