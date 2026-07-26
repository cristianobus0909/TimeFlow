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
    fetch(event.request).catch(async () => {
      // Return cached response if available
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Fallback response to prevent Service Worker crash when fetch is blocked by CORS/SSO redirects
      return new Response('Network connection failed or request blocked by CORS.', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({ 'Content-Type': 'text/plain' }),
      });
    })
  );
});
