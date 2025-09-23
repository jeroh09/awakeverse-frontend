// sw.js - Tailored for YOUR AwakeVerse App
const CACHE_NAME = 'awakeverse-v3-' + (new Date()).getTime(); // Dynamic version

// CUSTOMIZED FOR YOUR ROUTES (from App.js)
const APP_SHELL = [
  '/',
  '/app',                    // Main chat interface
  '/login',                  // Auth pages (cached for offline access)
  '/register',
  '/profile-settings',       // User settings
  '/upload-avatar',          // Avatar management
  '/contact-us',             // Support
  '/terms',                  // Legal pages
  '/privacy',
  '/community-guidelines',
  '/copyright', 
  '/security',
  '/ai-disclaimer',
  '/contractor-agreements',
  '/forgot-password',        // Email auth flows
  '/reset-password',
  '/verify-email'
];

// STATIC ASSETS (from your build)
const STATIC_ASSETS = [
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache critical routes only - let Vercel handle the rest
        return cache.addAll([...APP_SHELL, ...STATIC_ASSETS]);
      })
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Keep only current cache (from your cleanup logic)
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim clients immediately (from your navigation guard logic)
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Skip non-GET and Vercel-internal requests
  if (request.method !== 'GET') return;
  if (request.url.includes('/_next/') || request.url.includes('/_vercel/')) return;
  
  // Handle based on request type
  if (request.url.includes('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (isAppRoute(request)) {
    event.respondWith(handleAppRoute(request));
  } else {
    event.respondWith(handleStaticAsset(request));
  }
});

// API requests - network first, cache as fallback
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful GET responses briefly (aligns with your auth context)
    if (response.status === 200 && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()).catch(() => {});
    }
    
    return response;
  } catch (error) {
    // Offline fallback for safe-to-cache GET requests
    if (request.method === 'GET' && !request.url.includes('/api/auth/')) {
      const cached = await caches.match(request);
      if (cached) return cached;
    }
    throw error;
  }
}

// App routes - cache first for PWA experience
async function handleAppRoute(request) {
  // Try cache first for instant loading
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    
    // Cache successful page responses
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()).catch(() => {});
    }
    
    return response;
  } catch (error) {
    // Offline fallback for navigation requests
    if (request.mode === 'navigate') {
      return createOfflineResponse();
    }
    throw error;
  }
}

// Static assets - network first, cache as backup
async function handleStaticAsset(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()).catch(() => {});
    }
    
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

// Check if request is for one of your app routes
function isAppRoute(request) {
  const url = new URL(request.url);
  return APP_SHELL.some(route => url.pathname === route) || 
         request.mode === 'navigate';
}

// Create offline page that matches your app's theme
function createOfflineResponse() {
  return new Response(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>AwakeVerse - Offline</title>
        <meta name="theme-color" content="#FFD700">
        <style>
          body { 
            font-family: 'Inter', sans-serif;
            background: #0a0a1a; 
            color: #FFD700; 
            text-align: center; 
            padding: 50px;
            margin: 0;
          }
          h1 { margin-bottom: 20px; }
          .container { max-width: 400px; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🌙 AwakeVerse</h1>
          <p>You're currently offline.</p>
          <p>Your conversations will sync when connection is restored.</p>
        </div>
      </body>
    </html>
    `,
    { 
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    }
  );
}

// Push notifications (aligned with your existing logic)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'AwakeVerse',
        {
          body: data.body || 'New message available',
          icon: '/logo192.png',
          badge: '/logo192.png',
          vibrate: [100, 50, 100],
          data: data
        }
      )
    );
  } catch (error) {
    // Silent handling
  }
});

// Keep your existing message handling for SKIP_WAITING
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for your chat messages
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    // Implement based on your WebSocketContext logic
  }
});