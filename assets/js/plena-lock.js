/**
 * PLENA LOCK - GATEKEEPER V4 (Scoped Edition)
 * - Busca automática da API
 * - Fingerprint de Dispositivo
 * - Escopo de Licença por Aplicativo (Fim do compartilhamento global)
 * - API Pública window.PlenaLock
 */

(function () {
    // ==========================================================
    // 1. UTILITÁRIOS EESCOPO
    // ==========================================================

    // Identifica o App ID baseado na URL
    // Ex: /apps.plus/plena_pdv/index.html -> plena_pdv
    // Ex: /apps/food/comanda/index.html -> comanda (ou food_comanda?)
    // Vamos usar a pasta pai do index.html como ID.
    function getAppId() {
        const path = window.location.pathname;
        const parts = path.split('/').filter(p => p.length > 0);

        // Remove index.html ou parâmetros
        if (parts.length > 0 && parts[parts.length - 1].includes('.')) {
            parts.pop();
        }

        if (parts.length === 0) return 'root_app';

        // Pega o nome da pasta
        const appName = parts[parts.length - 1];

        // Se estiver em apps.plus, usa o nome direto
        // Se estiver em apps/categoria/nome, usa o nome
        return appName.toLowerCase();
    }

    const APP_ID = getAppId();
    const STORAGE_KEY = `plena_license_key_${APP_ID}`; // Chave única por app
    const DEVICE_ID_KEY = 'plena_device_fingerprint'; // Device ID ainda pode ser global

    // Lista de locais onde a API pode estar
    const CANDIDATE_PATHS = [
        '../api_licenca.php',
        '../../api_licenca.php',
        '/api_licenca.php',
        'api_licenca.php',
        '../../../api_licenca.php'
    ];

    let ACTIVE_API_URL = null;
    let CURRENT_LICENSE_INFO = null; // Cache do status

    const urlParams = new URLSearchParams(window.location.search);
    const isDemoMode = urlParams.get('mode') === 'demo';

    // ==========================================================
    // 2. LÓGICA CORE
    // ==========================================================

    async function findApiUrl() {
        if (ACTIVE_API_URL) return ACTIVE_API_URL;
        console.log(`[PlenaLock] App: ${APP_ID} | Buscando API...`);

        for (const path of CANDIDATE_PATHS) {
            try {
                const testUrl = `${path}?action=system_health&t=${Date.now()}`;
                const response = await fetch(testUrl, { method: 'GET' });
                if (response.ok || response.status === 403 || response.status === 401) {
                    ACTIVE_API_URL = path;
                    return path;
                }
            } catch (e) { }
        }
        return '/api_licenca.php';
    }

    function getDeviceFingerprint() {
        let id = localStorage.getItem(DEVICE_ID_KEY);
        if (!id) {
            id = 'DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase() +
                '-' + Date.now().toString(36).toUpperCase();
            localStorage.setItem(DEVICE_ID_KEY, id);
        }
        return id;
    }

    async function validateLicense(key) {
        try {
            const apiUrl = await findApiUrl();
            const endpoint = `${apiUrl}?action=validate_access`;
            const deviceId = getDeviceFingerprint();

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    license_key: key,
                    device_fingerprint: deviceId,
                    app_id: APP_ID // Scoping Field
                })
            });

            if (!response.ok) {
                if (response.status === 404) return { valid: false, message: "Erro: API não encontrada" };
                const errJson = await response.json().catch(() => ({}));
                return { valid: false, message: errJson.message || "Erro no servidor" };
            }

            return await response.json();
        } catch (error) {
            console.error(error);
            return { valid: false, message: "Erro de conexão." };
        }
    }

    // ==========================================================
    // 3. UI
    // ==========================================================

    function showLockScreen(message = "Insira sua Licença") {
        if (document.getElementById('plena-lock-screen')) return;

        const div = document.createElement('div');
        div.id = 'plena-lock-screen';
        // (Estilos mantidos da V3, inalterados para estabilidade)
        div.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:#0f172a;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-family:sans-serif;`;

        div.innerHTML = `
            <div style="background:#1e293b;padding:2rem;border-radius:1rem;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);max-width:400px;width:90%;text-align:center;">
                <h2 style="margin-bottom:0.5rem;color:#3b82f6;">🔐 Bloqueio de Segurança</h2>
                <p style="color:#94a3b8;margin-bottom:1.5rem;font-size:0.9rem;">Este aplicativo (<b>${APP_ID}</b>) requer ativação.</p>
                
                <input type="text" id="plena-lic-input" placeholder="Cole sua chave aqui..." 
                    style="width:100%;padding:0.75rem;border-radius:0.5rem;border:1px solid #334155;background:#0f172a;color:white;margin-bottom:1rem;text-align:center;font-family:monospace;text-transform:uppercase;">
                
                <button id="plena-lic-btn" style="width:100%;background:#3b82f6;color:white;border:none;padding:0.75rem;border-radius:0.5rem;font-weight:bold;cursor:pointer;transition:all 0.2s;">
                    ATIVAR ACESSO
                </button>
                
                <p id="plena-lic-msg" style="margin-top:1rem;color:#ef4444;font-size:0.8rem;min-height:1.2em;">${message !== "Insira sua Licença" ? message : ''}</p>
                 <p style="margin-top:2rem;color:#64748b;font-size:0.7rem;">ID do Dispositivo: <br><span style="font-family:monospace">${getDeviceFingerprint()}</span></p>
            </div>
        `;

        document.body.appendChild(div);

        const btn = document.getElementById('plena-lic-btn');
        const input = document.getElementById('plena-lic-input');
        const msg = document.getElementById('plena-lic-msg');

        async function attemptUnlock() {
            const key = input.value.trim();
            if (!key) return;

            btn.innerText = "Verificando...";
            btn.disabled = true;
            msg.innerText = "";

            const result = await validateLicense(key);

            if (result.valid) {
                localStorage.setItem(STORAGE_KEY, key);
                // Opcional: Salvar meta dados
                localStorage.setItem('plena_product_name', result.product_name || APP_ID);
                msg.style.color = '#22c55e';
                msg.innerText = "Sucesso! Carregando...";
                setTimeout(() => location.reload(), 1000);
            } else {
                msg.style.color = '#ef4444';
                msg.innerText = result.message || "Chave inválida";
                btn.innerText = "ATIVAR ACESSO";
                btn.disabled = false;
            }
        }

        btn.onclick = attemptUnlock;
        input.oninput = (e) => input.value = input.value.toUpperCase(); // Force uppercase
    }

    function enableDemoMode() {
        const ribbon = document.createElement('div');
        ribbon.style.cssText = `position:fixed;top:0;right:0;background:#f59e0b;color:black;padding:5px 20px;font-size:10px;font-weight:bold;z-index:99998;box-shadow:0 2px 5px rgba(0,0,0,0.2);`;
        ribbon.innerText = "MODO DEMONSTRAÇÃO";
        document.body.appendChild(ribbon);
    }

    // ==========================================================
    // 4. API PÚBLICA (window.PlenaLock)
    // ==========================================================
    window.PlenaLock = {
        getAppId: () => APP_ID,
        getDeviceId: () => getDeviceFingerprint(),
        getLicenseKey: () => localStorage.getItem(STORAGE_KEY),
        resetLicense: () => {
            if (confirm(`Tem certeza que deseja desconectar o ${APP_ID}?`)) {
                localStorage.removeItem(STORAGE_KEY);
                location.reload();
            }
        },
        getLicenseInfo: () => CURRENT_LICENSE_INFO
    };

    // ==========================================================
    // 5. INICIALIZAÇÃO
    // ==========================================================
    async function init() {
        if (isDemoMode) {
            enableDemoMode();
            return;
        }

        // Tenta achar URL
        await findApiUrl();

        const savedKey = localStorage.getItem(STORAGE_KEY);

        if (!savedKey) {
            showLockScreen();
            CURRENT_LICENSE_INFO = { status: 'missing', valid: false };
        } else {
            // Valida em background para nao travar o carregamento visual se a net tiver lenta?
            // Nao, segurança primeiro. Se tiver chave, valida.
            // Porem, podemos mostrar um loading se demorar?
            // V3 pattern: Valida e bloqueia se falhar.

            const result = await validateLicense(savedKey);
            if (!result.valid) {
                showLockScreen(result.message);
                CURRENT_LICENSE_INFO = { status: 'invalid', valid: false, message: result.message };
            } else {
                // Sucesso silencioso
                CURRENT_LICENSE_INFO = { status: 'active', valid: true, key: savedKey, deviceId: getDeviceFingerprint() };
                console.log(`[PlenaLock] ${APP_ID} desbloqueado.`);
            }
        }
    }

    // Auto-run se nao estiver sendo importado como modulo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
