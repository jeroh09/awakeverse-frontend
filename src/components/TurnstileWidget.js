// src/components/TurnstileWidget.js
// Cloudflare Turnstile, loaded from Cloudflare's official script — no npm dep.
// Reusable: drop it on Register now, Login later.
//
// Props:
//   onToken(token)  called with the solved token, or "" when it clears
//   onExpire()      optional — token expired (also fires onToken(""))
//   onError()       optional — script/render/challenge error (also clears token)
//
// Env: REACT_APP_TURNSTILE_SITE_KEY (public site key). If unset, renders
// nothing and warns — so local dev without a key still works.

import { useEffect, useRef } from 'react';

const SITE_KEY = process.env.REACT_APP_TURNSTILE_SITE_KEY;
const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

// Load the script once, shared across every widget instance.
let scriptPromise = null;
function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null; // allow a later retry
      reject(new Error('Turnstile script failed to load'));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export default function TurnstileWidget({ onToken, onExpire, onError }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  // Keep latest callbacks in a ref so the effect can run once (empty deps)
  // without re-rendering the widget when the parent passes inline functions.
  const cbRef = useRef({ onToken, onExpire, onError });
  cbRef.current = { onToken, onExpire, onError };

  useEffect(() => {
    let cancelled = false;

    if (!SITE_KEY) {
      console.warn('REACT_APP_TURNSTILE_SITE_KEY not set — Turnstile disabled');
      return undefined;
    }

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token) => cbRef.current.onToken?.(token),
          'expired-callback': () => {
            cbRef.current.onToken?.('');
            cbRef.current.onExpire?.();
          },
          'error-callback': () => {
            cbRef.current.onToken?.('');
            cbRef.current.onError?.();
          },
        });
      })
      .catch((e) => {
        console.error(e);
        cbRef.current.onError?.();
      });

    // Cleanup also covers React StrictMode's mount→unmount→mount in dev.
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (_) {
          /* already gone */
        }
        widgetIdRef.current = null;
      }
    };
  }, []); // mount once

  if (!SITE_KEY) return null;
  return <div ref={containerRef} style={{ marginBottom: 'var(--space-md)' }} />;
}