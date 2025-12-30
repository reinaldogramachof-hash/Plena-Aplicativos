/**
 * Plena Downsell Component
 * Offers simpler alternatives or quick utilities within "Plus" apps.
 */

const PlenaDownsell = {
    init(config) {
        const { appName, simpleLink, simpleName, reason } = config;

        window.addEventListener('load', () => {
            this.render(config);
        });
    },

    render(config) {

        // Try to find a place in the footer
        let footer = document.querySelector('footer');

        // If no footer exists, try to find main and append a footer to it
        if (!footer) {
            const main = document.querySelector('main');
            if (main) {
                footer = document.createElement('footer');
                footer.className = 'bg-white mt-auto'; // Ensure it sits at bottom if flex-col
                main.appendChild(footer);
            }
        }

        if (!footer) return;

        const downsellHtml = `
            <div class="mt-12 py-8 border-t border-slate-200 text-center">
                <p class="text-xs text-slate-400 mb-4 px-4">${config.reason || 'Achando o sistema muito complexo? Conheça nossa versão simplificada.'}</p>
                <div class="flex justify-center gap-4">
                    <a href="${config.simpleLink}" class="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition group">
                        <i class="fa-solid fa-bolt text-yellow-500 group-hover:animate-bounce"></i>
                        Acessar ${config.simpleName} (Versão Essencial)
                    </a>
                </div>
            </div>
        `;

        const div = document.createElement('div');
        div.innerHTML = downsellHtml;
        footer.prepend(div);
    }
};

window.PlenaDownsell = PlenaDownsell;
