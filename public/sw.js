// sw.js - Vercel-optimized PWA Service Worker (No Console Logs)
const CACHE_NAME = 'awakeverse-pwa-v2';
const OFFLINE_URL = '/offline';

// Cache only essential PWA assets (avoid Vercel-managed files)
const APP_SHELL = [
  '/',
  '/app',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/logo192.png',
  '/logo512.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()) // Silent fail
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
    .catch(() => self.clients.claim()) // Silent fail
  );
});

self.addEventListener('fetch', (event) => {
  // Skip non-GET and Vercel-internal requests
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/_next/') || 
      event.request.url.includes('/_vercel/')) return;
  
  // Handle API requests - pass through but cache responses selectively
  if (event.request.url.includes('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Handle app shell requests - cache first for PWA performance
  if (isAppShellRequest(event.request)) {
    event.respondWith(handleAppShellRequest(event.request));
    return;
  }
  
  // All other requests: network first
  event.respondWith(handleOtherRequest(event.request));
});

async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    // Cache successful GET API responses briefly (5 minutes)
    if (response.status === 200 && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      // Add cache control to avoid stale data
      const cacheResponse = response.clone();
      cache.put(request, cacheResponse).catch(() => {}); // Silent cache fail
    }
    return response;
  } catch (error) {
    // Try cache for GET API requests when offline
    if (request.method === 'GET') {
      const cached = await caches.match(request);
      if (cached) return cached;
    }
    // Re-throw to trigger offline handling
    throw error;
  }
}

async function handleAppShellRequest(request) {
  // Cache-first for app shell (PWA core)
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    // Cache successful responses
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()).catch(() => {}); // Silent cache fail
    }
    return response;
  } catch (error) {
    // Offline fallback for navigation
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match(OFFLINE_URL);
      if (offlinePage) return offlinePage;
      
      // Create basic offline response
      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>AwakeVerse - Offline</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                background: #0a0a1a; 
                color: #FFD700; 
                text-align: center; 
                padding: 50px;
              }
            </style>
          </head>
          <body>
            <h1>You're Offline</h1>
            <p>AwakeVerse will resume when connection is restored.</p>
          </body>
        </html>
        `,
        { 
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }
    // Re-throw for other request types
    throw error;
  }
}

async function handleOtherRequest(request) {
  // Network-first for other assets
  try {
    const response = await fetch(request);
    
    // Cache successful image responses (optional)
    if (response.status === 200 && request.destination === 'image') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()).catch(() => {}); // Silent cache fail
    }
    
    return response;
  } catch (error) {
    // Fallback to cache when offline
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

function isAppShellRequest(request) {
  const url = new URL(request.url);
  const isShellAsset = APP_SHELL.some(shellUrl => {
    return url.pathname === shellUrl || 
           url.pathname.startsWith(shellUrl + '/');
  });
  
  return isShellAsset || request.mode === 'navigate';
}

// Push Notification Handler (Silent)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'New message',
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [100, 50, 100],
      data: data
    };
    
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'AwakeVerse', 
        options
      )
    );
  } catch (error) {
    // Silent fail for push notifications
  }
});

// Notification Click Handler (Silent)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing app window or open new one
      for (const client of clientList) {
        if (client.url.includes('/app') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/app');
      }
    })
  );
});

// Background Sync Handler (Silent)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    // Handle background sync logic here
    // Note: This requires corresponding logic in your main app
  }
});

// Message Handler for SKIP_WAITING (Silent)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Error Handling - Completely Silent
self.addEventListener('error', () => {});
self.addEventListener('unhandledrejection', () => {});