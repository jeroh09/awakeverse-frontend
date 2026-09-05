// src/creditsApi.js — universal credits API (product-neutral).
// The three credit calls that used to live in Film's filmApi.js, but on a neutral
// path so any surface — the app-shell chip, the account panel, mobile later — can
// use them without importing from components/Film. Uses the SHARED axios instance,
// so the app's CSRF interceptor, cookie credentials, and token refresh all apply.
//
// PLACEMENT: this file lives in src/hooks/ (next to useCredits.js). The shared
// axios instance is src/api.js, so it's one level up. If you move this file,
// adjust the import path below to point at that instance.
import api from './api';

// Balance + held + tier + live buckets (w/ expiry) + soonest-expiring bucket.
// GET /api/credits
export const fetchCredits = () =>
  api.get('/credits').then(r => r.data);

// Pre-render cost + affordability, for a confirm UI.
//   fetchPrice('film','180')  or  fetchPrice('podcast','default', 13)
// GET /api/credits/price
export const fetchPrice = (content_type, tier, n_beats) =>
  api.get('/credits/price', {
    params: { content_type, tier, ...(n_beats ? { n_beats } : {}) },
  }).then(r => r.data);

// Ledger history — "where did my credits go".  GET /api/credits/history
export const fetchCreditHistory = (limit = 50) =>
  api.get('/credits/history', { params: { limit } }).then(r => r.data);