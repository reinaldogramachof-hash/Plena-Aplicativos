# ⚙️ Módulo Sistema e Telemetria (Padrão V1.0)

Este documento define a especificação oficial para a aba "Sistema" em aplicativos Plena. Este componente serve como painel de controle centralizado, oferecendo notificações, diagnóstico de hardware/rede e gerenciamento de versão.

**Versão do Documento:** 1.0
**Data de Criação:** 24/01/2026
**Status:** Padrão Ativo

---

## 1. Estrutura Visual (HTML)

O módulo deve ser encapsulado em uma `<section>` com ID `#view-system`.

**Dependências:**
- Tailwind CSS (Estilização e Grid)
- Lucide Icons (Ícones principais)
- FontAwesome 6 (Legado/Ícones específicos)

```html
<!-- System View -->
<section id="view-system" class="view-section hide fade-in">
    <div class="max-w-4xl mx-auto pb-12">

        <!-- Header e Status Global -->
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 class="text-xl font-bold text-slate-800">Sistema e Atualizações</h2>
                <p class="text-sm text-slate-600">Central de notificações e controle de versão</p>
            </div>
            <div class="flex items-center gap-3">
                <span id="system-status-indicator"
                    class="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Sistema Operacional
                </span>
            </div>
        </div>

        <!-- Grid Layout Principal -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <!-- Coluna 1: Notificações e Diagnóstico -->
            <div class="space-y-6">
                
                <!-- Card de Notificações -->
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-slate-800 flex items-center">
                            <i data-lucide="bell" class="w-5 h-5 mr-2 text-plena-blue"></i>
                            Notificações do Sistema
                        </h3>
                        <button onclick="clearSystemNotifications()"
                            class="text-xs text-slate-400 hover:text-plena-blue">
                            Limpar tudo
                        </button>
                    </div>
                    <div id="notification-feed-container" class="space-y-3">
                        <!-- Conteúdo Injetado via JS (renderNotificationList) -->
                    </div>
                </div>

                <!-- Card de Diagnóstico do Dispositivo -->
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 class="font-bold text-slate-800 mb-4 flex items-center">
                        <i data-lucide="activity" class="w-5 h-5 mr-2 text-slate-500"></i>
                        Diagnóstico do Dispositivo
                    </h3>
                    <div class="space-y-4">
                        <!-- Barra de Armazenamento -->
                        <div>
                            <div class="flex justify-between text-xs mb-1">
                                <span class="text-slate-500">Armazenamento Local (Estimado)</span>
                                <span class="font-bold text-slate-700" id="storage-usage">Calculando...</span>
                            </div>
                            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div id="storage-bar" class="h-full bg-plena-blue" style="width: 5%"></div>
                            </div>
                        </div>
                        <!-- Status de Rede e SW -->
                        <div class="grid grid-cols-2 gap-3 text-xs">
                            <div class="p-3 bg-slate-50 rounded-lg text-center">
                                <span class="block text-slate-400 mb-1">Status Offline/Online</span>
                                <span id="conn-status" class="font-bold text-green-600">Online</span>
                            </div>
                            <div class="p-3 bg-slate-50 rounded-lg text-center">
                                <span class="block text-slate-400 mb-1">Service Worker</span>
                                <span id="sw-status" class="font-bold text-green-600">Ativo</span>
                            </div>
                        </div>
                        <!-- Novo: Status de Backup (Injetado dinamicamente no JS) -->
                    </div>
                </div>
            </div>

            <!-- Coluna 2: Versão e Changelog -->
            <div class="space-y-6">
                
                <!-- Central de Atualização (Hero Card) -->
                <div class="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div class="relative z-10">
                        <div class="flex items-start justify-between">
                            <div>
                                <p class="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">
                                    Versão Instalada</p>
                                <h3 id="display-installed-version" class="text-3xl font-bold text-white mb-2">v4.3</h3>
                                <p class="text-slate-300 text-xs">Build 2026.01.24 • Desktop Pro</p>
                            </div>
                            <div class="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                                <i data-lucide="zap" class="w-6 h-6 text-yellow-400"></i>
                            </div>
                        </div>

                        <div class="mt-6">
                            <button onclick="checkForUpdates()"
                                class="w-full bg-plena-blue hover:bg-blue-600 text-white py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50">
                                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                                Buscar Atualizações
                            </button>
                            <p class="text-[10px] text-center text-slate-400 mt-2">Última verificação: <span
                                    id="last-update-check">Nunca</span></p>
                        </div>
                    </div>
                    <!-- Decoração de Fundo -->
                    <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-plena-blue/20 rounded-full blur-2xl"></div>
                </div>

                <!-- Feed de Changelog (Histórico) -->
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 class="font-bold text-slate-800 mb-4 flex items-center">
                        <i data-lucide="list" class="w-5 h-5 mr-2 text-slate-500"></i>
                        Histórico de Mudanças
                    </h3>
                    <div class="space-y-0" id="changelog-feed">
                        <!-- Conteúdo Injetado via JS (renderChangelog) -->
                    </div>
                </div>
            </div>

        </div>
    </div>
</section>
```

---

## 2. Lógica de Negócios (JavaScript)

### 2.1 Constantes e Estado

Devem ser declaradas no escopo global ou dentro de um módulo isolado se estiver usando ES Modules.

```javascript
// Histórico de Versões
const CHANGELOG = [
    { version: 'v4.3', date: '24/01/2026', changes: ['Melhoria no mecanismo de update', 'Detecção real de versão do SW'] },
    { version: 'v4.2', date: '24/01/2026', changes: ['Novo Sistema Centralizado', 'Aba de Diagnóstico e Rede', 'Notificações em Tempo Real'] },
    { version: 'v4.1', date: '10/01/2026', changes: ['Módulo Financeiro Avançado', 'Exportação PDF'] },
    { version: 'v4.0', date: '01/01/2026', changes: ['Lançamento Oficial'] }
];

let CURRENT_VERSION = CHANGELOG[0].version; 
const NOTIF_API_URL = '../../api_licenca.php'; // Endpoint (Simulado/Real)
let activeNotifications = [];
```

### 2.2 Inicialização e Renderização

A função `renderSystemTab` orquestra a montagem da tela.

```javascript
function renderSystemTab() {
    // 1. Renderização Inicial
    renderChangelog();
    updateDiagnostics();
    updateVersionDisplay();
    initNotificationSystem();

    // 2. Verificação de Versão Real via Service Worker (Comunicação Assíncrona)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
            if (event.data.type === 'VERSION') {
                if (CURRENT_VERSION !== event.data.version) {
                    CURRENT_VERSION = event.data.version;
                    updateVersionDisplay();
                    renderChangelog(); // Re-renderiza para atualizar badges de "Instalado"
                }
            }
        };
        // Pergunta ao SW qual a versão real dele
        navigator.serviceWorker.controller.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);
    }

    // Limpa os Badges visuais ao entrar na aba
    document.getElementById('header-badge').classList.add('hidden');
    document.getElementById('sidebar-badge').classList.add('hidden');
}

function updateVersionDisplay() {
    const mainDisplay = document.getElementById('display-installed-version');
    if (mainDisplay) mainDisplay.textContent = CURRENT_VERSION;
}

function renderChangelog() {
    const feed = document.getElementById('changelog-feed');
    if (feed) {
        feed.innerHTML = CHANGELOG.map((log, index) => {
            const isCurrent = log.version === CURRENT_VERSION;
            return `
            <div class="relative pl-6 pb-6 border-l border-slate-200 last:border-0 ${index === CHANGELOG.length - 1 ? '' : 'border-l-2'} border-slate-200">
                <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full ${isCurrent ? 'bg-plena-blue border-white ring-4 ring-blue-50' : 'bg-slate-200 border-white'} border-2"></div>
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <span class="text-sm font-bold text-slate-800">${log.version}</span>
                        <span class="text-xs text-slate-400 ml-2">${log.date}</span>
                    </div>
                    ${isCurrent ? '<span class="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Instalado</span>' : ''}
                </div>
                <ul class="space-y-1">
                    ${log.changes.map(change => `<li class="text-xs text-slate-600 flex items-start gap-2"><span class="text-slate-300">•</span> ${change}</li>`).join('')}
                </ul>
            </div>
        `}).join('');
    }
}
```

### 2.3 Diagnóstico de Hardware e Rede

Monitora Storage API e Status Online/Offline.

```javascript
function updateDiagnostics() {
    // 1. Armazenamento (Storage API)
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
            const usedMB = (estimate.usage / 1024 / 1024).toFixed(2);
            const percent = Math.round((estimate.usage / estimate.quota) * 100);
            document.getElementById('storage-usage').textContent = `${usedMB} MB usado`;
            document.getElementById('storage-bar').style.width = `${Math.max(percent, 5)}%`;
        });
    } else {
        document.getElementById('storage-usage').textContent = '—';
    }

    // 2. Status de Backup (Injeção dinâmica no DOM)
    const lastBackup = localStorage.getItem('plena_last_backup_date');
    let backupStatusEl = document.getElementById('backup-status-text');
    
    // Cria o elemento se não existir
    if (!backupStatusEl) {
        const grid = document.querySelector('#view-system .grid.grid-cols-2.gap-3');
        if (grid) {
            grid.innerHTML += `
                <div class="p-3 bg-slate-50 rounded-lg text-center col-span-2">
                    <span class="block text-slate-400 mb-1 text-[10px] uppercase font-bold">Último Backup</span>
                    <span id="backup-status-text" class="font-bold text-slate-700">-</span>
                </div>
             `;
            backupStatusEl = document.getElementById('backup-status-text');
        }
    }

    // Lógica de cores baseada em datas
    if (backupStatusEl) {
        if (!lastBackup) {
            backupStatusEl.textContent = 'Nunca realizado ⚠️';
            backupStatusEl.className = 'font-bold text-red-500';
        } else {
            const daysDiff = Math.floor((new Date() - new Date(lastBackup)) / (1000 * 60 * 60 * 24));
            if (daysDiff === 0) {
                backupStatusEl.textContent = 'Hoje ✅';
                backupStatusEl.className = 'font-bold text-green-600';
            } else if (daysDiff > 7) {
                backupStatusEl.textContent = `${daysDiff} dias atrás ⚠️`;
                backupStatusEl.className = 'font-bold text-amber-500';
            } else {
                backupStatusEl.textContent = `${daysDiff} dias atrás`;
                backupStatusEl.className = 'font-bold text-slate-600';
            }
        }
    }

    // 3. Conexão e Service Worker
    const cStatus = document.getElementById('conn-status');
    if (cStatus) {
        cStatus.textContent = navigator.onLine ? 'Online' : 'Offline';
        cStatus.className = navigator.onLine ? 'font-bold text-green-600' : 'font-bold text-red-600';
    }

    const swStatus = document.getElementById('sw-status');
    if (swStatus) {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            swStatus.textContent = 'Ativo';
            swStatus.className = 'font-bold text-green-600';
        } else {
            swStatus.textContent = 'Inativo';
            swStatus.className = 'font-bold text-amber-500';
        }
    }
}
```

### 2.4 Sistema de Notificações

Gerencia o fetch, armazenamento e exibição de notificações do sistema.

```javascript
async function initNotificationSystem() {
    const licenseKey = localStorage.getItem('plena_license_key');
    if (!licenseKey) return; // Só busca se tiver licença ativa (simulado)

    try {
        const response = await fetch(`${NOTIF_API_URL}?action=get_notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ license_key: licenseKey })
        });
        if (!response.ok) return;
        const data = await response.json();
        processNotifications(data.notifications || []);
    } catch (error) {
        console.warn('SysNotif: Erro silencioso de conexão');
    }
}

function processNotifications(serverList) {
    const readIds = JSON.parse(localStorage.getItem('plena_read_notifs') || '[]');
    const unreadList = serverList.filter(n => !readIds.includes(n.id));
    activeNotifications = unreadList;

    updateBadgeUI(unreadList.length > 0);
    renderNotificationList(unreadList);
    
    // Verifica notificações bloqueantes (Modais de aviso crítico)
    const blockingNotif = unreadList.find(n => n.requireRead === true || n.requireRead === "true");
    if (blockingNotif) showBlockingModal(blockingNotif);
}

function updateBadgeUI(hasUnread) {
    // Atualiza bolinha vermelha no Header e Sidebar
    ['header-badge', 'sidebar-badge'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = hasUnread ? 'flex' : 'none';
    });
}
```

### 2.5 Gerenciamento de Update (Service Worker)

```javascript
function checkForUpdates() {
    const btn = document.querySelector('[onclick="checkForUpdates()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Buscando...`;
    lucide.createIcons();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
            reg.update().then(() => {
                setTimeout(() => {
                    if (reg.installing || reg.waiting) {
                        // Update encontrado
                        btn.innerHTML = `<i data-lucide="download" class="w-4 h-4"></i> Atualizar...`;
                        showUpdateToast(reg.installing || reg.waiting);
                    } else {
                        // Sem updates
                        btn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Sistema Atualizado`;
                        document.getElementById('last-update-check').textContent = new Date().toLocaleTimeString();
                        setTimeout(() => btn.innerHTML = originalText, 3000);
                    }
                }, 1000);
            });
        });
    } else {
        showNotification('Modo Dev/Offline: SW não detectado.', 'warning');
        btn.innerHTML = originalText;
    }
}
```

---

## 3. Análise Crítica e Recomendações

1.  **Dependências de Ícones**: O código mistura Lucide (`data-lucide`) com FontAwesome (`fa-solid`). **Recomendação:** Padronizar tudo para Lucide para reduzir o bundle size e manter a coerência visual.
2.  **API de Licença**: O endpoint `../../api_licenca.php` assume uma estrutura de diretórios específica. Em ambientes PWA/Offline puros, deve-se implementar fallback gracioso (catch) como demonstrado, para que o app não quebre se a API estiver inacessível.
3.  **Service Worker**: A função `checkForUpdates` requer um `sw.js` configurado corretamente para responder a eventos de atualização. Certifique-se de que o `sw.js` implemente `skipWaiting` quando solicitado.
