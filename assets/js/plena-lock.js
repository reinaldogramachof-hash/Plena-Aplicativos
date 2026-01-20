/**
 * PLENA LOCK - GATEKEEPER V3 (Versão Final Produção)
 * - Busca automática Inteligente da API (Resolve erros 404/403)
 * - Compatível com HostGator e subpastas (apps.plus, apps, etc)
 */

(function () {
    // ==========================================================
    // CONFIGURAÇÃO
    // ==========================================================
    const STORAGE_KEY = 'plena_license_key';
    const DEVICE_ID_KEY = 'plena_device_fingerprint';

    // Lista de locais onde a API pode estar (relativo ao arquivo HTML que chamou o script)
    const CANDIDATE_PATHS = [
        '../api_licenca.php',       // Nível acima (comum para apps/app.html)
        '../../api_licenca.php',    // 2 Níveis acima
        '/api_licenca.php',         // Raiz absoluta (Padrão servidores)
        'api_licenca.php',          // Mesma pasta
        '../../../api_licenca.php'  // 3 Níveis (caso de apps aninhados)
    ];

    let ACTIVE_API_URL = null; // Será preenchido automaticamente

    // Utilitários de URL
    const urlParams = new URLSearchParams(window.location.search);
    const isDemoMode = urlParams.get('mode') === 'demo';

    // ==========================================================
    // 1. LÓGICA DE BUSCA DA API (A Correção Principal)
    // ==========================================================
    async function findApiUrl() {
        // Se já achou, retorna rápido
        if (ACTIVE_API_URL) return ACTIVE_API_URL;

        console.log('[PlenaLock] Buscando servidor de licença...');

        for (const path of CANDIDATE_PATHS) {
            try {
                // Tenta conectar com um parâmetro de tempo para evitar cache
                const testUrl = `${path}?action=system_health&t=${Date.now()}`;
                const response = await fetch(testUrl, { method: 'GET' });

                // Se o servidor responder 200 (OK) ou 403 (Proibido - arquivo existe) ou 401 (Unauthorized), achamos!
                if (response.ok || response.status === 403 || response.status === 401) {
                    console.log(`[PlenaLock] Servidor encontrado em: ${path}`);
                    ACTIVE_API_URL = path; // Salva o caminho vencedor
                    return path;
                }
            } catch (e) {
                // Continua procurando...
            }
        }

        // Fallback final: tenta usar a raiz se nada funcionar
        console.warn('[PlenaLock] Aviso: API não detectada automaticamente. Tentando raiz.');
        return '/api_licenca.php';
    }

    // ==========================================================
    // 2. SISTEMA DE FINGERPRINT E VALIDAÇÃO
    // ==========================================================
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
            const apiUrl = await findApiUrl(); // Usa a URL encontrada
            const endpoint = `${apiUrl}?action=validate_access`;
            const deviceId = getDeviceFingerprint();

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ license_key: key, device_fingerprint: deviceId })
            });

            if (!response.ok) {
                // Se der erro 404 aqui, é porque o caminho estava errado mesmo após a busca
                if (response.status === 404) return { valid: false, message: "Erro: API não encontrada (404)" };
                return { valid: false, message: "Erro no servidor de licença" };
            }

            return await response.json();
        } catch (error) {
            console.error(error);
            return { valid: false, message: "Erro de conexão. Verifique sua internet." };
        }
    }

    // ==========================================================
    // 3. UI DE BLOQUEIO (TELA DE LOGIN)
    // ==========================================================
    function showLockScreen(message = '') {
        if (document.getElementById('plena-lock-screen')) {
            // Se já existe, só atualiza a mensagem se houver erro novo
            if (message) {
                const msgBox = document.querySelector('#plena-lock-msg');
                if (msgBox) msgBox.innerHTML = message;
            }
            return;
        }

        const div = document.createElement('div');
        div.id = 'plena-lock-screen';
        div.style.cssText = `
            position: fixed; inset: 0; background: #0f172a; z-index: 99999;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            color: white; font-family: sans-serif;
        `;

        div.innerHTML = `
            <div style="background: #1e293b; padding: 2rem; border-radius: 1rem; border: 1px solid #334155; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
                <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; color: #fff;">Ativação Necessária</h2>
                <p style="color: #94a3b8; margin-bottom: 1.5rem; font-size: 0.9rem;">
                    Este aplicativo é exclusivo para licenciados Plena.
                </p>
                
                <div id="plena-lock-msg" style="background: #ef444420; color: #f87171; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.85rem; margin-bottom: 1rem; ${message ? '' : 'display:none'}">
                    ${message}
                </div>

                <input type="text" id="license-input" placeholder="Cole sua chave (PLENA-XXXX-XXXX)" 
                    style="width: 100%; padding: 0.75rem; background: #0f172a; border: 1px solid #475569; color: white; border-radius: 0.5rem; margin-bottom: 1rem; outline: none; font-family: monospace; text-align: center; text-transform: uppercase;">
                
                <button id="btn-validate" style="width: 100%; background: #2563eb; color: white; padding: 0.75rem; border: none; border-radius: 0.5rem; font-weight: bold; cursor: pointer; transition: background 0.2s;">
                    Liberar Acesso
                </button>
                <div style="margin-top: 1rem; font-size: 0.8rem; color: #64748b;">v3.0 - HostGator Ready</div>
            </div>
        `;

        document.body.appendChild(div);

        const btn = div.querySelector('#btn-validate');
        const input = div.querySelector('#license-input');

        btn.onclick = async () => {
            const key = input.value.trim().toUpperCase();
            if (key.length < 5) return;

            const originalText = btn.innerText;
            btn.innerText = "Verificando...";
            btn.disabled = true;

            const result = await validateLicense(key);

            if (result.valid) {
                localStorage.setItem(STORAGE_KEY, key);
                location.reload();
            } else {
                const msgBox = document.querySelector('#plena-lock-msg');
                msgBox.style.display = 'block';
                msgBox.innerText = result.message || "Chave inválida";
                btn.innerText = originalText;
                btn.disabled = false;
            }
        };
    }

    // ==========================================================
    // 4. MODO DEMO E INICIALIZAÇÃO
    // ==========================================================
    function enableDemoMode() {
        const bar = document.createElement('div');
        bar.innerHTML = '⚠️ MODO DEMONSTRAÇÃO - DADOS NÃO SERÃO SALVOS';
        bar.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; background: #f59e0b; color: #000; font-weight: bold; text-align: center; padding: 5px; font-size: 12px; z-index: 999999; pointer-events: none;`;
        document.body.appendChild(bar);
        try { Storage.prototype.setItem = () => { }; } catch (e) { }
    }

    async function init() {
        if (isDemoMode) {
            enableDemoMode();
            return;
        }

        // Tenta achar a API em background logo de cara
        findApiUrl();

        const savedKey = localStorage.getItem(STORAGE_KEY);
        if (!savedKey) {
            showLockScreen();
        } else {
            const result = await validateLicense(savedKey);
            if (!result.valid) {
                showLockScreen(result.message);
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
