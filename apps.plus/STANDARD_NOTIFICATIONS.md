# Padrão Plena - Sistema de Notificações V5.2 (Secure Broadcast)

Este documento estabelece o padrão de implementação para o módulo de notificações em todos os PWAs Desktop/Tablet.
**Versão:** 5.2 (Stable)
**Dependências:** Tailwind CSS + FontAwesome 6 + Backend PHP V5.0

---

## 1. Requisitos de Backend (api_licenca.php)
Para que o bloqueio funcione, a API deve processar o booleano `requireRead`.

**Action:** `send_notification`
```php
// Certifique-se que esta linha existe na criação do array $new_notif
'requireRead' => $data['requireRead'] ?? false,
```

## 2. Frontend: Dependências
No `<head>` do `index.html`:
```html
<!-- FontAwesome 6 (Necessário para ícones do V5.2) -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
```

## 3. Frontend: Componentes UI

### Botão Sidebar (Menu Lateral)
Deve usar a classe `ml-auto` para o badge e suportar o estado `hidden`.

```html
<button onclick="router('system')"
    class="nav-item w-full flex items-center px-4 py-3 rounded-xl hover:bg-white/10 transition-all group relative"
    id="nav-system">
    
    <i class="fa-solid fa-microchip w-5 h-5 mr-3 text-gray-400 group-hover:text-white"></i>
    <span class="font-medium">Sistema</span>
    
    <!-- Red Dot Badge -->
    <span id="sidebar-badge" class="hidden ml-auto flex h-3 w-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
    </span>
</button>
```

### Botão Header (Topo)
```html
<button onclick="router('system')" class="relative p-2 mr-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors group">
    <i data-lucide="bell" class="w-6 h-6"></i>
    <span id="header-badge" class="absolute top-2 right-2 flex h-3 w-3 hidden">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
    </span>
</button>
```

### Container de Feed e Modal
Na view de Sistema (`#view-system`), deve existir a div alvo. O modal é injetado via JS.
```html
<div id="notification-feed-container" class="space-y-3">
    <!-- Injetado via JS -->
</div>
```

## 4. Módulo JavaScript (V5.2)
Adicionar ao final do script principal ou em arquivo separado.

```javascript
// ==========================================================
// MÓDULO DE NOTIFICAÇÕES INTELIGENTE V5.2 (Red Dot & Secure)
// ==========================================================
const NOTIF_API_URL = '../../api_licenca.php';

let activeNotifications = [];

async function initNotificationSystem() {
    const licenseKey = localStorage.getItem('plena_license_key');
    if (!licenseKey) return; 

    try {
        const response = await fetch(`${NOTIF_API_URL}?action=get_notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ license_key: licenseKey })
        });

        if (!response.ok) return;

        const data = await response.json();
        const serverNotifications = data.notifications || [];
        processNotifications(serverNotifications);

    } catch (error) {
        console.warn('SysNotif: Erro silencioso de conexão');
    }
}

function processNotifications(serverList) {
    const readIds = JSON.parse(localStorage.getItem('plena_read_notifs') || '[]');
    
    // Filtra apenas não lidas
    const unreadList = serverList.filter(n => !readIds.includes(String(n.id)));
    activeNotifications = unreadList;

    // 1. Atualiza Visual (Ponto Vermelho Pulsante)
    updateBadgeUI(unreadList.length > 0);

    // 2. Renderiza Lista (se estiver na aba sistema)
    renderNotificationList(unreadList);

    // 3. Lógica de Bloqueio (Correção de Tipagem Robusta)
    const blockingNotif = unreadList.find(n => {
        return n.requireRead === true || String(n.requireRead) === "true" || n.requireRead === 1;
    });

    if (blockingNotif) {
        showBlockingModal(blockingNotif);
    }
}

function updateBadgeUI(hasUnread) {
    // 1. Badge do Header (Sino)
    const headerBadge = document.getElementById('header-badge');
    if (headerBadge) {
        if (hasUnread) {
            headerBadge.classList.remove('hidden');
            headerBadge.style.display = 'flex';
        } else {
            headerBadge.classList.add('hidden');
            headerBadge.style.display = 'none';
        }
    }

    // 2. Badge da Sidebar (Aba Sistema)
    const sidebarBadge = document.getElementById('sidebar-badge');
    if (sidebarBadge) {
        if (hasUnread) {
            sidebarBadge.classList.remove('hidden');
            sidebarBadge.style.display = 'flex'; // Garante alinhamento flex
        } else {
            sidebarBadge.classList.add('hidden');
            sidebarBadge.style.display = 'none';
        }
    }
}

function renderNotificationList(list) {
    const container = document.getElementById('notification-feed-container'); 
    if (!container) return;

    if (list.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8 text-slate-400 opacity-60">
                <i class="fa-regular fa-circle-check text-4xl mb-2"></i>
                <p class="text-sm font-medium">Tudo limpo por aqui!</p>
            </div>
        `;
        return;
    }

    let html = '';
    list.forEach(n => {
        let iconColor = 'text-blue-500';
        let icon = 'fa-circle-info';
        let borderLeft = 'border-l-4 border-l-blue-500';
        
        if(n.type === 'danger') { iconColor = 'text-red-500'; icon = 'fa-triangle-exclamation'; borderLeft = 'border-l-4 border-l-red-500'; }
        if(n.type === 'warning') { iconColor = 'text-orange-500'; icon = 'fa-circle-exclamation'; borderLeft = 'border-l-4 border-l-orange-500'; }

        html += `
            <div class="bg-white p-4 rounded-lg shadow-sm border border-slate-100 ${borderLeft} mb-3 flex gap-4 transition hover:shadow-md">
                <div class="mt-1 ${iconColor}"><i class="fa-solid ${icon} text-xl"></i></div>
                <div class="flex-1">
                    <h4 class="font-bold text-slate-800 text-sm">${n.title || 'Mensagem do Sistema'}</h4>
                    <p class="text-slate-600 text-xs mt-1 leading-relaxed">${n.message}</p>
                    <div class="mt-2 flex justify-between items-center">
                        <span class="text-[10px] text-slate-400 font-medium">${n.date}</span>
                        <button onclick="markSingleAsRead('${n.id}')" class="text-[10px] uppercase font-bold text-slate-400 hover:text-blue-600 transition">
                            Marcar como lido
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function markAllAsRead() {
    if (activeNotifications.length === 0) return;
    const readIds = JSON.parse(localStorage.getItem('plena_read_notifs') || '[]');
    activeNotifications.forEach(n => { 
        const sid = String(n.id);
        if (!readIds.includes(sid)) readIds.push(sid); 
    });
    localStorage.setItem('plena_read_notifs', JSON.stringify(readIds));
    initNotificationSystem(); 
}

function markSingleAsRead(id) {
    const sid = String(id);
    const readIds = JSON.parse(localStorage.getItem('plena_read_notifs') || '[]');
    if (!readIds.includes(sid)) {
        readIds.push(sid);
        localStorage.setItem('plena_read_notifs', JSON.stringify(readIds));
    }
    initNotificationSystem();
}

function showBlockingModal(notif) {
    const existing = document.getElementById('sys-blocking-backdrop');
    if (existing) return;

    const modalHTML = `
    <div id="sys-blocking-backdrop" class="fixed inset-0 bg-slate-900/95 z-[99999] flex items-center justify-center p-6 backdrop-blur-md animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-100">
            <div class="bg-red-600 p-6 text-white text-center relative overflow-hidden">
                <div class="absolute inset-0 bg-white/10 opacity-20 transform -skew-y-6 scale-150"></div>
                <i class="fa-solid fa-hand-paper text-5xl mb-3 relative z-10 animate-pulse"></i>
                <h3 class="font-bold text-xl uppercase tracking-widest relative z-10">Atenção Necessária</h3>
            </div>
            <div class="p-8 text-center">
                <h4 class="font-bold text-slate-800 text-xl mb-4">${notif.title || 'Aviso Importante'}</h4>
                <div class="bg-red-50 text-slate-700 text-sm leading-relaxed p-4 rounded-xl border border-red-100 text-left">
                    ${notif.message}
                </div>
            </div>
            <div class="p-6 bg-slate-50 border-t border-slate-100">
                <button onclick="acknowledgeBlocking('${notif.id}')" 
                    class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 text-sm uppercase tracking-wide">
                    <i class="fa-solid fa-check"></i> Entendi e Li a Mensagem
                </button>
            </div>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
}

function acknowledgeBlocking(id) {
    markSingleAsRead(id);
    const el = document.getElementById('sys-blocking-backdrop');
    if (el) el.remove();
    document.body.style.overflow = '';
}

// Inicializadores
document.addEventListener('DOMContentLoaded', () => { setTimeout(initNotificationSystem, 1000); });
// Exports Globais
window.markAllAsRead = markAllAsRead;
window.markSingleAsRead = markSingleAsRead;
window.acknowledgeBlocking = acknowledgeBlocking;
window.clearSystemNotifications = markAllAsRead;
```
