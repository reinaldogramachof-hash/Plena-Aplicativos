# Protocolo Mestre de Deploy - Plena Apps (V5.3 Performance)

Este documento unifica PWA, Notificações e UI em um único template otimizado.
**Meta:** Zero-Configuração, Performance Máxima, PWA Nativo.

---

## 1. Otimizações de Performance (Checklist Obrigatório)
- [ ] **DNS Prefetch:** Sempre incluir `<link rel="preconnect">` para os CDNs (Tailwind, FontAwesome, Vue).
- [ ] **Defer Scripts:** Scripts pesados (FontAwesome) devem ter `defer`.
- [ ] **Cache First:** O Service Worker deve priorizar ativos estáticos.
- [ ] **Lock System:** O `plena-lock.js` deve ser o primeiro script executável no `<head>` para evitar FOUC (Flash of Unstyled Content).

---

## 2. Template Mestre: `index.html` (Skeleton)
*Use este HTML base para QUALQUER novo aplicativo ou refatoração.*

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Plena [NomeApp] - Gestão Profissional</title>

    <link rel="preconnect" href="https://cdn.tailwindcss.com">
    <link rel="preconnect" href="https://cdnjs.cloudflare.com">
    <link rel="preconnect" href="https://unpkg.com">

    <meta name="theme-color" content="#2563EB">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="manifest" href="./manifest.json">

    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: { extend: { colors: { plena: { blue: '#2563EB', dark: '#1e3a8a', black: '#0f172a' } } } }
        }
    </script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" media="print" onload="this.media='all'">

    <script src="../../assets/js/plena-lock.js"></script>
</head>
<body class="bg-slate-50 text-slate-800 font-sans select-none overflow-hidden">

    <div id="app" class="flex h-screen w-full overflow-hidden" v-cloak>
        <aside class="w-64 bg-slate-900 text-white flex flex-col transition-all duration-300 z-20">
            <div class="p-6 border-b border-slate-800">
                <h1 class="font-bold text-xl tracking-tighter flex items-center gap-2">
                    <i class="fa-solid fa-layer-group text-plena-blue"></i> PLENA <span class="text-plena-blue uppercase">[APP]</span>
                </h1>
            </div>
            
            <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                <button @click="currentTab = 'dashboard'" :class="currentTab === 'dashboard' ? 'bg-plena-blue shadow-lg shadow-blue-900/50' : 'hover:bg-white/5'" class="w-full flex items-center px-4 py-3 rounded-xl transition-all font-medium">
                    <i class="fa-solid fa-chart-pie w-6"></i> Dashboard
                </button>
                
                <button @click="currentTab = 'sistema'" :class="currentTab === 'sistema' ? 'bg-plena-blue shadow-lg' : 'hover:bg-white/5'" class="mt-8 w-full flex items-center px-4 py-3 rounded-xl transition-all font-medium relative group">
                    <i class="fa-solid fa-microchip w-6"></i> Sistema
                    <span id="sidebar-badge" class="hidden ml-auto flex h-3 w-3">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                </button>
            </nav>
        </aside>

        <main class="flex-1 flex flex-col relative min-w-0 bg-slate-50">
            <header class="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-8 shadow-sm z-10">
                <h2 class="font-bold text-lg text-slate-800 capitalize">{{ currentTab }}</h2>
                <div class="flex items-center gap-4">
                    <button @click="currentTab = 'sistema'" class="relative p-2 text-slate-400 hover:text-plena-blue transition">
                        <i class="fa-regular fa-bell text-xl"></i>
                        <span id="header-badge" class="absolute top-2 right-2 flex h-3 w-3 hidden">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                        </span>
                    </button>
                </div>
            </header>

            <div class="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth" id="main-scroll">
                
                <div v-if="currentTab === 'dashboard'" class="animate-fade-in-up">
                    </div>

                <div v-if="currentTab === 'sistema'" class="animate-fade-in-up">
                    </div>

            </div>
        </main>
    </div>

    <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>

    <script>
        const { createApp, ref, onMounted } = Vue;
        const NOTIF_API_URL = '../../api_licenca.php';

        createApp({
            setup() {
                const currentTab = ref('dashboard');
                return { currentTab };
            }
        }).mount('#app');

        // --- SISTEMA DE NOTIFICAÇÕES (Secure Broadcast V5.2) ---
        // (Copiar lógica minificada de STANDARD_NOTIFICATIONS.md aqui para performance)
        // initNotificationSystem(), processNotifications(), showBlockingModal()...
    </script>
</body>
</html>
```

---

## 3. Manifesto Otimizado (`manifest.json`)

```json
{
    "name": "Plena [Nome]",
    "short_name": "[Nome]",
    "start_url": "./index.html",
    "display": "standalone",
    "background_color": "#0f172a",
    "theme_color": "#2563EB",
    "icons": [
        { "src": "./icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
        { "src": "./icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ]
}
```

---

## 4. Service Worker Cache-First (`sw.js`)

```javascript
const CACHE_NAME = 'plena-[app]-v5.3';
const CORE_ASSETS = ['./', './index.html', '../../assets/js/plena-lock.js'];

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
```
