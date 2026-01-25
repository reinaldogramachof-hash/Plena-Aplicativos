# Padrão Plena - PWA Desktop/Tablet (v4.3 Final)

Este documento estabelece o padrão de desenvolvimento para aplicações **Desktop First** (compatível com Mobile) no ecossistema Plena.
O objetivo é garantir consistência visual, controle de versão robusto e experiência nativa.

---

## 1. Manifesto (manifest.json)
Campos essenciais para uma boa instalação em Desktop (Windows/Mac) e Mobile.
A propriedade `screenshots` é **obrigatória** para a loja de apps do Windows/Chrome.

```json
{
    "name": "Nome do App",
    "short_name": "NomeCurto",
    "description": "Descrição comercial completa para aparecer na instalação.",
    "categories": ["productivity", "business", "finance"],
    "start_url": "./index.html",
    "display": "standalone",
    "orientation": "any", 
    "background_color": "#ffffff",
    "theme_color": "#2563EB",
    "icons": [
        {
            "src": "./icons/icon-192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "./icons/icon-512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any maskable"
        }
    ],
    "screenshots": [
        {
            "src": "./icons/icon-512.png",
            "sizes": "512x512",
            "type": "image/png",
            "form_factor": "wide",
            "label": "Visão Desktop"
        },
        {
            "src": "./icons/icon-192.png",
            "sizes": "192x192",
            "type": "image/png",
            "label": "Mobile"
        }
    ]
}
```

---

## 2. Service Worker (sw.js)
Estratégia híbrida: **Network-First** para HTML (garante updates), **Stale-While-Revalidate** para Assets e **Network-Only** para APIs.

> **CRÍTICO:** O SW deve ignorar requisições para `api_licenca.php` para não cachear validações de licença ou notificações.

```javascript
/* sw.js */
const CACHE_NAME = 'app-nome-v4.3'; // FORMATO: app-nome-vX.Y (Incrementar Manualmente)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  '../../assets/js/plena-toolbar.js',
  '../../assets/js/plena-lock.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Strategy 0: API & Backend Calls (Network Only - Never Cache)
  if (url.pathname.includes('api_licenca.php') || url.search.includes('action=')) {
    return; // Fallback to browser default (Network)
  }

  // Strategy 1: HTML (Network First - Garante updates de versão)
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
           const clone = res.clone();
           caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
           return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Strategy 2: Assets (Stale-While-Revalidate - Velocidade)
  event.respondWith(
    caches.match(event.request).then(cached => {
        const networkFetch = fetch(event.request).then(res => {
            if(res && res.status === 200) {
                const clone = res.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return res;
        }).catch(() => {});
        return cached || networkFetch;
    })
  );
});

// Mensageria: Permite o Frontend perguntar a versão
self.addEventListener('message', event => {
  if (event.data?.type === 'GET_VERSION') {
    const version = CACHE_NAME.split('-').pop(); // 'v4.3'
    event.ports[0].postMessage({ type: 'VERSION', version: version });
  }
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
```

---

## 3. Interface (index.html)

### 3.1 Sidebar (Aba Sistema)
Adicionar como último item da Sidebar.

```html
<button onclick="router('system')" class="nav-item w-full flex items-center px-4 py-3 rounded-xl hover:bg-white/10 transition-all group" id="nav-system">
    <i data-lucide="cpu" class="w-5 h-5 mr-3 text-gray-400 group-hover:text-white"></i>
    Sistema
    <span id="sidebar-badge" class="ml-auto w-2 h-2 rounded-full bg-red-500 hidden"></span>
</button>
```

### 3.2 Header (Sino de Notificação)
Adicionar antes dos botões de ação principais.

```html
<button onclick="router('system')" class="relative p-2 mr-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors group" title="Notificações do Sistema">
    <i data-lucide="bell" class="w-6 h-6"></i>
    <span id="header-badge" class="absolute top-2 right-2 flex h-3 w-3 hidden">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
    </span>
</button>
```

### 3.3 System View Section
Section completa com Cards de Notificação, Diagnóstico e Versão. (Utilizar estrutura padrão com `id="view-system"`).

### 3.4 Componente de Instalação (Toast)
**Obrigatório:** Adicionar este código no final do `<body>` para garantir que o usuário consiga instalar o app mesmo se fechar o prompt nativo do navegador.

```html
<!-- PWA INSTALLATION TOAST -->
<div id="pwa-install-toast" style="display: none; position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background-color: white; color: black; padding: 12px 16px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 9999; align-items: center; gap: 12px; border: 1px solid #e5e7eb; min-width: 300px;">
    <div style="background-color: transparent; padding: 0; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
        <img src="./icons/icon-192.png" alt="App Icon" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;">
    </div>
    <div style="flex: 1;">
        <p style="font-size: 14px; font-weight: bold; margin: 0; color: #1f2937;">Instalar Aplicativo</p>
        <p style="font-size: 12px; color: #6b7280; margin: 0;">Acesso rápido 100% offline</p>
    </div>
    <button onclick="installPWA()" style="background-color: #000; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer; white-space: nowrap;">
        Instalar
    </button>
    <button onclick="dismissInstall()" style="background-color: transparent; border: none; color: #9ca3af; cursor: pointer; padding: 4px; display: flex; align-items: center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
</div>

<script>
    let deferredPrompt;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || document.referrer.includes('android-app://');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (!isStandalone) {
            const toast = document.getElementById('pwa-install-toast');
            if(toast) toast.style.display = 'flex';
        }
    });

    function installPWA() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                deferredPrompt = null;
                dismissInstall();
            });
        } else {
            alert("O navegador não permitiu a instalação automática. Tente pelo menu (Três pontinhos) > Instalar App.");
        }
    }

    function dismissInstall() {
        document.getElementById('pwa-install-toast').style.display = 'none';
    }
</script>
```

---

## 4. Javascript Logic
Adicionar ao final do `index.html`. Sincroniza versão real do SW com a interface.

```javascript
/* Inicialização no window.onload ou DOMContentLoaded */
function initSystemVersionCheck() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
            if (event.data.type === 'VERSION') {
                const realVersion = event.data.version;
                const stored = localStorage.getItem('plena_last_viewed_version'); // Usar para lógica de badge
                
                // Atualizar UI
                if(document.getElementById('display-installed-version')) {
                    document.getElementById('display-installed-version').textContent = realVersion;
                }
            }
        };
        navigator.serviceWorker.controller.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);
    }
}
```
