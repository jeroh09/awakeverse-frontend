const CACHE_NAME = 'awakeverse-v1.0.0';

// DEFENSIVE: Split URLs into critical and optional
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
  '/manifest.json',  // This was causing the 401 error
  '/logo192.png',
  '/logo512.png'
];

// DEFENSIVE: Cache files individually with error handling
async function cacheResourcesDefensively(cache) {
  console.log('Service Worker: Starting defensive caching...');
  
  // Cache critical files first - these MUST succeed
  const criticalPromises = CRITICAL_URLS.map(async (url) => {
    try {
      const response = await fetch(url);
      if (response.status === 200) {
        await cache.put(url, response);
        console.log(`SW: Cached critical: ${url}`);
      } else {
        console.warn(`SW: Critical file returned ${response.status}: ${url}`);
      }
    } catch (error) {
      console.error(`SW: Failed to cache critical file ${url}:`, error);
      // Continue - don't fail installation for individual files
    }
  });

  // Wait for critical files to finish
  await Promise.allSettled(criticalPromises);

  // Cache optional files - failures are acceptable
  const optionalPromises = OPTIONAL_URLS.map(async (url) => {
    try {
      const response = await fetch(url);
      if (response.status === 200) {
        await cache.put(url, response);
        console.log(`SW: Cached optional: ${url}`);
      } else if (response.status === 401) {
        console.log(`SW: Skipping authenticated file: ${url} (401)`);
      } else {
        console.log(`SW: Skipping unavailable file: ${url} (${response.status})`);
      }
    } catch (error) {
      console.log(`SW: Skipped optional file ${url}:`, error.message);
      // Silent continue - optional files shouldn't break installation
    }
  });

  // Wait for optional files (but don't require success)
  await Promise.allSettled(optionalPromises);
  
  console.log('Service Worker: Defensive caching completed');
}

// Install event - DEFENSIVE caching instead of cache.addAll()
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cacheResourcesDefensively(cache))
      .then(() => {
        console.log('Service Worker: Installation completed successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Installation failed:', error);
        // Continue anyway - partial functionality is better than none
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated');
      return self.clients.claim();
    })
    .catch(error => {
      console.error('Service Worker: Activation failed:', error);
      // Continue anyway
      return self.clients.claim();
    })
  );
});

// Fetch event - DEFENSIVE handling with multiple fallbacks
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip requests to external APIs (your existing logic)
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('localhost:5000') ||
      event.request.url.includes('11434')) {
    return;
  }

  // DEFENSIVE: Skip manifest.json requests if they're causing auth issues
  if (event.request.url.includes('/manifest.json')) {
    event.respondWith(
      handleManifestRequest(event.request)
    );
    return;
  }

  // Handle other requests with existing logic but add error recovery
  event.respondWith(
    handleRequestDefensively(event.request)
  );
});

// DEFENSIVE: Handle manifest requests specially
async function handleManifestRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('SW: Serving manifest from cache');
      return cachedResponse;
    }

    // Try network
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      // Cache successful response
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    // If 401 or other error, return a basic manifest
    console.log(`SW: Manifest request failed (${networkResponse.status}), using fallback`);
    return createFallbackManifest();

  } catch (error) {
    console.log('SW: Manifest request error, using fallback:', error.message);
    return createFallbackManifest();
  }
}

// DEFENSIVE: Create a basic fallback manifest if the real one fails
function createFallbackManifest() {
  const fallbackManifest = {
    "short_name": "AwakeVerse",
    "name": "AwakeVerse",
    "start_url": "/",
    "display": "standalone",
    "theme_color": "#FFD700",
    "background_color": "#0a0a1a"
  };

  return new Response(JSON.stringify(fallbackManifest), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}

// DEFENSIVE: Handle regular requests with error recovery
async function handleRequestDefensively(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Serving from cache:', request.url);
      return cachedResponse;
    }

    // Try network
    console.log('Service Worker: Fetching from network:', request.url);
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
      const responseToCache = networkResponse.clone();
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, responseToCache);
      } catch (cacheError) {
        console.log('SW: Failed to cache response:', cacheError.message);
        // Continue anyway
      }
    }

    return networkResponse;

  } catch (error) {
    console.log('SW: Request failed, trying fallbacks:', error.message);
    
    // If both cache and network fail, try fallbacks
    if (request.destination === 'document') {
      // For navigation requests, try to serve root page
      const rootResponse = await caches.match('/');
      if (rootResponse) {
        return rootResponse;
      }
    }

    // Final fallback - return error response
    return new Response('Service temporarily unavailable', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Listen for messages from the app (your existing logic)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for offline actions (your existing logic)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    // Handle background sync logic here
  }
});

// Push notifications (your existing logic)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [100, 50, 100],
      data: data
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks (your existing logic)
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});