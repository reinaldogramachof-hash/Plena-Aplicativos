(function () {
    console.log("🔍 INICIANDO DIAGNÓSTICO PWA - PLENA ALUGUÉIS");

    // Criar elemento visual para logs na tela (já que não vemos o console do usuário)
    const debugBox = document.createElement('div');
    debugBox.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 300px; overflow-y: scroll; background: rgba(0,0,0,0.8); color: #0f0; font-family: monospace; z-index: 99999; padding: 10px; font-size: 12px; pointer-events: none;";
    debugBox.id = "pwa-debug-box";
    document.body.appendChild(debugBox);

    function log(msg, type = 'info') {
        const color = type === 'error' ? 'red' : (type === 'success' ? '#0f0' : '#fff');
        console.log(`[PWA Debug] ${msg}`);
        const line = document.createElement('div');
        line.style.color = color;
        line.innerText = `> ${msg}`;
        debugBox.appendChild(line);
        debugBox.scrollTop = debugBox.scrollHeight;
    }

    log("Versão do Diagnóstico: 1.0");
    log(`URL Atual: ${window.location.href}`);

    // 1. Verificar Suporte a SW
    if ('serviceWorker' in navigator) {
        log("✅ Navegador suporta Service Workers", 'success');
    } else {
        log("❌ Navegador NÃO suporta Service Workers", 'error');
    }

    // 2. Tentar Fetch no Manifest
    fetch('./manifest.json')
        .then(response => {
            if (response.ok) {
                log("✅ manifest.json encontrado (HTTP 200)", 'success');
                return response.json();
            } else {
                log(`❌ Erro ao baixar manifest.json: ${response.status}`, 'error');
            }
        })
        .then(json => {
            if (json) {
                log("📄 Conteúdo do Manifest lido com sucesso");
                log(`   start_url: ${json.start_url}`);
                if (json.icons && json.icons.length > 0) {
                    log(`   Ícones definidos: ${json.icons.length}`);
                    // Tentar carregar o primeiro ícone
                    const iconSrc = json.icons[0].src;
                    const iconImg = new Image();
                    iconImg.onload = () => log(`   ✅ Ícone carregável: ${iconSrc}`, 'success');
                    iconImg.onerror = () => log(`   ❌ Erro ao carregar imagem do ícone: ${iconSrc}`, 'error');
                    iconImg.src = iconSrc;
                } else {
                    log("   ⚠️ Sem ícones definidos", 'error');
                }
            }
        })
        .catch(err => log(`❌ Exceção ao ler manifest: ${err.message}`, 'error'));

    // 3. Monitorar Instalação
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        log("🚀 Evento 'beforeinstallprompt' DISPARADO! O app é instalável.", 'success');
        log("O navegador detectou que este site é uma PWA válida.", 'success');
    });

    window.addEventListener('appinstalled', () => {
        log("🎉 App instalado com sucesso!", 'success');
    });

    // 4. Verificar Registro SW Existente
    navigator.serviceWorker.getRegistrations().then(registrations => {
        if (registrations.length > 0) {
            log(`ℹ️ ${registrations.length} Service Worker(s) já registrado(s).`);
            registrations.forEach(reg => {
                log(`   Escopo: ${reg.scope} | Status: ${reg.active ? 'Ativo' : 'Instalando'}`);
            });
        } else {
            log("⚠️ Nenhum Service Worker ativo encontrado antes do registro.", 'error');
        }
    });

})();
