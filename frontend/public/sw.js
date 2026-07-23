// Service Worker pass-through for PWA compliance
const CACHE_NAME = 'timeflow-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and API requests
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  // Pass-through fetch handler for other requests
  event.respondWith(
    fetch(event.request).catch(() => {
      // Offline fallback can be added here in production
      return caches.match(event.request);
    })
  );
});
