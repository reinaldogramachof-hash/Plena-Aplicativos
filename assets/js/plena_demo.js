/**
 * Plena Demo Mode Script
 * Handles read-only mode, security alerts, and disables data mutation for demo purposes.
 */

const PlenaDemo = {
    init: function () {
        console.log('Plena Demo Mode Initialized');
        this.injectStyles();
        this.blockMutations();
        this.showDemoBanner();
        this.disableSaveButtons();
        this.interceptNavigation();
    },

    injectStyles: function () {
        const style = document.createElement('style');
        style.textContent = `
            .demo-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                background: linear-gradient(90deg, #1e293b, #0f172a);
                color: white;
                text-align: center;
                padding: 12px;
                font-size: 14px;
                font-weight: 600;
                z-index: 9999;
                box-shadow: 0 -4px 15px rgba(0,0,0,0.2);
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 15px;
                border-top: 2px solid #3b82f6;
            }
            .demo-banner span {
                opacity: 0.9;
            }
            .demo-badge {
                background: #F59E0B;
                color: #000;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .btn-disabled-demo {
                opacity: 0.5 !important;
                cursor: not-allowed !important;
                pointer-events: none !important;
                filter: grayscale(1) !important;
            }
        `;
        document.head.appendChild(style);
    },

    blockMutations: function () {
        // Backup original methods
        const originalSetItem = localStorage.setItem;
        const originalRemoveItem = localStorage.removeItem;

        // Override to block changes except for internal flags
        localStorage.setItem = function (key, value) {
            if (key.includes('demo_') || key.includes('config_')) {
                originalSetItem.apply(this, arguments);
            } else {
                console.warn(`[DEMO MODE] Blocked write to localStorage: ${key}`);
                PlenaDemo.toast('Ação bloqueada no Modo Demo');
            }
        };

        localStorage.removeItem = function (key) {
            if (key.includes('demo_')) {
                originalRemoveItem.apply(this, arguments);
            } else {
                console.warn(`[DEMO MODE] Blocked remove from localStorage: ${key}`);
                PlenaDemo.toast('Ação bloqueada no Modo Demo');
            }
        };
    },

    disableSaveButtons: function () {
        // Disable generic save/edit/delete buttons based on common text or classes
        // Use MutationObserver for dynamic content
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(() => this.applyDisabling());
        });

        observer.observe(document.body, { childList: true, subtree: true });
        this.applyDisabling();
    },

    applyDisabling: function () {
        const keywords = ['salvar', 'save', 'gravar', 'excluir', 'delete', 'remover', 'editar'];
        // Classes to target
        const selectors = [
            'button[onclick*="save"]',
            'button[onclick*="delete"]',
            'button[onclick*="remove"]',
            '.btn-save',
            '.save-btn'
        ];

        // Disable by selector
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(btn => btn.classList.add('btn-disabled-demo'));
        });

        // Heuristic: check button text content
        document.querySelectorAll('button').forEach(btn => {
            const text = btn.innerText.toLowerCase();
            if (keywords.some(k => text.includes(k)) && !text.includes('pdf') && !text.includes('imprimir') && !text.includes('print')) {
                // Allow printing/PDF generation, block data mutation
                // Check if it's strictly navigation? Hard to tell, but usually "Save" is mutation.
                // We add a listener to catch clicks just in case css pointer-events fails or is overridden
                if (!btn.hasAttribute('data-demo-blocked')) {
                    btn.setAttribute('data-demo-blocked', 'true');
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.toast('Esta função está desabilitada na demonstração.');
                    }, true);
                    btn.classList.add('btn-disabled-demo');
                }
            }
        });
    },

    showDemoBanner: function () {
        const banner = document.createElement('div');
        banner.className = 'demo-banner fade-in';
        banner.innerHTML = `
            <span class="demo-badge">Demo</span>
            <span>Você está visualizando uma versão de demonstração. Os dados não serão salvos.</span>
            <a href="https://wa.me/5567993333999" target="_blank" style="margin-left:auto; background:#22c55e; color:white; padding:6px 16px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:12px; display:flex; align-items:center; gap:6px;">
                <i class="fa-brands fa-whatsapp"></i> Contratar Versão Completa
            </a>
        `;
        document.body.appendChild(banner);

        // Add padding to body to prevent banner overlap
        document.body.style.paddingBottom = '60px';
    },

    interceptNavigation: function () {
        // Prevent navigation away (optional, maybe not needed for this scope, let's keep it simple)
    },

    toast: function (msg) {
        const toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: #ef4444; color: white; padding: 10px 20px; border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10000; font-weight: bold;
            font-size: 14px; animation: fadeIn 0.3s;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};

// Auto-init if not manually disabled
if (!window.PLENA_DEMO_DISABLED) {
    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => PlenaDemo.init());
    } else {
        PlenaDemo.init();
    }
}
