const CACHE_NAME = 'plena-pdv-v2';
const ASSETS = [
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/lucide@0.263.1'
];

// Instalação: Cache inicial de assets críticos
self.addEventListener('install', (e) => {
    self.skipWaiting(); // Força ativação imediata do novo SW
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
    );
});

// Ativação: Limpeza de caches antigos
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[SW] Removendo cache antigo:', key);
                    return caches.delete(key);
                }
            }));
        }).then(() => self.clients.claim()) // Assume controle imediato das páginas
    );
});

// Fetch: Estratégia Híbrida
self.addEventListener('fetch', (e) => {
    // 1. Estratégia Network-First para arquivos HTML (Navegação)
    // Garante que o usuário sempre receba a versão mais nova do app se estiver online
    if (e.request.mode === 'navigate') {
        e.respondWith(
            fetch(e.request)
                .then((response) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, response.clone());
                        return response;
                    });
                })
                .catch(() => {
                    // Se offline, usa o cache
                    return caches.match(e.request);
                })
        );
        return;
    }

    // 2. Estratégia Stale-While-Revalidate para outros recursos
    // Entrega rápido do cache, mas atualiza em background para a próxima vez
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            const fetchPromise = fetch(e.request).then((networkResponse) => {
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, networkResponse.clone());
                });
                return networkResponse;
            });
            // Retorna cache se existir, senão espera a rede
            return cachedResponse || fetchPromise;
        })
    );
});