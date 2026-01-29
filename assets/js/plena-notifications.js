/**
 * PLENA NOTIFICATIONS SYSTEM (CLIENT SIDE) V2
 * Integração Nativa com Aba Sistema e Badges
 * Autor: Agente Antigravity
 * Data: 25/01/2026
 */

(function () {
    console.log("[Plena Notifs] Iniciando módulo V2 (Nativo)...");

    // ==================================================================
    // 1. STATE & CONFIG
    // ==================================================================
    const API_URL = "../../api_licenca.php";
    const STORE_KEY_READ = "plena_notifs_read";

    let LICENSE_KEY = null;
    let PRODUCT_NAME = null;

    function getMobileKey() {
        // Tenta via PlenaLock (MÉTODO PREFERENCIAL V4)
        if (window.PlenaLock && typeof window.PlenaLock.getLicenseKey === 'function') {
            return window.PlenaLock.getLicenseKey();
        }

        // Tenta recuperação manual do escopo (Fallback)
        try {
            const path = window.location.pathname;
            const parts = path.split('/').filter(p => p.length > 0);
            if (parts.length > 0 && parts[parts.length - 1].includes('.')) parts.pop();
            const appId = parts.length > 0 ? parts[parts.length - 1].toLowerCase() : 'root_app';
            const scopedKey = localStorage.getItem(`plena_license_key_${appId}`);
            if (scopedKey) return scopedKey;
        } catch (e) { }

        // Legacy / Global
        return localStorage.getItem('plena_license_key');
    }

    let notifications = [];
    let unreadCount = 0;

    // ==================================================================
    // 2. RENDER LOGIC (NATIVE UI)
    // ==================================================================

    function renderBadges() {
        const readList = getReadList();
        unreadCount = notifications.filter(n => !readList.includes(n.id)).length;

        // 1. Sidebar Badge (Standardized ID: sidebar-badge)
        const sidebarBadge = document.getElementById('sidebar-badge');
        if (sidebarBadge) {
            if (unreadCount > 0) {
                // Remove any pre-existing pulsing spans from HTML
                sidebarBadge.innerHTML = '';
                // Simple static red dot styling
                sidebarBadge.className = 'absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500';
                sidebarBadge.style.display = 'block';
            } else {
                sidebarBadge.style.display = 'none';
            }
        }

        // 2. Header Bell Badge (Robust Select for Lucide SVG)
        // Lucide transforms <i> into <svg class="lucide lucide-bell">. We look for the svg OR the i, inside a button.
        // We stick the badge on the BUTTON container, not the icon itself, for better positioning.
        const bellContainers = document.querySelectorAll('button:has(.lucide-bell), button:has(i[data-lucide="bell"]), .notification-bell-btn');

        bellContainers.forEach(btn => {
            // Avoid duplicate badges
            let badge = btn.querySelector('.header-dot-badge');

            if (!badge) {
                badge = document.createElement('span');
                // Pulsing Red Dot (Top Right of button)
                badge.className = 'header-dot-badge absolute top-1 right-1 flex h-3 w-3 hidden pointer-events-none';
                badge.innerHTML = `<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>`;

                // Ensure button is relative so absolute positioning works
                if (getComputedStyle(btn).position === 'static') {
                    btn.classList.add('relative');
                }
                btn.appendChild(badge);
            }

            if (unreadCount > 0) {
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        });
    }

    window.renderExternalNotifications = function () {
        const container = document.getElementById('notification-feed-container');
        if (!container) return; // Não estamos na aba sistema ou ela não existe

        container.innerHTML = '';

        // --- INJETAR CARD DE STATUS DA LICENÇA ---
        if (window.PlenaLock) {
            const appId = window.PlenaLock.getAppId();
            const key = window.PlenaLock.getLicenseKey();
            const deviceId = window.PlenaLock.getDeviceId();

            // Mask Key: PLENA-1234-XXXX -> PLENA-1234-***
            const maskedKey = key ? key.substring(0, 10) + '...' : 'Sem Licença';

            const licenseDiv = document.createElement('div');
            licenseDiv.className = 'bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6';
            licenseDiv.innerHTML = `
                <div class="flex items-center justify-between mb-3">
                    <h3 class="font-bold text-slate-700 flex items-center gap-2">
                        <i data-lucide="shield-check" class="text-green-500"></i>
                        Status da Licença
                    </h3>
                    <span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-lg font-bold">ATIVA</span>
                </div>
                <div class="space-y-2 text-sm text-slate-600">
                    <p class="flex justify-between">
                        <span>Aplicativo:</span>
                        <span class="font-mono font-bold text-slate-800">${appId}</span>
                    </p>
                    <p class="flex justify-between">
                        <span>Chave:</span>
                        <span class="font-mono bg-slate-100 px-1 rounded">${maskedKey}</span>
                    </p>
                    <p class="flex justify-between">
                        <span>ID Disp.:</span>
                        <span class="font-mono text-xs text-slate-400" title="${deviceId}">${deviceId.substring(0, 8)}...</span>
                    </p>
                </div>
                <button onclick="window.PlenaLock.resetLicense()" class="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                    Trocar Licença
                </button>
            `;
            container.appendChild(licenseDiv);
        }

        const readList = getReadList();

        if (notifications.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'text-center py-8 text-slate-400';
            emptyState.innerHTML = `
                <i data-lucide="bell-off" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                <p class="text-xs">Nenhuma notificação nova.</p>
            `;
            container.appendChild(emptyState);
        } else {
            notifications.forEach(n => {
                const isRead = readList.includes(n.id);
                // Style mapping
                let bgClass = 'bg-blue-50 border-blue-100';
                let iconClass = 'text-blue-600';
                let titleClass = 'text-blue-800';
                let iconName = 'info';

                if (n.type === 'warning') {
                    bgClass = 'bg-amber-50 border-amber-100';
                    iconClass = 'text-amber-600';
                    titleClass = 'text-amber-800';
                    iconName = 'alert-triangle';
                } else if (n.type === 'error' || n.type === 'danger') {
                    bgClass = 'bg-red-50 border-red-100';
                    iconClass = 'text-red-600';
                    titleClass = 'text-red-800';
                    iconName = 'x-circle';
                } else if (n.type === 'success') {
                    bgClass = 'bg-green-50 border-green-100';
                    iconClass = 'text-green-600';
                    titleClass = 'text-green-800';
                    iconName = 'check-circle';
                }

                const div = document.createElement('div');
                div.className = `p-4 rounded-xl border flex items-start gap-3 transition-opacity ${bgClass} ${isRead ? 'opacity-60' : 'opacity-100'}`;
                // Mark as read on click logic?
                // div.onclick = () => markAsRead(n.id); 

                div.innerHTML = `
                    <i data-lucide="${iconName}" class="w-5 h-5 ${iconClass} mt-0.5 flex-shrink-0"></i>
                    <div class="flex-1">
                        <div class="flex justify-between items-start">
                             <p class="text-sm font-bold ${titleClass}">
                                ${n.requireRead ? '<i class="fas fa-exclamation-circle mr-1 text-red-500 animate-pulse"></i>' : ''}
                                ${n.title}
                             </p>
                             ${!isRead ? '<span class="w-2 h-2 rounded-full bg-blue-500"></span>' : ''}
                        </div>
                        <p class="text-xs ${iconClass} mt-1 leading-relaxed">${n.message}</p>
                        <p class="text-[10px] ${titleClass} opacity-60 mt-2 flex items-center gap-1">
                            <i data-lucide="clock" class="w-3 h-3"></i>
                            ${new Date(n.date).toLocaleString('pt-BR')}
                        </p>
                        ${n.requireRead && !isRead ? `
                            <button onclick="markAsRead('${n.id}')" class="mt-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors w-full text-center font-bold border border-red-200">
                                <i class="fas fa-check mr-1"></i> Confirmar Leitura
                            </button>
                        ` : ''}
                    </div>
                `;

                // Se for requireRead e não lida, força um alert na primeira vez (opcional, pode ser intrusivo)
                // if (n.requireRead && !isRead && !sessionStorage.getItem('read_alert_' + n.id)) {
                //    alert(`[COMUNICADO IMPORTANTE]\n\n${n.title}\n\n${n.message}`);
                //    sessionStorage.setItem('read_alert_' + n.id, 'shown');
                // }
                container.appendChild(div);
            });

            // Re-init icons for newly added content
            if (window.lucide) lucide.createIcons();
        }
    };

    window.markAsRead = function (id) {
        const readList = getReadList();
        if (!readList.includes(id)) {
            readList.push(id);
            localStorage.setItem(STORE_KEY_READ, JSON.stringify(readList));
            renderExternalNotifications();
            renderBadges();
        }
    };

    // Expose Global Clear Function (used by System Tab button)
    window.clearSystemNotifications = function () {
        if (confirm('Limpar todas as notificações?')) {
            const allIds = notifications.map(n => n.id);
            localStorage.setItem(STORE_KEY_READ, JSON.stringify(allIds));
            renderExternalNotifications();
            renderBadges();
        }
    };

    // ==================================================================
    // 3. FETCH & DATA
    // ==================================================================

    async function fetchNotifications() {
        LICENSE_KEY = getMobileKey(); // Refresh Key
        if (!LICENSE_KEY) return;
        try {
            const response = await fetch(API_URL + '?action=get_notifications', {
                method: 'POST',
                body: JSON.stringify({ license_key: LICENSE_KEY }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (data && data.notifications) {
                notifications = data.notifications;
                renderBadges();
                // If System Tab is open (naive check: container exists and is visible-ish), render
                if (document.getElementById('notification-feed-container')) {
                    renderExternalNotifications();
                }
            }
        } catch (e) {
            console.error("Notif Error", e);
        }
    }

    function getReadList() {
        try { return JSON.parse(localStorage.getItem(STORE_KEY_READ) || '[]'); } catch { return []; }
    }

    // ==================================================================
    // 4. ROUTER HOOK & INIT
    // ==================================================================

    function hookRouter() {
        // Intercepta a função router global para injetar comportamento
        const originalRouter = window.router;
        if (typeof originalRouter === 'function') {
            window.router = function (view) {
                // Executa original
                originalRouter(view);

                // Nossas injeções
                if (view === 'system') {
                    // Pequeno delay para garantir que o DOM show/hide rodou
                    setTimeout(() => {
                        renderExternalNotifications();
                        // AUTO-MARK AS READ (User Experience: Opened tab = Seen)
                        // Apenas marca como lido notificações que NÃO requerem leitura explícita (requireRead: false)
                        const readList = getReadList();
                        let changed = false;
                        notifications.forEach(n => {
                            if (!n.requireRead && !readList.includes(n.id)) {
                                readList.push(n.id);
                                changed = true;
                            }
                        });
                        if (changed) {
                            localStorage.setItem(STORE_KEY_READ, JSON.stringify(readList));
                            renderBadges(); // Atualiza, removendo badges se tudo foi lido
                            // Re-render feed para atualizar opacidade visual
                            renderExternalNotifications();
                        }
                    }, 50);
                }
            };
        }

        // Hijack do Sino (Redirecionar para System Tab)
        // Procura por botões de sino genéricos
        const bells = document.querySelectorAll('button i[data-lucide="bell"], button .fa-bell');
        bells.forEach(icon => {
            const btn = icon.closest('button');
            if (btn) {
                // Remove listeners antigos (clone node hack ou apenas sobrescreve onclick)
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.router) window.router('system');
                };
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        hookRouter();
        fetchNotifications();
        setInterval(fetchNotifications, 60000);

        // Auto-run if already on system page
        if (!document.getElementById('view-system')?.classList.contains('hide')) {
            renderExternalNotifications();
        }
    });

    // Fallback immediate
    if (document.readyState !== 'loading') {
        hookRouter();
        fetchNotifications();
    }

})();
