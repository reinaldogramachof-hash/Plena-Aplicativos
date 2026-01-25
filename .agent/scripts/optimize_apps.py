
import os
import re

# Configurações
TARGET_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus.backup"
EXCLUSIONS = ["plena_motoboy", "plena_motorista"]

# -----------------------------------------------------------------------------
# 1. CSS HÍBRIDO (Injetado no <head>)
# -----------------------------------------------------------------------------
HYBRID_CSS = """
    <style id="plena-hybrid-pro-css">
        /* --- PLENA HÍBRIDO PRO V1.0 --- */
        
        /* Utilitários Essenciais */
        .hide { display: none !important; }
        .fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        /* Sidebar Base */
        .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            width: 280px;
            z-index: 50;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow-y: auto;
        }

        /* Comportamento Desktop (>= 1024px) */
        @media (min-width: 1024px) {
            .sidebar { transform: translateX(0) !important; }
            .main-content { margin-left: 280px !important; width: auto !important; }
            /* Esconde toggle apenas em desktop se desejar, mas mantê-lo funcional é bom prática híbrida */
        }

        /* Comportamento Mobile/Tablet (< 1024px) */
        @media (max-width: 1023.9px) {
            .sidebar { transform: translateX(-100%); box-shadow: 0 0 0 100vw rgba(0,0,0,0.5); }
            .sidebar.open { transform: translateX(0); }
            .main-content { margin-left: 0 !important; width: 100% !important; }
        }

        /* Scrollbar Premium */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.4); }
    </style>
"""

# -----------------------------------------------------------------------------
# 2. HTML DO MÓDULO SISTEMA V1.0
# -----------------------------------------------------------------------------
SYSTEM_HTML = """
            <!-- System View V1.0 (Padronizado) -->
            <section id="view-system" class="view-section hide fade-in">
                <div class="max-w-4xl mx-auto pb-12">
                    <!-- Header e Status Global -->
                    <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 class="text-xl font-bold text-slate-800">Sistema e Atualizações</h2>
                            <p class="text-sm text-slate-600">Central de notificações e controle de versão</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <span id="system-status-indicator" class="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
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
                                    <button onclick="clearSystemNotifications()" class="text-xs text-slate-400 hover:text-plena-blue">Limpar tudo</button>
                                </div>
                                <div id="notification-feed-container" class="space-y-3"></div>
                            </div>

                            <!-- Card de Diagnóstico do Dispositivo -->
                            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 class="font-bold text-slate-800 mb-4 flex items-center">
                                    <i data-lucide="activity" class="w-5 h-5 mr-2 text-slate-500"></i>
                                    Diagnóstico do Dispositivo
                                </h3>
                                <div class="space-y-4">
                                    <div>
                                        <div class="flex justify-between text-xs mb-1">
                                            <span class="text-slate-500">Armazenamento Local (Estimado)</span>
                                            <span class="font-bold text-slate-700" id="storage-usage">Calculando...</span>
                                        </div>
                                        <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div id="storage-bar" class="h-full bg-plena-blue" style="width: 5%"></div>
                                        </div>
                                    </div>
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
                                </div>
                            </div>
                        </div>

                        <!-- Coluna 2: Versão e Changelog -->
                        <div class="space-y-6">
                            <!-- Central de Atualização -->
                            <div class="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                                <div class="relative z-10">
                                    <div class="flex items-start justify-between">
                                        <div>
                                            <p class="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Versão Instalada</p>
                                            <h3 id="display-installed-version" class="text-3xl font-bold text-white mb-2">v4.3</h3>
                                            <p class="text-slate-300 text-xs">Build 2026.01.24 • Desktop Pro</p>
                                        </div>
                                        <div class="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                                            <i data-lucide="zap" class="w-6 h-6 text-yellow-400"></i>
                                        </div>
                                    </div>
                                    <div class="mt-6">
                                        <button onclick="checkForUpdates()" class="w-full bg-plena-blue hover:bg-blue-600 text-white py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50">
                                            <i data-lucide="refresh-cw" class="w-4 h-4"></i> Buscar Atualizações
                                        </button>
                                        <p class="text-[10px] text-center text-slate-400 mt-2">Última verificação: <span id="last-update-check">Nunca</span></p>
                                    </div>
                                </div>
                                <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-plena-blue/20 rounded-full blur-2xl"></div>
                            </div>

                            <!-- Feed de Changelog -->
                            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 class="font-bold text-slate-800 mb-4 flex items-center">
                                    <i data-lucide="list" class="w-5 h-5 mr-2 text-slate-500"></i> Histórico de Mudanças
                                </h3>
                                <div class="space-y-0" id="changelog-feed"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
"""

# -----------------------------------------------------------------------------
# 3. Lógica JS JS V1.0
# -----------------------------------------------------------------------------
SYSTEM_JS = """
            // --- SISTEMA E TELEMETRIA V1.0 ---
            const CHANGELOG = [
                { version: 'v4.3', date: '24/01/2026', changes: ['Melhoria no mecanismo de update', 'Detecção real de versão do SW'] },
                { version: 'v4.2', date: '24/01/2026', changes: ['Novo Sistema Centralizado', 'Aba de Diagnóstico e Rede', 'Notificações em Tempo Real'] },
                { version: 'v4.1', date: '10/01/2026', changes: ['Módulo Financeiro Avançado', 'Exportação PDF'] },
                { version: 'v4.0', date: '01/01/2026', changes: ['Lançamento Oficial'] }
            ];

            let CURRENT_VERSION = CHANGELOG[0].version; 
            const NOTIF_API_URL = '../../api_licenca.php';
            let activeNotifications = [];

            function renderSystemTab() {
                renderChangelog();
                updateDiagnostics();
                updateVersionDisplay();
                initNotificationSystem();

                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    const messageChannel = new MessageChannel();
                    messageChannel.port1.onmessage = (event) => {
                        if (event.data.type === 'VERSION') {
                            if (CURRENT_VERSION !== event.data.version) {
                                CURRENT_VERSION = event.data.version;
                                updateVersionDisplay();
                                renderChangelog();
                            }
                        }
                    };
                    navigator.serviceWorker.controller.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);
                }
                const hb = document.getElementById('header-badge'); if(hb) hb.classList.add('hidden');
                const sb = document.getElementById('sidebar-badge'); if(sb) sb.classList.add('hidden');
            }

            function updateVersionDisplay() {
                const el = document.getElementById('display-installed-version');
                if (el) el.textContent = CURRENT_VERSION;
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
                                <div><span class="text-sm font-bold text-slate-800">${log.version}</span><span class="text-xs text-slate-400 ml-2">${log.date}</span></div>
                                ${isCurrent ? '<span class="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Instalado</span>' : ''}
                            </div>
                            <ul class="space-y-1">${log.changes.map(c => `<li class="text-xs text-slate-600 flex items-start gap-2"><span class="text-slate-300">•</span> ${c}</li>`).join('')}</ul>
                        </div>
                    `}).join('');
                }
            }

            function updateDiagnostics() {
                if ('storage' in navigator && 'estimate' in navigator.storage) {
                    navigator.storage.estimate().then(estimate => {
                        const usedMB = (estimate.usage / 1024 / 1024).toFixed(2);
                        const percent = Math.round((estimate.usage / estimate.quota) * 100);
                        const eu = document.getElementById('storage-usage'); if(eu) eu.textContent = `${usedMB} MB usado`;
                        const eb = document.getElementById('storage-bar'); if(eb) eb.style.width = `${Math.max(percent, 5)}%`;
                    });
                } else {
                    const eu = document.getElementById('storage-usage'); if(eu) eu.textContent = '—';
                }

                // Backup Status Logic
                const lastBackup = localStorage.getItem('plena_last_backup_date');
                let backupStatusEl = document.getElementById('backup-status-text');
                if (!backupStatusEl) {
                    const grid = document.querySelector('#view-system .grid.grid-cols-2.gap-3');
                    if (grid) {
                        grid.innerHTML += `<div class="p-3 bg-slate-50 rounded-lg text-center col-span-2"><span class="block text-slate-400 mb-1 text-[10px] uppercase font-bold">Último Backup</span><span id="backup-status-text" class="font-bold text-slate-700">-</span></div>`;
                        backupStatusEl = document.getElementById('backup-status-text');
                    }
                }
                if (backupStatusEl) {
                    if (!lastBackup) {
                        backupStatusEl.textContent = 'Nunca realizado ⚠️'; backupStatusEl.className = 'font-bold text-red-500';
                    } else {
                        const daysDiff = Math.floor((new Date() - new Date(lastBackup)) / (1000 * 60 * 60 * 24));
                        if (daysDiff === 0) { backupStatusEl.textContent = 'Hoje ✅'; backupStatusEl.className = 'font-bold text-green-600'; }
                        else if (daysDiff > 7) { backupStatusEl.textContent = `${daysDiff} dias atrás ⚠️`; backupStatusEl.className = 'font-bold text-amber-500'; }
                        else { backupStatusEl.textContent = `${daysDiff} dias atrás`; backupStatusEl.className = 'font-bold text-slate-600'; }
                    }
                }

                const cs = document.getElementById('conn-status'); if(cs) { cs.textContent = navigator.onLine ? 'Online' : 'Offline'; cs.className = navigator.onLine ? 'font-bold text-green-600' : 'font-bold text-red-600'; }
                const sw = document.getElementById('sw-status'); if(sw) {
                     if ('serviceWorker' in navigator && navigator.serviceWorker.controller) { sw.textContent = 'Ativo'; sw.className = 'font-bold text-green-600'; }
                     else { sw.textContent = 'Inativo'; sw.className = 'font-bold text-amber-500'; }
                }
            }

            async function initNotificationSystem() {
                const licenseKey = localStorage.getItem('plena_license_key');
                if (!licenseKey) return; 
                try {
                    const response = await fetch(`${NOTIF_API_URL}?action=get_notifications`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ license_key: licenseKey })
                    });
                    if (!response.ok) return;
                    const data = await response.json();
                    processNotifications(data.notifications || []);
                } catch (error) { console.warn('SysNotif: Erro silencioso de conexão'); }
            }

            function processNotifications(serverList) {
                const readIds = JSON.parse(localStorage.getItem('plena_read_notifs') || '[]');
                const unreadList = serverList.filter(n => !readIds.includes(n.id));
                activeNotifications = unreadList;
                ['header-badge', 'sidebar-badge'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = unreadList.length > 0 ? 'flex' : 'none'; });
                renderNotificationList(unreadList);
            }

            function renderNotificationList(list) {
                const container = document.getElementById('notification-feed-container');

                if (!container) return;
                if (list.length === 0) { container.innerHTML = '<div class="flex flex-col items-center justify-center py-8 text-slate-400 opacity-60"><p class="text-sm font-medium">Tudo limpo por aqui!</p></div>'; return; }
                let html = '';
                list.forEach(n => {
                    html += `<div class="bg-white p-4 rounded-lg shadow-sm border border-slate-100 border-l-4 border-l-blue-500 mb-3 flex gap-4"><div class="flex-1"><h4 class="font-bold text-slate-800 text-sm">${n.title || 'Sistema'}</h4><p class="text-slate-600 text-xs mt-1">${n.message}</p></div></div>`;
                });
                container.innerHTML = html;
            }

            function clearSystemNotifications() {
                localStorage.setItem('plena_cleared_timestamp', new Date().getTime());
                const c = document.getElementById('notification-feed-container'); if(c) c.innerHTML = '';
                ['header-badge', 'sidebar-badge'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
            }

            function checkForUpdates() {
                const btn = document.querySelector('[onclick="checkForUpdates()"]');
                const originalText = btn.innerHTML;
                btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Buscando...`;
                if(window.lucide) lucide.createIcons();

                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(reg => {
                        reg.update().then(() => {
                            setTimeout(() => {
                                if (reg.installing || reg.waiting) {
                                    btn.innerHTML = `<i data-lucide="download" class="w-4 h-4"></i> Atualizar...`;
                                    if(confirm("Nova versão disponível. Atualizar agora?")) window.location.reload(); 
                                } else {
                                    btn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Sistema Atualizado`;
                                    const last = document.getElementById('last-update-check'); if(last) last.textContent = new Date().toLocaleTimeString();
                                    setTimeout(() => btn.innerHTML = originalText, 3000);
                                }
                            }, 1000);
                        });
                    });
                } else {
                    setTimeout(() => { btn.innerHTML = originalText; alert("Modo offline ou sem Service Worker."); }, 1000);
                }
            }
"""

def optimize_file(file_path):
    print(f"Otimizando: {file_path}")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Erro ao ler {file_path}: {e}")
        return

    # A. INJETAR CSS (Antes de </head>)
    if "/* --- PLENA HÍBRIDO PRO V1.0 --- */" not in content:
        content = content.replace("</head>", f"{HYBRID_CSS}\n</head>")

    # B. REFATORAR ESTRUTURA HTML (Sidebar & Main)
    # Procurar <aside id="sidebar" ... class="...">
    # Regex para encontrar a tag aside e injetar classes se não existirem
    # Simplificação: substituir a tag de abertura se ela tiver id="sidebar"
    
    # Adicionar classes essenciais na Sidebar se não estiverem lá
    if 'sidebar' in content:
         # Força a classe 'sidebar' e remove classes hardcoded antigas se necessário.
         # Mas para ser seguro, vamos preservar as classes e adicionar as nossas se o CSS exigir.
         # O CSS usa .sidebar, então garantimos que o aside tenha class="sidebar ..."
         pass 

    # C. SUBSTITUIR OU INJETAR MÓDULO SISTEMA
    # 1. Tentar substituir se já existir
    pattern_system = re.compile(r'<section[^>]*id=["\']view-system["\'][^>]*>.*?</section>', re.DOTALL)
    
    if pattern_system.search(content):
        content = pattern_system.sub(SYSTEM_HTML, content)
        print("Módulo Sistema atualizado (Replace).")
    else:
        # 2. Se não existir, injetar após a última section
        # Encontrar a última ocorrência de </section>
        last_section_index = content.rfind("</section>")
        
        if last_section_index != -1:
            # Inserir logo após o último </section>
            insertion_point = last_section_index + 10 # len("</section>")
            content = content[:insertion_point] + "\n" + SYSTEM_HTML + content[insertion_point:]
            print("Módulo Sistema injetado (Append após última section).")
        else:
            # Fallback: Tentar colocar antes de </main>
            if "</main>" in content:
                content = content.replace("</main>", f"{SYSTEM_HTML}\n</main>")
                print("Módulo Sistema injetado (Antes de </main>).")
            else:
                print(f"ERRO CRÍTICO: Não foi possível injetar o módulo sistema em {file_path}. Estrutura desconhecida.")

    # D. INJETAR JS
    if "// --- SISTEMA E TELEMETRIA V1.0 ---" not in content:
        # Tentar inserir antes do script de fechamento do body ou antes do body
        if "</body>" in content:
            content = content.replace("</body>", f"<script>\n{SYSTEM_JS}\n</script>\n</body>")
        else:
             content += f"\n<script>\n{SYSTEM_JS}\n</script>"

        
    # E. ATUALIZAR ROUTER (Simples replace para injetar comportamento mobile)
    # Procurar: function router(view) {
    # Injetar logica de fechar sidebar
    router_patch = """function router(view) {
                // Auto-close sidebar on mobile
                if (window.innerWidth < 1024) {
                    const sidebar = document.getElementById('sidebar');
                    const overlay = document.getElementById('overlay');
                    if(sidebar) sidebar.classList.remove('open');
                    if(overlay) overlay.classList.add('hidden');
                    document.body.style.overflow = '';
                }
    """
    if "function router(view) {" in content and "Auto-close sidebar" not in content:
        content = content.replace("function router(view) {", router_patch)

    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Salvo com sucesso.")
    except Exception as e:
        print(f"Erro ao salvar {file_path}: {e}")

def main():
    if not os.path.exists(TARGET_DIR):
        print(f"Diretório não encontrado: {TARGET_DIR}")
        return

    count = 0
    for root, dirs, files in os.walk(TARGET_DIR):
        for file in files:
            if file == "index.html":
                # Verificar exclusões (nome da pasta pai)
                parent_folder = os.path.basename(root)
                if parent_folder in EXCLUSIONS:
                    print(f"Pulando {parent_folder} (Exclusão)")
                    continue
                
                full_path = os.path.join(root, file)
                optimize_file(full_path)
                count += 1
    
    print(f"Concluído. {count} arquivos otimizados.")

if __name__ == "__main__":
    main()
