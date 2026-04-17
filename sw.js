const CACHE_NAME = 'penjualan-20260417-3';

const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  // JS modules
  './js/state.js',
  './js/utils.js',
  './js/db.js',
  './js/tags.js',
  './js/promo.js',
  './js/image.js',
  './js/products.js',
  './js/cart.js',
  './js/checkout.js',
  './js/categories.js',
  './js/sales.js',
  './js/dashboard.js',
  './js/artists.js',
  './js/preorders.js',
  './js/payment-methods.js',
  './js/import-export.js',
  './js/delete-mode.js',
  './js/ui.js',
  './js/main.js',
  // CDN assets — cached on first load, served offline after
  'https://cdnjs.cloudflare.com/ajax/libs/exif-js/2.3.0/exif.min.js',
  'https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css',
  'https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css',
];

// Install: cache all static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for static assets, network-first for everything else
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Cache valid responses from our origin and CDNs
          if (
            response &&
            response.status === 200 &&
            (response.type === 'basic' || response.type === 'cors')
          ) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If fetch fails and nothing is cached, return offline fallback for HTML
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
