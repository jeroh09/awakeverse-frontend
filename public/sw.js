/* public/sw.js — AwakeVerse (Vercel + CRA hashed assets + safe navigation)
   Goals:
   - DO NOT cache SPA routes like /app, /login, etc.
   - Cache ONE app shell (/) and serve it for navigations (back/forward/refresh/deep links).
   - Precache CRA hashed assets using /asset-manifest.json
   - Cache-first for /static/* with MIME guards (prevents text/plain being served as JS/CSS)
   - Network-first for /api/* (with optional cache fallback for non-auth GETs)
*/


const CACHE_VERSION = 'awakeverse-v7';
const PRECACHE = `${CACHE_VERSION}-precache`;
const RUNTIME = `${CACHE_VERSION}-runtime`;

const CORE = [
  '/', // app shell (index.html)
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
];

// Install: cache CORE + hashed build assets from asset-manifest.json
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE);

    // Best-effort core
    await cache.addAll(CORE).catch(() => {});

    // CRA hashed assets: /asset-manifest.json lists correct /static/* files per deploy
    try {
      const res = await fetch('/asset-manifest.json', { cache: 'no-store' });
      if (res.ok) {
        const manifest = await res.json();
        const files = Object.values(manifest.files || {})
          .filter((p) => typeof p === 'string' && p.startsWith('/static/'));

        // Cache hashed assets (best-effort)
        await cache.addAll(files).catch(() => {});
      }
    } catch (_) {
      // If manifest fetch fails, app can still run online; SW won’t break the page
    }

    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => (![PRECACHE, RUNTIME].includes(k) ? caches.delete(k) : undefined))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Ignore cross-origin
  if (url.origin !== self.location.origin) return;

  // Skip Vercel internals if they ever appear
  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/_vercel/')) return;

  // Never intercept the SW file itself (helps updates stay clean)
  if (url.pathname === '/sw.js') return;

  // API: network-first (cache fallback for safe GETs)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstApi(req));
    return;
  }

  // Navigation (refresh/deep link/back/forward full load):
  // Serve the app shell (/) from cache as fallback.
  if (req.mode === 'navigate') {
    event.respondWith(appShellNavigate(req));
    return;
  }

  // Hashed static assets: cache-first + MIME guards
  if (url.pathname.startsWith('/static/')) {
    event.respondWith(cacheFirstStatic(req));
    return;
  }

  // Other same-origin requests: network-first
  event.respondWith(networkFirst(req));
});

/** Navigation handler: try fresh doc (no-store), else cached app shell (/). */
async function appShellNavigate(req) {
  const cache = await caches.open(PRECACHE);

  // Prefer fresh HTML when online to avoid stale shell pointing to missing chunks
  try {
    const fresh = await fetch(req, { cache: 'no-store' });
    if (fresh && fresh.ok) return fresh;
  } catch (_) {}

  const cachedShell = await cache.match('/');
  return cachedShell || offlineHtml();
}

/** Cache-first for hashed static assets, with MIME guards to prevent blank screens. */
async function cacheFirstStatic(req) {
  const cache = await caches.open(PRECACHE);

  const cached = await cache.match(req);
  if (cached) return cached;

  const res = await fetch(req);

  // Don’t cache non-200s (prevents caching “Not Found” bodies)
  if (!res || res.status !== 200) return res;

  // MIME guard: never treat text/plain (or HTML) as JS/CSS
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (req.destination === 'script' && !ct.includes('javascript')) return res;
  if (req.destination === 'style' && !ct.includes('text/css')) return res;

  cache.put(req, res.clone()).catch(() => {});
  return res;
}

/** Network-first for general requests with runtime cache fallback. */
async function networkFirst(req) {
  const cache = await caches.open(RUNTIME);
  try {
    const res = await fetch(req);
    if (res && res.status === 200) cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (_) {
    const cached = await cache.match(req);
    return cached || Response.error();
  }
}

/** API: network-first. Cache fallback only for non-auth GETs. */
async function networkFirstApi(req) {
  const cache = await caches.open(RUNTIME);
  const isAuthish =
    req.url.includes('/api/auth/') ||
    req.url.includes('/api/login') ||
    req.url.includes('/api/logout') ||
    req.url.includes('/api/register') ||
    req.url.includes('/api/session');

  try {
    const res = await fetch(req);
    if (!isAuthish && res && res.status === 200) {
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch (_) {
    if (!isAuthish) {
      const cached = await cache.match(req);
      if (cached) return cached;
    }
    return Response.error();
  }
}

/** Offline HTML that matches your theme. */
function offlineHtml() {
  return new Response(
    `<!doctype html>
     <html>
       <head>
         <meta charset="utf-8" />
         <meta name="theme-color" content="#FFD700" />
         <title>AwakeVerse — Offline</title>
         <style>
           body{font-family:Inter,sans-serif;background:#0a0a1a;color:#FFD700;margin:0;padding:48px}
           .box{max-width:520px;margin:0 auto}
         </style>
       </head>
       <body>
         <div class="box">
           <h1>🌙 AwakeVerse</h1>
           <p>You’re currently offline.</p>
           <p>Reconnect and try again.</p>
         </div>
       </body>
     </html>`,
    { status: 503, headers: { 'Content-Type': 'text/html' } }
  );
}

// Keep your existing push logic (unchanged)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'AwakeVerse', {
        body: data.body || 'New message available',
        icon: '/logo192.png',
        badge: '/logo192.png',
        vibrate: [100, 50, 100],
        data,
      })
    );
  } catch (_) {}
});

// Keep SKIP_WAITING support
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
