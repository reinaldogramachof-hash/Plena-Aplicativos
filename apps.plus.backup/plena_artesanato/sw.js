const CACHE_NAME = 'plena-artesanato-v5.3';
const CORE_ASSETS = ['./', './index.html'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(CORE_ASSETS))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.map(c => c !== CACHE_NAME && caches.delete(c))))));

// Estratégia Híbrida: 
// 1. API = Network Only
// 2. HTML/JS = Stale-While-Revalidate (Performance + Update)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.href.includes('api_licenca.php')) return; // API Direta

  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone()));
        return res;
      });
      return cached || network;
    })
  );
});
