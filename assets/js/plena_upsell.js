/**
 * Plena Upsell Component
 * Proactively promotes "Plus" versions within "Essential" apps.
 */

const PlenaUpsell = {
    init(config) {
        const { appName, plusLink, plusName, dashboardPreview } = config;

        // Wait for DOM to be ready
        window.addEventListener('load', () => {
            this.render(config);
        });
    },

    render(config) {
        const sidebar = document.querySelector('nav');
        if (!sidebar) return;

        const upsellHtml = `
            <div class="mt-8 mx-2 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 shadow-inner group">
                <div class="flex items-center gap-2 mb-2">
                    <span class="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white animate-pulse">
                        <i class="fa-solid fa-crown"></i>
                    </span>
                    <span class="text-[10px] font-black text-amber-500 uppercase tracking-widest">Upgrade Disponível</span>
                </div>
                <h5 class="text-xs font-bold text-white mb-1">Mude para o ${config.plusName}</h5>
                <p class="text-[10px] text-slate-400 mb-3 leading-tight">Tenha Dashboards, Relatórios Avançados e Gestão Completa.</p>
                
                <a href="${config.plusLink}" class="block w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 text-[10px] font-black text-center transition transform group-hover:scale-105 shadow-lg shadow-amber-900/20">
                    CONHECER VERSÃO PLUS
                </a>
                
                <button onclick="PlenaUpsell.showPreview('${config.dashboardPreview}')" class="w-full mt-2 py-1 text-[9px] text-amber-500/70 hover:text-amber-500 transition font-medium">
                    <i class="fa-solid fa-chart-pie mr-1"></i> Ver Dashboard
                </button>
            </div>
        `;

        const div = document.createElement('div');
        div.innerHTML = upsellHtml;
        sidebar.appendChild(div);

        // Inject Modal Preview structure if not exists
        if (!document.getElementById('plena-upsell-modal')) {
            const modal = document.createElement('div');
            modal.id = 'plena-upsell-modal';
            modal.className = 'fixed inset-0 z-[100] hidden flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm';
            modal.innerHTML = `
                <div class="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl transform transition-all">
                    <div class="p-4 border-b flex justify-between items-center bg-slate-50">
                        <h3 class="font-bold text-slate-900 flex items-center gap-2">
                            <i class="fa-solid fa-gauge-high text-amber-500"></i>
                            Preview do Dashboard Plus
                        </h3>
                        <button onclick="PlenaUpsell.hidePreview()" class="text-slate-400 hover:text-slate-600">
                            <i class="fa-solid fa-xmark text-xl"></i>
                        </button>
                    </div>
                    <div class="p-2 bg-slate-100">
                        <img id="upsell-preview-img" src="" class="w-full rounded-xl shadow-inner border border-slate-200">
                    </div>
                    <div class="p-6 text-center">
                        <p class="text-slate-600 text-sm mb-4">Esta é apenas uma prévia das dezenas de gráficos e relatórios disponíveis na versão Plus.</p>
                        <a href="${config.plusLink}" class="inline-block bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-xl">
                            Quero o Sistema Completo
                        </a>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    },

    showPreview(imgUrl) {
        const modal = document.getElementById('plena-upsell-modal');
        const img = document.getElementById('upsell-preview-img');
        img.src = imgUrl;
        modal.classList.remove('hidden');
    },

    hidePreview() {
        const modal = document.getElementById('plena-upsell-modal');
        modal.classList.add('hidden');
    }
};

window.PlenaUpsell = PlenaUpsell;
