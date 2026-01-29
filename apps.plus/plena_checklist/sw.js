
const CACHE_NAME = 'plena-cache-v4.3-fix2';
const urlsToCache = [
  './',
  './index.html',
  '../../assets/js/plena-lock.js',
  '../../assets/js/plena-notifications.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Ignora API (Network Only)
  if (event.request.url.includes('api_licenca.php')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
