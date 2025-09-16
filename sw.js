const CACHE_NAME = 'sales-calendar-v5';
const urlsToCache = [
  './',
  './index.html',
  './styles/main.css',
  './styles/components.css',
  './scripts/app.js',
  './scripts/core.js',
  './scripts/components.js',
  './scripts/features.js',
  './scripts/config.js',
  './assets/help-data.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

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
    })
  );
});
