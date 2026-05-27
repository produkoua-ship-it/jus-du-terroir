const CACHE_NAME = 'terroir-v6';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './css/tailwind.css',
  './js/main.js',
  './js/state.js',
  './js/utils.js',
  './js/ai-assistant.js',
  './manifest.json',
  './img/icon-192.png',
  './img/icon-512.png',
  './img/logo.jpg'
];

// Liste des motifs CDN à mettre en cache (cache-first après la 1ère visite)
const CDN_URLS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net/npm/@supabase/supabase-js',
  'cdn.jsdelivr.net/npm/chart.js',
  'unpkg.com/lucide'
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

// Fetch Event - Stratégie adaptative : Stale-While-Revalidate pour ressources locales,
// Cache-First pour CDN, Network-First pour appels API Supabase
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Exclure les requêtes non-GET et non-HTTP
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) {
    return e.respondWith(fetch(e.request));
  }

  // Stratégie pour les appels API Supabase : Network-First avec fallback cache
  if (url.hostname.includes('supabase.co')) {
    return e.respondWith(
      fetch(e.request)
        .then((response) => {
          // Ne pas mettre en cache les réponses d'API (données dynamiques)
          return response;
        })
        .catch(() => {
          // En offline, retourner une réponse vide pour les appels API
          console.log('[SW] API call failed (offline mode)');
          return new Response(JSON.stringify({ data: null, error: 'offline' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
  }

  // Stratégie Cache-First pour les ressources CDN (une fois chargées, elles sont en cache)
  const isCDNRequest = CDN_URLS.some(cdnHost => url.hostname.includes(cdnHost));

  if (isCDNRequest) {
    return e.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Rafraîchir le cache en arrière-plan pour avoir la version la plus récente
            fetch(e.request).then((networkResponse) => {
              if (networkResponse.status === 200) {
                cache.put(e.request, networkResponse.clone());
              }
            }).catch(() => { });
            return cachedResponse;
          }
          // Pas en cache, essayer le réseau
          return fetch(e.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(e.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // En dernier recours, retourner une réponse vide
            console.log('[SW] CDN resource unavailable offline:', url.pathname);
            return new Response('', { status: 200 });
          });
        });
      })
    );
  }

  // Stratégie Stale-While-Revalidate pour toutes les autres ressources locales
  e.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(e.request).then((cachedResponse) => {
        const fetchPromise = fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            cache.put(e.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch((err) => {
          console.log('[SW] Fetch failed (offline), using cache:', err.message);
        });

        return cachedResponse || fetchPromise;
      });
    })
  );
});
