class PlenaApp {
    constructor() {
        this.projectManager = new ProjectManager();
        this.financialManager = new FinancialManager();
        this.inventoryManager = new InventoryManager();
        this.clientManager = new ClientManager();
        this.dashboardManager = new DashboardManager();
        this.reportsManager = new ReportsManager();
        this.supportManager = new SupportManager();
        this.settingsManager = new SettingsManager();
        this.pdvManager = new PDVManager();

        this.init();
    }

    init() {
        DB.load();
        this.pdvManager.init(); // Initializegister state
        this.setupNavigation();
        this.startClock();
        this.renderView('dashboard');

        // Global Modal Closers
        window.onclick = (event) => {
            if (event.target.classList.contains('fixed')) {
                event.target.classList.add('hidden');
            }
        };
    }

    startClock() {
        const update = () => {
            const now = new Date();
            const timeEl = _('header-time');
            const dateEl = _('header-date');

            if (timeEl) timeEl.innerText = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            if (dateEl) dateEl.innerText = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
        };
        update();
        setInterval(update, 1000);
    }

    setupNavigation() {
        document.querySelectorAll('[onclick^="router"]').forEach(btn => {
            const view = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
            btn.onclick = (e) => {
                e.preventDefault();
                this.router(view);
            }
        });
    }

    router(view) {
        // Hide all views
        document.querySelectorAll('.view').forEach(el => el.classList.add('hide'));

        // Show target view
        const target = _('view-' + view);
        if (target) {
            target.classList.remove('hide');
            target.classList.add('fade-in');
        }

        // Active State logic (simplified)
        document.querySelectorAll('nav a').forEach(a => {
            const v = a.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (v === view) {
                a.classList.add('bg-slate-800', 'text-cyan-400', 'border-r-2', 'border-cyan-400');
                a.classList.remove('text-slate-400', 'hover:bg-white/5');
            } else {
                a.classList.remove('bg-slate-800', 'text-cyan-400', 'border-r-2', 'border-cyan-400');
                a.classList.add('text-slate-400', 'hover:bg-white/5');
            }
        });

        this.renderView(view);
    }

    renderView(view) {
        if (view === 'dashboard') this.dashboardManager.render();
        if (view === 'projects') this.projectManager.render('projects');
        if (view === 'budgets') this.projectManager.render('budgets');
        if (view === 'financial') this.financialManager.render();
        if (view === 'inventory') this.inventoryManager.render();
        if (view === 'clients') this.clientManager.render();
        if (view === 'reports') this.reportsManager.render();
        if (view === 'support') this.supportManager.render();
        if (view === 'pdv') this.pdvManager.render();

        // Ensure icons are rendered after any view change
        if (window.lucide) lucide.createIcons();
    }

    closeModal(id) {
        _(id).classList.add('hidden');
    }
}

const App = new PlenaApp();
window.App = App; // Expose globally for HTML event handlers
