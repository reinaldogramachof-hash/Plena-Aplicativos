/**
 * PLENA LOCK - GATEKEEPER V2 (Com Modo Demo Seguro)
 * - Bloqueia o acesso sem licença.
 * - Permite modo demonstração (sem salvar dados) via parâmetro URL.
 */

(function () {
    // CONFIGURAÇÃO
    const API_URL = '../api_licenca.php?action=validate_access';
    const STORAGE_KEY = 'plena_license_key';
    const DEVICE_ID_KEY = 'plena_device_fingerprint';

    // Utilitários de URL
    const urlParams = new URLSearchParams(window.location.search);
    const isDemoMode = urlParams.get('mode') === 'demo';

    // 1. Gera Fingerprint Simples
    function getDeviceFingerprint() {
        let id = localStorage.getItem(DEVICE_ID_KEY);
        if (!id) {
            id = 'DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase() +
                '-' + Date.now().toString(36).toUpperCase();
            localStorage.setItem(DEVICE_ID_KEY, id);
        }
        return id;
    }

    // 2. Valida com o Backend
    async function validateLicense(key) {
        try {
            const deviceId = getDeviceFingerprint();
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ license_key: key, device_fingerprint: deviceId })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(error);
            return { valid: false, message: "Erro de conexão com servidor de licença." };
        }
    }

    // 3. UI de Bloqueio (Lock Screen)
    function showLockScreen(message = '') {
        if (document.getElementById('plena-lock-screen')) return;

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
                    Este aplicativo é exclusivo para licenciados.
                </p>
                
                ${message ? `<div style="background: #ef444420; color: #f87171; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.85rem; margin-bottom: 1rem;">${message}</div>` : ''}

                <input type="text" id="license-input" placeholder="Cole sua chave (PLENA-XXXX-XXXX)" 
                    style="width: 100%; padding: 0.75rem; background: #0f172a; border: 1px solid #475569; color: white; border-radius: 0.5rem; margin-bottom: 1rem; outline: none; font-family: monospace; text-align: center; text-transform: uppercase;">
                
                <button id="btn-validate" style="width: 100%; background: #2563eb; color: white; padding: 0.75rem; border: none; border-radius: 0.5rem; font-weight: bold; cursor: pointer; transition: background 0.2s;">
                    Liberar Acesso
                </button>
            </div>
        `;

        document.body.appendChild(div);

        const btn = div.querySelector('#btn-validate');
        const input = div.querySelector('#license-input');

        btn.onclick = async () => {
            const key = input.value.trim().toUpperCase();
            if (key.length < 5) return;
            btn.innerText = "Verificando...";
            btn.disabled = true;

            const result = await validateLicense(key);

            if (result.valid) {
                localStorage.setItem(STORAGE_KEY, key);
                document.body.removeChild(div);
                window.location.reload();
            } else {
                document.body.removeChild(div);
                showLockScreen(result.message);
            }
        };
    }

    // 4. MODO DEMO (Sandbox)
    // Se ?mode=demo estiver na URL, NÃO bloqueia, mas mostra aviso e INIBE salvamento.
    function enableDemoMode() {
        console.warn("PLENA LOCK: Modo Demonstração Ativado.");

        // Banner de Aviso
        const bar = document.createElement('div');
        bar.innerHTML = '⚠️ MODO DEMONSTRAÇÃO - DADOS NÃO SERÃO SALVOS';
        bar.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; background: #f59e0b; color: #000;
            font-weight: bold; text-align: center; padding: 5px; font-size: 12px; z-index: 999999;
            pointer-events: none;
        `;
        document.body.appendChild(bar);

        // Neutraliza LocalStorage para não sujar o navegador do cliente nem dar falsa esperança
        try {
            const noop = () => console.log("Demo Mode: Save Blocked");
            Storage.prototype.setItem = noop;
            // Opcional: Limpar dados anteriores para garantir experiência limpa
            // localStorage.clear(); 
        } catch (e) { }
    }

    // 5. Inicialização
    async function init() {
        // Se for DEMO, libera com restrições
        if (isDemoMode) {
            enableDemoMode();
            return;
        }

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
