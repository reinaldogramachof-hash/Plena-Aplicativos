
(function() {
    // Evita duplicação
    if (document.getElementById('plena-toolbar-container')) return;

    const currentUrl = window.location.href;
    const isPwa = window.matchMedia('(display-mode: standalone)').matches;

    // --- STYLES ---
    const style = document.createElement('style');
    style.innerHTML = `
        #plena-toolbar-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: 'Segoe UI', system-ui, sans-serif;
            display: flex;
            flex-direction: column-reverse; /* Menu opens up */
            align-items: end;
            gap: 10px;
        }

        .plena-fab {
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #0d6efd, #0a58ca);
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(13, 110, 253, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            border: none;
            outline: none;
            -webkit-tap-highlight-color: transparent;
        }

        .plena-fab:active {
            transform: scale(0.95);
        }

        .plena-fab img {
            width: 32px;
            height: 32px;
            filter: brightness(0) invert(1); /* Pinta de branco se for PNG colorido */
        }
        
        .plena-fab i {
            color: white;
            font-size: 24px;
        }

        /* MENU ITEMS */
        .plena-menu {
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: end;
            opacity: 0;
            pointer-events: none;
            transform: translateY(20px);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .plena-menu.active {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0);
        }

        .plena-item {
            display: flex;
            align-items: center;
            gap: 10px;
            background: white;
            padding: 10px 16px;
            border-radius: 50px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            text-decoration: none;
            color: #333;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
            white-space: nowrap;
        }

        .plena-item:hover {
            background: #f8f9fa;
        }

        .plena-item i {
            width: 20px;
            text-align: center;
            color: #0d6efd;
        }
        
        .plena-badge {
            font-size: 10px;
            background: #198754;
            color: white;
            padding: 2px 6px;
            border-radius: 10px;
            margin-left: 5px;
        }

        .hidden { display: none !important; }
    `;
    document.head.appendChild(style);

    // --- HTML ---
    const container = document.createElement('div');
    container.id = 'plena-toolbar-container';

    // Se tiver FontAwesome disponível, usa ícones, senão emoji fallback (simplificado)
    const hasFA = document.querySelector('link[href*="fontawesome"]');
    
    const icon = {
        plena: hasFA ? '<i class="fa-solid fa-shapes"></i>' : '💠',
        install: hasFA ? '<i class="fa-solid fa-download"></i>' : '📲',
        license: hasFA ? '<i class="fa-solid fa-key"></i>' : '🔑',
        support: hasFA ? '<i class="fa-brands fa-whatsapp"></i>' : '💬',
        logout: hasFA ? '<i class="fa-solid fa-right-from-bracket"></i>' : '🚪'
    };

    container.innerHTML = `
        <div class="plena-menu" id="plena-menu">
            <button class="plena-item hidden" id="plena-btn-install">
                ${icon.install} Instalar App
            </button>
            <div class="plena-item" id="plena-status">
                ${icon.license} Licença <span class="plena-badge" id="plena-badge">Verificando...</span>
            </div>
            <a href="https://wa.me/5511999999999?text=Preciso%20de%20ajuda%20no%20app" target="_blank" class="plena-item">
                ${icon.support} Suporte
            </a>
            <button class="plena-item" id="plena-btn-logout">
                ${icon.logout} Sair
            </button>
        </div>
        <button class="plena-fab" id="plena-fab-trigger">
            ${icon.plena}
        </button>
    `;

    document.body.appendChild(container);

    // --- LOGIC ---
    let deferredPrompt;
    const fab = document.getElementById('plena-fab-trigger');
    const menu = document.getElementById('plena-menu');
    const installBtn = document.getElementById('plena-btn-install');
    const statusBadge = document.getElementById('plena-badge');
    const logoutBtn = document.getElementById('plena-btn-logout');

    // Toggle Menu
    fab.addEventListener('click', () => {
        menu.classList.toggle('active');
        const iconEl = fab.querySelector('i');
        if(menu.classList.contains('active')){
            // Optional: Rotate icon or change to X
        }
    });

    // Install PWA Logic
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.classList.remove('hidden');
    });

    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installBtn.classList.add('hidden');
        }
        deferredPrompt = null;
    });

    // License Logic (Read from LocalStorage set by plena-lock.js)
    function checkLicense() {
        const active = localStorage.getItem('plena_license_active');
        if (active === 'true') {
            statusBadge.textContent = 'Ativa';
            statusBadge.style.background = '#198754'; // Green
        } else {
            statusBadge.textContent = 'Inativa';
            statusBadge.style.background = '#dc3545'; // Red
        }
    }
    
    // Initial check
    checkLicense();
    // Re-check periodically just in case
    setInterval(checkLicense, 5000);

    // Logout
    logoutBtn.addEventListener('click', () => {
        if(confirm('Tem certeza que deseja sair e limpar os dados deste dispositivo?')) {
            localStorage.clear();
            alert('Dados limpos. A página será recarregada.');
            window.location.reload();
        }
    });

})();
