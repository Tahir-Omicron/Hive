/* =============================================================================
 * Hive — Service Worker (Offline fallback & asset caching)
 * ========================================================================== */

const CACHE_NAME = 'hive-v2';
const STATIC_ASSETS = [
  '/',
  '/landingpage.html',
  '/loginpage.html',
  '/registerpage.html',
  '/app.html',
  '/profile.html',
  '/assets/styles.css',
  '/assets/api.js',
  '/assets/theme.js',
  '/assets/i18n.js',
  '/assets/brand/hive-icon.svg',
  '/assets/brand/favicon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Yalnız GET sorğuları və API sorğusu olmayan statik fayllar keşlənsin
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
