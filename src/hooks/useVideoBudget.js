// src/hooks/useVideoBudget.js
//
// Reusable hook for video budget gate handling.
// Catches 403 "Monthly video budget reached" from BOTH pipelines:
//   - POST /api/content/generate   (content_jobs)
//   - POST /api/podcast/session    (podcast_jobs)
//
// On budget hit → calls PaymentRouter.quickUpgrade(suggestedTier, 'video_budget_limit')
//
// Naming conventions (Backend → Frontend):
//   seconds_used   → secondsUsed
//   budget         → budget
//   suggested_tier → suggestedTier
//   error          → error (unchanged)
//   hint           → hint  (unchanged)
//
// Usage:
//   const { guardedFetch, budgetState, clearBudgetError } = useVideoBudget();
//
//   // Replace raw fetch with guardedFetch — same API, budget handling built in.
//   const res = await guardedFetch('/api/podcast/session', { method: 'POST', ... });

import { useState, useCallback } from 'react';
import PaymentRouter from '../services/PaymentRouter';

// ── Tier display names — mirrors TIER_CONFIG in PaymentRouter.js ─────────────
const TIER_DISPLAY = {
  starter:   'EXPLORER',
  pro:       'PROFESSIONAL',
  unlimited: 'CREATOR',
};

// ── Initial budget state ──────────────────────────────────────────────────────
const INITIAL_BUDGET_STATE = {
  hit:            false,   // true when a 403 budget error has fired
  secondsUsed:    null,    // seconds consumed this billing cycle (both pipelines)
  budget:         null,    // tier's total second allowance
  suggestedTier:  null,    // next tier up (null if already at top)
  hint:           null,    // human-readable hint from backend
  upgrading:      false,   // true while PaymentRouter redirect is in flight
  error:          null,    // non-budget error string, if any
};

// ── Helper: seconds → "Xm Ys" display string ─────────────────────────────────
function formatSeconds(s) {
  if (s == null) return '—';
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r > 0 ? `${m}m ${r}s` : `${m}m`;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export default function useVideoBudget() {
  const [budgetState, setBudgetState] = useState(INITIAL_BUDGET_STATE);

  // ── clearBudgetError — reset state (e.g. on modal close) ─────────────────
  const clearBudgetError = useCallback(() => {
    setBudgetState(INITIAL_BUDGET_STATE);
  }, []);

  // ── handleUpgrade — calls PaymentRouter with the suggested tier ───────────
  const handleUpgrade = useCallback(async (tier) => {
    if (!tier) return;

    setBudgetState(prev => ({ ...prev, upgrading: true }));
    try {
      await PaymentRouter.quickUpgrade(tier, 'video_budget_limit');
      // PaymentRouter.quickUpgrade redirects — if we're still here, it failed.
    } catch (err) {
      console.error('[useVideoBudget] PaymentRouter.quickUpgrade failed:', err);
    } finally {
      // Only reaches here if redirect didn't fire (error path).
      setBudgetState(prev => ({ ...prev, upgrading: false }));
    }
  }, []);

  // ── guardedFetch — drop-in fetch wrapper ─────────────────────────────────
  // Identical call signature to window.fetch.
  // On 403 budget response: populates budgetState and returns null.
  // On other errors: re-throws so existing error handling is unaffected.
  // On success: returns the Response object as normal.
  const guardedFetch = useCallback(async (url, options = {}) => {
    // Clear any previous budget state before a new attempt
    setBudgetState(INITIAL_BUDGET_STATE);

    const response = await fetch(url, options);

    if (response.status === 403) {
      let body = {};
      try {
        body = await response.json();
      } catch (_) {
        // Non-JSON 403 — not a budget error, re-throw
        const err = new Error(`HTTP 403: ${url}`);
        err.response = response;
        throw err;
      }

      // Is this a video budget 403?
      if (body.error === 'Monthly video budget reached') {
        const secondsUsed   = body.seconds_used   ?? null;
        const budget        = body.budget          ?? null;
        const suggestedTier = body.suggested_tier  ?? null;
        const hint          = body.hint            ?? null;

        setBudgetState({
          hit:           true,
          secondsUsed,
          budget,
          suggestedTier,
          hint,
          upgrading:     false,
          error:         null,
        });

        // Return null — caller should check budgetState.hit
        return null;
      }

      // Different 403 (e.g. CSRF, auth) — re-throw as normal
      const err = new Error(body.error || `HTTP 403: ${url}`);
      err.response  = response;
      err.body      = body;
      throw err;
    }

    return response;
  }, []);

  // ── Derived display helpers ───────────────────────────────────────────────
  const budgetDisplay = budgetState.hit
    ? {
        secondsUsedLabel:  formatSeconds(budgetState.secondsUsed),
        budgetLabel:       formatSeconds(budgetState.budget),
        remainingLabel:    formatSeconds(
          budgetState.budget != null && budgetState.secondsUsed != null
            ? Math.max(0, budgetState.budget - budgetState.secondsUsed)
            : null
        ),
        suggestedTierLabel: budgetState.suggestedTier
          ? TIER_DISPLAY[budgetState.suggestedTier] || budgetState.suggestedTier
          : null,
      }
    : null;

  return {
    guardedFetch,       // use instead of fetch() in video-generating calls
    budgetState,        // { hit, secondsUsed, budget, suggestedTier, hint, upgrading }
    budgetDisplay,      // formatted labels, or null when no budget hit
    handleUpgrade,      // call with suggestedTier to trigger PaymentRouter
    clearBudgetError,   // reset state (call on modal close / retry)
  };
}


// ── Usage example ─────────────────────────────────────────────────────────────
//
// import useVideoBudget from '../hooks/useVideoBudget';
//
// function PodcastStudio() {
//   const { guardedFetch, budgetState, budgetDisplay, handleUpgrade, clearBudgetError }
//     = useVideoBudget();
//
//   async function submitSession(sessionPayload) {
//     const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';
//     const res = await guardedFetch('/api/podcast/session', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
//       credentials: 'include',
//       body: JSON.stringify(sessionPayload),
//     });
//
//     if (!res) {
//       // budgetState.hit === true — render the upgrade UI
//       return;
//     }
//
//     const data = await res.json();
//     // ... handle success
//   }
//
//   if (budgetState.hit) {
//     return (
//       <div className="budget-limit-modal">
//         <p>{budgetState.hint}</p>
//         <p>Used: {budgetDisplay.secondsUsedLabel} / {budgetDisplay.budgetLabel}</p>
//         {budgetState.suggestedTier && (
//           <button
//             onClick={() => handleUpgrade(budgetState.suggestedTier)}
//             disabled={budgetState.upgrading}
//           >
//             {budgetState.upgrading
//               ? 'Redirecting…'
//               : `Upgrade to ${budgetDisplay.suggestedTierLabel}`}
//           </button>
//         )}
//         <button onClick={clearBudgetError}>Dismiss</button>
//       </div>
//     );
//   }
//
//   // ... rest of component
// }