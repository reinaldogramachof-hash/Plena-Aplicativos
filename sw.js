const CACHE_NAME = 'plena-root-v1';
const urlsToCache = [
    './',
    './index.html',
    // Add other critical assets here if needed, but start small to avoid caching errors
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
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
