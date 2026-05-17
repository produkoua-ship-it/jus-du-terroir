const CACHE_NAME = 'terroir-v4';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js',
  './js/state.js',
  './js/utils.js',
  './js/ai-assistant.js',
  './manifest.json',
  './img/icon-192.png',
  './img/icon-512.png'
];

// Install Event - Pre-cache core assets
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch Event - Stale-While-Revalidate caching for rapid offline load of local and CDN assets
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Exclude non-GET requests, non-HTTP protocols, and Supabase DB calls from cache
  if (
    e.request.method !== 'GET' ||
    !e.request.url.startsWith('http') ||
    url.hostname.includes('supabase.co')
  ) {
    return e.respondWith(fetch(e.request));
  }

  // Serve from cache and update in background
  e.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(e.request).then((cachedResponse) => {
        const fetchPromise = fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            cache.put(e.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch((err) => {
          console.log('Service Worker fetch failed (offline), serving from cache:', err);
        });

        return cachedResponse || fetchPromise;
      });
    })
  );
});
