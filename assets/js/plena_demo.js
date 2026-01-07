/**
 * Plena Sorveteria - Core Application Logic
 * Copyright 2025 Plena Soluções Digitais
 */

// ==========================================
// STATE & CONFIG
// ==========================================
const AppState = {
    cart: [],
    products: [
        { id: 1, name: 'Sorvete Chocolate', category: 'sorvete', price: 12.00, stock: 'high' },
        { id: 2, name: 'Sorvete Morango', category: 'sorvete', price: 12.00, stock: 'medium' },
        { id: 3, name: 'Açaí Tradicional', category: 'acai', price: 15.00, stock: 'high' },
        { id: 4, name: 'Casquinha Crocante', category: 'casquinha', price: 2.00, stock: 'low' }
    ],
    production: [],
    user: 'Admin'
};

// ==========================================
// CORE FUNCTIONS
// ==========================================

function init() {
    console.log('🍦 Plena Sorveteria Initializing...');

    // Initialize Icons
    if (window.lucide) window.lucide.createIcons();

    // Update Date/Timers
    updateDateTime();
    setInterval(updateDateTime, 60000);

    // Initial Route
    router('dashboard');

    // Setup mocks
    setupDashboardCharts();
    loadRecentSales();
}

function router(viewName) {
    // Hide all views
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.add('hide');
        el.classList.remove('fade-in');
    });

    // Show target view
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
        target.classList.remove('hide');
        // Trigger reflow for animation
        void target.offsetWidth;
        target.classList.add('fade-in');
    } else {
        console.warn(`View not found: ${viewName}`);
    }

    // Update Sidebar Styling
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active-nav', 'bg-white/10', 'text-white');
        el.classList.add('text-gray-300');
    });

    const activeNav = document.getElementById(`nav-${viewName}`);
    if (activeNav) {
        activeNav.classList.add('active-nav', 'bg-white/10', 'text-white');
        activeNav.classList.remove('text-gray-300');
    }

    // Update Title
    const titles = {
        'dashboard': 'Dashboard',
        'cashier': 'Frente de Caixa',
        'production': 'Produção',
        'inventory': 'Estoque',
        'products': 'Catálogo',
        'sales': 'Vendas',
        'temperature': 'Temperatura'
    };
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.innerText = titles[viewName] || 'Plena Sorveteria';

    // Mobile Sidebar Handling
    if (window.innerWidth < 1024) {
        toggleSidebar(false);
    }
}

function toggleSidebar(forceState) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if (!sidebar) return;

    const shouldOpen = forceState !== undefined ? forceState : !sidebar.classList.contains('open');

    if (shouldOpen) {
        sidebar.classList.add('open');
        if (overlay) overlay.classList.remove('hidden');
    } else {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.add('hidden');
    }
}

function updateDateTime() {
    const now = new Date();
    const dateEl = document.getElementById('current-date');
    const timeEl = document.getElementById('current-time');

    if (dateEl) dateEl.innerText = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    if (timeEl) timeEl.innerText = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function showNotification(message, type = 'info') {
    // Simple alert for now, can be upgraded to toast
    console.log(`[${type.toUpperCase()}] ${message}`);
    // alert(message); // Uncomment if blocking alert desired, otherwise implement toast
}


// ==========================================
// DASHBOARD LOGIC
// ==========================================

// ==========================================
// MOCK DATA GENERATORS
// ==========================================
const MockData = {
    production: [
        { id: 'PR001', product: 'Sorvete Chocolate', type: 'sorvete', qtd: '50L', status: 'pronto', date: 'Hoje, 08:00' },
        { id: 'PR002', product: 'Açaí Tradicional', type: 'acai', qtd: '100L', status: 'produzindo', date: 'Hoje, 10:30' },
        { id: 'PR003', product: 'Picolé Morango', type: 'picole', qtd: '200un', status: 'pendente', date: 'Amanhã' },
    ],
    inventory: [
        { id: 'ING001', name: 'Leite Integral', cat: 'leite', stock: 150, min: 50, unit: 'L', valid: '20/02' },
        { id: 'ING002', name: 'Açúcar Cristal', cat: 'acucar', stock: 30, min: 40, unit: 'kg', valid: '30/06' }, // Low
        { id: 'ING003', name: 'Polpa Açaí', cat: 'fruta', stock: 200, min: 100, unit: 'kg', valid: '15/03' },
        { id: 'ING004', name: 'Essência Baunilha', cat: 'sabor', stock: 2, min: 5, unit: 'L', valid: '01/05' }, // Low
    ],
    products: [
        { id: 1, name: 'Sorvete Chocolate', price: 12.00, cat: 'sorvete', image: '🍫' },
        { id: 2, name: 'Sorvete Morango', price: 12.00, cat: 'sorvete', image: '🍓' },
        { id: 3, name: 'Açaí 300ml', price: 15.00, cat: 'acai', image: '🍧' },
        { id: 4, name: 'Açaí 500ml', price: 20.00, cat: 'acai', image: '🍧' },
        { id: 5, name: 'Casquinha', price: 2.00, cat: 'casquinha', image: '🧇' },
        { id: 6, name: 'Cobertura Extra', price: 3.00, cat: 'cobertura', image: '🍯' },
    ]
};

function setupDashboardCharts() {
    // Mock Chart
    const chartContainer = document.getElementById('flavor-sales-chart');
    if (!chartContainer) return;

    const data = [
        { label: 'Choc', value: 80, color: 'bg-amber-900' },
        { label: 'Mor', value: 65, color: 'bg-red-500' },
        { label: 'Creme', value: 45, color: 'bg-yellow-200' },
        { label: 'Açaí', value: 95, color: 'bg-purple-900' },
        { label: 'Menta', value: 30, color: 'bg-green-400' },
        { label: 'Ninho', value: 70, color: 'bg-yellow-100' },
        { label: 'Uva', value: 25, color: 'bg-purple-500' }
    ];

    chartContainer.innerHTML = data.map(item => `
        <div class="bar-group flex-1 flex flex-col justify-end h-full group relative">
            <div class="bar-wrapper w-full flex justify-center items-end">
                <div class="bar w-3/4 rounded-t-md transition-all duration-500 hover:opacity-90 ${item.color}" 
                     style="height: ${item.value}%" 
                     data-value="${item.value}">
                     <div class="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap transition-opacity">
                        ${item.value} un
                     </div>
                </div>
            </div>
            <div class="x-label text-[10px] text-center mt-2 font-medium text-gray-500 truncate w-full">${item.label}</div>
        </div>
    `).join('');
}

function loadRecentSales() {
    const list = document.getElementById('recent-sales-list');
    if (!list) return;

    list.innerHTML = `
        <div class="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
            <div class="flex items-center">
                <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3 text-green-600">
                    <i data-lucide="shopping-cart" class="w-5 h-5"></i>
                </div>
                <div>
                    <p class="font-bold text-gray-800 text-sm">Venda #1042</p>
                    <p class="text-xs text-gray-500">Há 2 min • Açaí 500ml</p>
                </div>
            </div>
            <span class="font-bold text-green-600 text-sm">+ R$ 20,00</span>
        </div>
        <div class="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
             <div class="flex items-center">
                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 text-blue-600">
                    <i data-lucide="credit-card" class="w-5 h-5"></i>
                </div>
                <div>
                    <p class="font-bold text-gray-800 text-sm">Venda #1041</p>
                    <p class="text-xs text-gray-500">Há 12 min • Sorvete 2 Bolas</p>
                </div>
            </div>
            <span class="font-bold text-green-600 text-sm">+ R$ 12,00</span>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();
}

function renderProduction() {
    const tbody = document.getElementById('production-table-body');
    if (!tbody) return;

    tbody.innerHTML = MockData.production.map(item => `
        <tr class="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
            <td class="px-6 py-4 font-medium text-gray-900">${item.id}</td>
            <td class="px-6 py-4">${item.product}</td>
            <td class="px-6 py-4 capitalize"><span class="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">${item.type}</span></td>
            <td class="px-6 py-4">${item.qtd}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded-full text-xs font-bold ${item.status === 'produzindo' ? 'bg-blue-100 text-blue-800' :
            item.status === 'pronto' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }">
                    ${item.status.toUpperCase()}
                </span>
            </td>
            <td class="px-6 py-4 text-gray-500">${item.date}</td>
            <td class="px-6 py-4 text-center">
                <button class="text-gray-400 hover:text-plena-blue transition-colors"><i data-lucide="more-vertical" class="w-4 h-4"></i></button>
            </td>
        </tr>
    `).join('');

    // Also update summary
    document.getElementById('production-today-summary').textContent = "150 L";
    document.getElementById('production-in-progress').textContent = "1";
    if (window.lucide) window.lucide.createIcons();
}

function renderInventory() {
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;

    tbody.innerHTML = MockData.inventory.map(item => `
        <tr class="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
            <td class="px-6 py-4 font-medium text-gray-900">${item.id}</td>
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <div class="w-8 h-8 rounded bg-gray-100 flex items-center justify-center mr-3 text-xs">📦</div>
                    ${item.name}
                </div>
            </td>
            <td class="px-6 py-4 capitalize text-gray-500">${item.cat}</td>
            <td class="px-6 py-4 font-bold ${item.stock <= item.min ? 'text-red-600' : 'text-green-600'}">
                ${item.stock} ${item.unit}
            </td>
            <td class="px-6 py-4 text-gray-400 text-xs">${item.min} ${item.unit}</td>
            <td class="px-6 py-4 text-gray-500">${item.unit}</td>
            <td class="px-6 py-4 text-xs font-medium bg-red-50 text-red-600 rounded-lg text-center w-fit px-2 inline-block">${item.valid}</td>
            <td class="px-6 py-4 text-center">
                <button class="text-blue-600 hover:underline text-xs font-bold">Editar</button>
            </td>
        </tr>
    `).join('');

    // Update Counts
    document.getElementById('low-stock').textContent = MockData.inventory.filter(i => i.stock <= i.min).length;
}

function initCashierAndCatalog() {
    const cashierGrid = document.getElementById('products-grid');
    const catalogGrid = document.getElementById('products-catalog');

    const cardTemplate = (p) => `
        <div onclick="addCustomIceCream()" class="product-card bg-white p-3 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-plena-blue group">
            <div class="text-3xl mb-2 text-center group-hover:scale-110 transition-transform">${p.image}</div>
            <h4 class="font-bold text-gray-800 text-sm text-center mb-1">${p.name}</h4>
            <p class="text-plena-purple font-bold text-center text-sm">R$ ${p.price.toFixed(2)}</p>
        </div>
    `;

    if (cashierGrid) {
        cashierGrid.innerHTML = MockData.products.map(cardTemplate).join('');
    }

    if (catalogGrid) {
        catalogGrid.innerHTML = MockData.products.map(p => `
            <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                <div class="h-32 bg-gray-50 rounded-xl mb-4 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
                    ${p.image}
                </div>
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <span class="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full mb-2 inline-block">${p.cat}</span>
                        <h3 class="font-bold text-gray-800 text-lg leading-tight">${p.name}</h3>
                    </div>
                </div>
                <div class="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                    <span class="text-xl font-bold text-plena-purple">R$ ${p.price.toFixed(2)}</span>
                    <button class="w-8 h-8 rounded-full bg-gray-100 hover:bg-plena-purple hover:text-white flex items-center justify-center transition-colors">
                        <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
}

// Update init to call these
const originalInit = window.init;
window.init = function () {
    console.log('🍦 Plena Sorveteria Initializing (Enhanced)...');
    if (window.lucide) window.lucide.createIcons();
    updateDateTime();
    setInterval(updateDateTime, 60000);
    router('dashboard'); // This triggers sidebar updates
    setupDashboardCharts();
    loadRecentSales();
    renderProduction();
    renderInventory();
    initCashierAndCatalog();
};


// ==========================================
// TEMPERATURE CONTROL LOGIC
// ==========================================
function exportTemperatureLog() {
    alert("Log de temperatura exportado.");
}

function addFreezerModal() {
    const name = prompt("Nome do novo freezer:");
    if (name) showNotification(`Freezer ${name} adicionado ao monitoramento.`);
}

// ==========================================
// TUTORIAL LOGIC
// ==========================================
function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function markSectionComplete(id) {
    showNotification("Seção marcada como concluída!");
}

// ==========================================
// EXPORTS
// ==========================================
// Expose functions to global scope for HTML onclick access
window.init = init;
window.router = router;
window.toggleSidebar = toggleSidebar;
window.clearSale = clearSale;
window.printReceipt = printReceipt;
window.openQuickSaleModal = openQuickSaleModal;
window.filterProductsByCategory = filterProductsByCategory;
window.filterProducts = filterProducts;
window.addCustomIceCream = addCustomIceCream;
window.applyDiscount = applyDiscount;
window.setPaymentMethod = setPaymentMethod;
window.completeSale = completeSale;
window.exportProductionCSV = exportProductionCSV;
window.openProductionModal = openProductionModal;
window.renderProduction = renderProduction;
window.clearProductionFilters = clearProductionFilters;
window.exportInventoryCSV = exportInventoryCSV;
window.openStockEntryModal = openStockEntryModal;
window.showInventoryTab = showInventoryTab;
window.clearInventoryFilters = clearInventoryFilters;
window.openStockTakeModal = openStockTakeModal;
window.openProductModal = openProductModal;
window.filterProductCatalog = filterProductCatalog;
window.exportTemperatureLog = exportTemperatureLog;
window.addFreezerModal = addFreezerModal;
window.scrollToSection = scrollToSection;
window.markSectionComplete = markSectionComplete;
