// src/services/ApiErrorService.js
//
// Centralised API error → user-friendly message mapper.
// Used across all fetch call sites — useContentGeneration, usePodcastStudio,
// handleGenerate in PodcastStudioPage, and any future hooks/routes.
//
// Backend continues to log full errors with exc_info=True — this only
// controls what the USER sees. No status codes or stack traces exposed.
//
// Usage:
//   import ApiErrorService from '../services/ApiErrorService';
//
//   const res  = await fetch(...);
//   const body = await res.json().catch(() => ({}));
//   if (!res.ok) {
//     const message = ApiErrorService.getMessage(res.status, body);
//     setError(message);
//     return;
//   }

class ApiErrorService {

  // ── Core mapper ───────────────────────────────────────────────────────────
  //
  // Returns a user-friendly string for any API error.
  // Never exposes status codes, raw error strings, or internal details.
  //
  // @param  status  {number}  HTTP status code
  // @param  body    {object}  Parsed JSON response body (or {} if unparseable)
  // @returns {string}

  getMessage(status, body = {}) {
    const errorKey = body?.error || '';

    // ── Budget gate — already handled by VideoBudgetBanner ────────────────
    // Return null so callers know to defer to the budget UI, not a toast.
    if (status === 403 && errorKey === 'Monthly video budget reached') {
      return null;
    }

    // ── fal.ai / Nano / Hailuo credit exhausted ───────────────────────────
    // fal returns 402 or a 500 with a known message when credits run out.
    if (
      status === 402 ||
      errorKey.toLowerCase().includes('insufficient credits') ||
      errorKey.toLowerCase().includes('credit') ||
      errorKey.toLowerCase().includes('quota exceeded') ||
      body?.detail?.toLowerCase?.()?.includes('credits')
    ) {
      return "We're temporarily at capacity for video generation — our team has been notified and will top up shortly. Please try again in a few minutes.";
    }

    // ── Authentication / session expired ─────────────────────────────────
    if (status === 401) {
      return 'Your session has expired — please refresh the page and try again.';
    }

    // ── CSRF / forbidden (non-budget) ─────────────────────────────────────
    if (status === 403) {
      return 'Your session has expired — please refresh the page and try again.';
    }

    // ── Not found ─────────────────────────────────────────────────────────
    if (status === 404) {
      return 'We couldn\'t find what you were looking for — please try again.';
    }

    // ── Rate limited ──────────────────────────────────────────────────────
    if (status === 429) {
      return 'You\'re moving fast! Please wait a moment and try again.';
    }

    // ── Validation errors (explicit backend message is safe to show) ──────
    if (status === 400 && errorKey) {
      // Only show backend message if it looks user-safe (no stack traces etc.)
      if (errorKey.length < 120 && !errorKey.includes('Traceback')) {
        return errorKey;
      }
    }

    // ── Server errors ─────────────────────────────────────────────────────
    if (status >= 500) {
      return 'We\'re having trouble right now — please try again in a moment. If it keeps happening, contact support.';
    }

    // ── Generic client error ──────────────────────────────────────────────
    if (status >= 400) {
      return 'Something went wrong — please try again.';
    }

    // ── Network / timeout (status = 0 or undefined) ───────────────────────
    return 'Connection lost — please check your connection and try again.';
  }

  // ── Network error helper ──────────────────────────────────────────────────
  // Call this inside catch blocks where fetch itself threw (no response).
  //
  // @param  error  {Error}  The caught error
  // @returns {string}

  getNetworkMessage(error) {
    if (this._isDevMode()) {
      console.error('[ApiErrorService] Network error:', error);
    }

    if (error?.name === 'AbortError') {
      return 'The request timed out — please try again.';
    }

    return 'Connection lost — please check your connection and try again.';
  }

  // ── Log helper ────────────────────────────────────────────────────────────
  // Logs to console in dev only. Backend already logs everything server-side.
  //
  // @param  context  {string}  e.g. 'useContentGeneration.createContent'
  // @param  status   {number}
  // @param  body     {object}

  log(context, status, body = {}) {
    if (this._isDevMode()) {
      console.error(`[${context}] API error ${status}:`, body);
    }
  }

  // ── isFalCreditError ──────────────────────────────────────────────────────
  // Returns true if the error is a fal.ai / Nano / Hailuo credit exhaustion.
  // Useful if callers want to show a different UI for this specific case.

  isFalCreditError(status, body = {}) {
    return (
      status === 402 ||
      body?.error?.toLowerCase().includes('insufficient credits') ||
      body?.error?.toLowerCase().includes('quota exceeded') ||
      body?.detail?.toLowerCase?.()?.includes('credits')
    );
  }

  // ── isBudgetError ─────────────────────────────────────────────────────────
  // Returns true if this is the video budget 403 — handled by VideoBudgetBanner.

  isBudgetError(status, body = {}) {
    return status === 403 && body?.error === 'Monthly video budget reached';
  }

  // ── Private ───────────────────────────────────────────────────────────────

  _isDevMode() {
    return process.env.NODE_ENV === 'development';
  }
}

// Export singleton — mirrors SubscriptionService.js pattern
export default new ApiErrorService();


// ── Quick reference — call sites to update ────────────────────────────────────
//
// 1. useContentGeneration.js — createContent() catch block:
//
//    import ApiErrorService from '../services/ApiErrorService';
//
//    } catch (error) {
//      const message = ApiErrorService.getNetworkMessage(error);
//      setState({ status: 'failed', activeJob: null, error: message, progress: 0 });
//      throw error;
//    }
//
// 2. usePodcastStudio.js — createSession() and any fetch that sets an error state:
//
//    const body = await res.json().catch(() => ({}));
//    if (!res.ok) {
//      ApiErrorService.log('usePodcastStudio.createSession', res.status, body);
//      const message = ApiErrorService.getMessage(res.status, body);
//      setState(prev => ({ ...prev, status: 'failed', error: message }));
//      return;
//    }
//
// 3. PodcastStudioPage.jsx — handleGenerate catch block:
//
//    } catch (e) {
//      console.error('❌ handleGenerate error:', e);  // keep for dev
//      setError(ApiErrorService.getNetworkMessage(e));
//      setSubmitted(false);
//    }
//
// 4. useVideoBudget.js — non-budget 403 re-throw:
//    Already handled — guardedFetch re-throws non-budget 403s.
//    Wrap the outer catch in the calling component with ApiErrorService.getNetworkMessage().