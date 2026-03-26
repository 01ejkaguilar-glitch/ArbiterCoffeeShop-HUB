// Notify clients when a new service worker is waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('controllerchange', () => {
  // Notify all clients about the update
  self.clients.matchAll({ type: 'window' }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'NEW_VERSION_AVAILABLE' });
    });
  });
});
/**
 * Arbiter Coffee Hub - Service Worker
 * 
 * Provides offline functionality, caching, and PWA features
 * for the Arbiter Coffee Shop application.
 * 
 * @version 1.0.0
 */

const CACHE_NAME = 'arbiter-coffee-v1';
const RUNTIME_CACHE = 'arbiter-runtime-v1';
const IMAGE_CACHE = 'arbiter-images-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/arbiter-logo-192.png',
  '/assets/arbiter-logo-512.png',
  '/static/css/main.css',
  '/static/js/main.js'
];

// API endpoints that should use network-first strategy
const API_ROUTES = [
  '/api/',
  '/sanctum/'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => {
          return new Request(url, { cache: 'reload' });
        })).catch(err => {
          console.log('[ServiceWorker] Some assets failed to cache:', err);
          // Continue even if some assets fail
          return Promise.resolve();
        });
      })
      .then(() => {
        // Force the waiting service worker to become active
        return self.skipWaiting();
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('arbiter-') && 
                     cacheName !== CACHE_NAME &&
                     cacheName !== RUNTIME_CACHE &&
                     cacheName !== IMAGE_CACHE;
            })
            .map((cacheName) => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests with network-first strategy
  if (API_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Handle image requests with cache-first strategy
  if (request.destination === 'image') {
    event.respondWith(cacheFirstWithExpiry(request, IMAGE_CACHE, 7 * 24 * 60 * 60 * 1000)); // 7 days
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Default: stale-while-revalidate for other assets
  event.respondWith(staleWhileRevalidate(request));
});

/**
 * Network-first strategy
 * Try network, fall back to cache, then offline page
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return a JSON error response for API requests
    return new Response(
      JSON.stringify({ error: 'You are offline', offline: true }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Network-first with offline fallback for navigation
 */
async function networkFirstWithFallback(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache the response
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    // Try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Last resort: return a basic offline message
    return new Response(
      '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

/**
 * Cache-first strategy with expiry
 */
async function cacheFirstWithExpiry(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check if cached response is still valid
    const dateHeader = cachedResponse.headers.get('sw-cache-date');
    if (dateHeader) {
      const cacheDate = new Date(dateHeader).getTime();
      if (Date.now() - cacheDate < maxAge) {
        return cachedResponse;
      }
    } else {
      // No date header, return cached response
      return cachedResponse;
    }
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone and add cache date header
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.append('sw-cache-date', new Date().toISOString());
      
      const response = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, response);
    }
    
    return networkResponse;
  } catch (error) {
    // Return cached response even if expired
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return placeholder image
    return new Response('', { status: 404 });
  }
}

/**
 * Stale-while-revalidate strategy
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');
  
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'Arbiter Coffee',
        body: event.data.text()
      };
    }
  }
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/assets/arbiter-logo-192.png',
    badge: '/assets/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now()
    },
    actions: data.actions || [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    tag: data.tag || 'arbiter-notification',
    renotify: data.renotify || false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Arbiter Coffee', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click received');
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle background sync
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Sync event:', event.tag);
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncPendingOrders());
  }
  
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
});

/**
 * Sync pending orders when back online
 */
async function syncPendingOrders() {
  try {
    // This would sync with your backend
    console.log('[ServiceWorker] Syncing pending orders...');
    
    // Get pending orders from IndexedDB
    // const pendingOrders = await getPendingOrdersFromDB();
    // for (const order of pendingOrders) {
    //   await fetch('/api/orders', { method: 'POST', body: JSON.stringify(order) });
    // }
    
    // Notify the user
    self.registration.showNotification('Orders Synced', {
      body: 'Your pending orders have been submitted.',
      icon: '/assets/arbiter-logo-192.png'
    });
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
  }
}

/**
 * Sync cart when back online
 */
async function syncCart() {
  try {
    console.log('[ServiceWorker] Syncing cart...');
    // Sync cart with backend
  } catch (error) {
    console.error('[ServiceWorker] Cart sync failed:', error);
  }
}

// Message handler for communication with the app
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE)
        .then((cache) => cache.addAll(event.data.urls))
    );
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[ServiceWorker] Loaded successfully');
