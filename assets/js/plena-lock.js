(function () {
    // CONFIGURAÇÃO
    const API_URL = 'api_licenca.php'; // Caminho para seu arquivo PHP
    const LOCK_HTML = `
        <div id="plena-lock-screen" style="position:fixed; top:0; left:0; width:100%; height:100%; background:#0f172a; z-index:99999; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; font-family:sans-serif;">
            <div style="text-align:center; max-width:400px; padding:20px;">
                <div style="font-size:50px; margin-bottom:20px;">🔒</div>
                <h2 style="font-size:24px; font-weight:bold; margin-bottom:10px;">Ativação Necessária</h2>
                <p style="color:#94a3b8; margin-bottom:30px;">Este software requer uma licença vitalícia válida para operar.</p>
                
                <input type="text" id="plena-key-input" placeholder="Cole sua Licença (PLENA-XXXX...)" 
                    style="width:100%; padding:15px; border-radius:8px; border:1px solid #334155; background:#1e293b; color:white; margin-bottom:15px; text-transform:uppercase; text-align:center; letter-spacing:2px;">
                
                <button id="plena-btn-activate" style="width:100%; padding:15px; border-radius:8px; border:none; background:#3b82f6; color:white; font-weight:bold; cursor:pointer; transition:0.2s;">ATIVAR AGORA</button>
                
                <p id="plena-msg" style="margin-top:20px; font-size:12px; height:20px;"></p>
                
                <div style="margin-top:40px; font-size:11px; color:#475569;">
                    ID do Dispositivo: <span id="device-id-display">...</span>
                </div>
            </div>
        </div>
    `;

    // 1. Gera Fingerprint Simples (Navegador + UserAgent + Random Storage Persistente)
    function getDeviceID() {
        let id = localStorage.getItem('plena_device_id');
        if (!id) {
            id = 'DEV-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            localStorage.setItem('plena_device_id', id);
        }
        return id;
    }

    // 2. Renderiza a tela de bloqueio
    function showLock() {
        if (!document.getElementById('plena-lock-screen')) {
            const div = document.createElement('div');
            div.innerHTML = LOCK_HTML;
            document.body.appendChild(div);

            // Logic
            document.getElementById('device-id-display').innerText = getDeviceID();

            document.getElementById('plena-btn-activate').onclick = async () => {
                const key = document.getElementById('plena-key-input').value.trim();
                if (!key) return;

                const btn = document.getElementById('plena-btn-activate');
                const msg = document.getElementById('plena-msg');

                btn.innerText = "Verificando...";
                btn.disabled = true;

                try {
                    const req = await fetch(`${API_URL}?action=validate`, {
                        method: 'POST',
                        body: JSON.stringify({
                            license_key: key,
                            device_fingerprint: getDeviceID()
                        })
                    });
                    const res = await req.json();

                    if (res.valid) {
                        localStorage.setItem('plena_license_key', key);
                        msg.style.color = '#4ade80';
                        msg.innerText = "Sucesso! Iniciando...";
                        setTimeout(() => {
                            document.getElementById('plena-lock-screen').remove();
                        }, 1000);
                    } else {
                        msg.style.color = '#f87171';
                        msg.innerText = res.message;
                        btn.innerText = "TENTAR NOVAMENTE";
                        btn.disabled = false;
                    }
                } catch (e) {
                    msg.innerText = "Erro de conexão. Tente novamente.";
                    btn.disabled = false;
                }
            };
        }
    }

    // 3. Inicialização (Auto-Run)
    async function init() {
        const savedKey = localStorage.getItem('plena_license_key');

        if (!savedKey) {
            showLock(); // Sem chave salva? Bloqueia direto.
        } else {
            // Tem chave salva? Valida silenciosamente no background
            // Se falhar (ex: chave banida), bloqueia de novo.
            try {
                const req = await fetch(`${API_URL}?action=validate`, {
                    method: 'POST',
                    body: JSON.stringify({
                        license_key: savedKey,
                        device_fingerprint: getDeviceID()
                    })
                });
                const res = await req.json();

                if (!res.valid) {
                    localStorage.removeItem('plena_license_key'); // Remove chave inválida
                    showLock(); // Bloqueia
                    setTimeout(() => alert("Sessão expirada: " + res.message), 500);
                }
                // Se válido, não faz nada (deixa o app rodar)
            } catch (e) {
                // Se estiver offline, decidimos se bloqueamos ou deixamos rodar (Cache)
                // Por segurança padrão: Deixa rodar se já tinha chave (Modo Offline Friendly)
                console.log("Modo Offline: Usando licença em cache.");
            }
        }
    }

    // Aguarda o DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
