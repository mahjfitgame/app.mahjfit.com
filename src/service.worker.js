// file: src/service.worker.js
// service worker

// Load Workbox from CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.4.1/workbox-sw.js');

if (self.workbox) {
  console.log('[WSW] Workbox loaded successfully');

  // Destructure the required modules from the global workbox object
  const { precaching, routing, strategies, expiration } = self.workbox;

  // 1. PRECACHING: Injects your compiled Angular bundle files 
  precaching.precacheAndRoute(self.__WB_MANIFEST || []);

  // 2. REST API & GRAPHQL GET REQUESTS: Network-First Strategy
  routing.registerRoute(
    ({ url, request }) => {
      const isApiCall = url.pathname.includes('/graphql') || url.pathname.includes('/rest');
      return isApiCall && request.method === 'GET';
    },
    new strategies.NetworkFirst({
      cacheName: 'api-get-cache',
      plugins: [
        new expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60 * 3 // Cache for 3 days
        })
      ]
    })
  );

  // 3. STATIC ASSETS & IMAGES
  routing.registerRoute(
    ({ request }) => request.destination === 'image' || request.destination === 'font',
    new strategies.CacheFirst({
      cacheName: 'static-assets',
      plugins: [
        new expiration.ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 })
      ]
    })
  );

  // 4. CACHE EVERYTHING REQUESTED UNDER THE i18n-runtime BOUNDARY
  routing.registerRoute(
    ({ url }) => url.pathname.includes('/i18n-runtime/'),
    new strategies.StaleWhileRevalidate({
      cacheName: 'i18n-cache',
      plugins: [
        new expiration.ExpirationPlugin({
          maxEntries: 200, // Increased threshold to support nested modules
          maxAgeSeconds: 7 * 24 * 60 * 60 // 7 Days
        })
      ]
    })
  );

  // 6. GRAPHQL POST REQUESTS (ADVANCED OFFLINE STRATEGY WITH KEY SYNTHESIS)
  // This sits globally outside the namespace check and handles POST operations manually
  self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    if (event.request.method === 'POST' && url.pathname.includes('/graphql')) {
      // Clone the request immediately because reading the body consumes the stream
      const requestClone = event.request.clone();

      event.respondWith(
        (async () => {
          try {
            // 1. Read the raw text payload body from the cloned query structure
            const requestBodyText = await requestClone.text();
            
            // 2. Build a unique custom URL key that includes the body parameters
            // This creates a fake GET representation that CacheStorage accepts
            const syntheticUrl = `${event.request.url}?queryKey=${encodeURIComponent(requestBodyText)}`;
            const syntheticCacheKey = new Request(syntheticUrl, { method: 'GET' });

            try {
              // 3. Try the live network request first
              const networkResponse = await fetch(event.request.clone());
              
              if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                
                // Open your dedicated database cache block safely
                const cache = await caches.open('graphql-post-cache');
                // Save it using our synthetic fake GET request key instead
                await cache.put(syntheticCacheKey, responseClone);
              }
              return networkResponse;
            } catch (networkError) {
              console.warn('[WSW] Network failed for GraphQL POST request. Checking offline fallback cache...');
              
              // 4. OFFLINE FALLBACK: Look up the data matching our custom key structure
              const cache = await caches.open('graphql-post-cache');
              const cachedResponse = await cache.match(syntheticCacheKey);
              
              if (cachedResponse) {
                console.log('[WSW] Serving GraphQL payload directly from fallback cache.');
                return cachedResponse;
              }
              
              // 5. CRASH PROTECTION: Return a friendly error JSON payload if cache is empty
              return new Response(
                JSON.stringify({ 
                  data: null, 
                  errors: [{ message: "You are offline, and no cached fallback sequence is available." }] 
                }),
                { headers: { 'Content-Type': 'application/json' } }
              );
            }
          } catch (parseError) {
            // Fallback if body serialization or reading strings crashes out
            return fetch(event.request);
          }
        })()
      );
    }
  });


  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', () => self.clients.claim());

} else {
  console.error('[WSW] Workbox failed to load');
}
