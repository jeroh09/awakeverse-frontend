const CACHE_NAME = 'awakeverse-v1.0.1'; // Bump version

const CRITICAL_URLS = [
  '/',
  '/app',
  '/login', 
  '/register',
  '/favicon.ico'
];

const OPTIONAL_URLS = [
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png'
];

// SILENT caching - remove all console logs
async function cacheResources(cache) {
  // Cache critical files
  const criticalPromises = CRITICAL_URLS.map(async (url) => {
    try {
      const response = await fetch(url);
      if (response.status === 200) {
        await cache.put(url, response);
      }
    } catch (error) {
      // Silent fail - no logging
    }
  });

  await Promise.allSettled(criticalPromises);

  // Cache optional files
  const optionalPromises = OPTIONAL_URLS.map(async (url) => {
    try {
      const response = await fetch(url);
      if (response.status === 200) {
        await cache.put(url, response);
      }
    } catch (error) {
      // Silent fail
    }
  });

  await Promise.allSettled(optionalPromises);
}

// Install event - SILENT
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cacheResources(cache))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()) // Silent catch
  );
});

// Activate event - SILENT
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - SILENT and SIMPLIFIED
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  // Skip API requests
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('localhost:5000') ||
      event.request.url.includes('11434')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached version if found
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then(networkResponse => {
            // Cache successful responses
            if (networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseToCache))
                .catch(() => {}); // Silent cache failure
            }
            return networkResponse;
          })
          .catch(() => {
            // Final fallback for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Remove all other event listeners that aren't essential
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// COMMENT OUT OR REMOVE these to reduce requests:
// - push notifications
// - background sync
// - notification clicks
// Unless you absolutely need them