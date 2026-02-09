class PDVManager {
    constructor() {
        this.cart = [];
        this.currentTab = 'vendas';
        this.currentCategory = 'all'; // New: Filter state
    }

    init() {
        if (!DB.data.register) {
            DB.data.register = { status: 'closed', sessions: [] };
        }
    }

    render() {
        this.init();
        this.updateRegisterUI();

        if (this.currentTab === 'vendas') {
            this.renderProducts();
        } else {
            this.renderHistory();
        }

        this.renderCart();
        lucide.createIcons();
    }

    switchTab(tab) {
        this.currentTab = tab;
        _('tab-pdv-vendas').className = (tab === 'vendas') ?
            'pb-2 text-sm font-bold text-cyan-400 border-b-2 border-cyan-400 transition-all' :
            'pb-2 text-sm font-bold text-slate-500 hover:text-white transition-all';
        _('tab-pdv-historico').className = (tab === 'historico') ?
            'pb-2 text-sm font-bold text-cyan-400 border-b-2 border-cyan-400 transition-all' :
            'pb-2 text-sm font-bold text-slate-500 hover:text-white transition-all';

        _('pdv-panel-vendas').classList.toggle('hidden', tab !== 'vendas');
        _('pdv-panel-historico').classList.toggle('hidden', tab !== 'historico');

        this.render();
    }

    // New: Category Filter
    setCategory(cat) {
        this.currentCategory = cat;
        // Update UI buttons (assuming they exist, will add to HTML later)
        document.querySelectorAll('.pdv-cat-btn').forEach(btn => {
            if (btn.dataset.cat === cat) {
                btn.classList.add('bg-cyan-600', 'text-white');
                btn.classList.remove('bg-slate-800', 'text-slate-400');
            } else {
                btn.classList.remove('bg-cyan-600', 'text-white');
                btn.classList.add('bg-slate-800', 'text-slate-400');
            }
        });
        this.renderProducts();
    }

    updateRegisterUI() {
        const reg = DB.data.register;
        const statusEl = _('pdv-register-status');
        const btnOpen = _('btn-pdv-open');
        const btnClose = _('btn-pdv-close');

        if (reg.status === 'open') {
            statusEl.className = 'flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-500/10 text-green-400 border border-green-500/20';
            statusEl.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Caixa Aberto';
            if (btnOpen) btnOpen.classList.add('hidden');
            if (btnClose) btnClose.classList.remove('hidden');
        } else {
            statusEl.className = 'flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/20';
            statusEl.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> Caixa Fechado';
            if (btnOpen) btnOpen.classList.remove('hidden');
            if (btnClose) btnClose.classList.add('hidden');
        }
    }

    renderProducts() {
        // Filter Logic: Exclude Prinetrs (usually asset, not POS item) unless specified
        let products = DB.data.inventory.filter(i => i.category !== 'impressora');

        if (this.currentCategory !== 'all') {
            products = products.filter(i => i.category === this.currentCategory);
        }

        const search = _('pdv-search')?.value.toLowerCase() || '';
        const grid = _('pdv-products-grid');
        if (!grid) return;

        const filtered = products.filter(p => p.name.toLowerCase().includes(search) || p.brand?.toLowerCase().includes(search));

        let html = '';

        // Add "Custom Item" card always at start
        html += `
        <div class="glass-panel p-3 rounded-lg border border-dashed border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 cursor-pointer transition-all group flex flex-col justify-center items-center min-h-[100px]" onclick="App.pdvManager.addCustomItem()">
            <div class="bg-cyan-500/20 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform"><i data-lucide="plus" class="w-5 h-5 text-cyan-400"></i></div>
            <h4 class="font-bold text-cyan-400 text-sm">Item Avulso</h4>
            <p class="text-[10px] text-slate-500">Valor livre</p>
        </div>`;

        if (filtered.length === 0) {
            html += '<div class="col-span-full text-center py-8"><p class="text-slate-500 text-sm italic">Nenhum produto encontrado.</p></div>';
        } else {
            html += filtered.map(p => {
                const price = p.price || (p.cost * 1.5) || 0;
                const qty = p.quantity || p.remaining || 0;
                const unit = p.unit || 'un';
                // Stock Alert
                const lowStock = qty <= (p.minStock || 2);
                const stockColor = lowStock ? 'text-red-400' : 'text-slate-500';

                return `
                <div class="glass-panel p-3 rounded-lg border border-white/5 hover:border-cyan-500/30 cursor-pointer transition-all group relative" onclick="App.pdvManager.addToCart('${p.id}')">
                    <div class="flex justify-between items-start mb-1">
                        <h4 class="font-bold text-white text-sm truncate pr-2 leading-tight">${p.name}</h4>
                        <span class="text-xs font-mono text-cyan-400 font-bold bg-slate-950 px-1.5 py-0.5 rounded">${fmtMoney(price)}</span>
                    </div>
                    <div class="flex justify-between items-end">
                        <div>
                            <p class="text-[10px] text-slate-500 truncate">${p.brand || 'Sem marca'}</p>
                            <p class="text-[10px] font-mono ${stockColor} mt-1"><i data-lucide="box" class="w-3 h-3 inline mr-0.5"></i>${qty}${unit}</p>
                        </div>
                        <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                             <span class="text-[10px] bg-cyan-600 px-2 py-1 rounded text-white font-bold">+ Add</span>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }

        grid.innerHTML = html;
        lucide.createIcons();
    }

    // New: Add Custom Item Logic
    addCustomItem() {
        if (DB.data.register.status !== 'open') return alert('Abra o caixa antes de realizar vendas!');
        const val = prompt('Valor do item (R$):');
        if (!val) return;
        const price = parseFloat(val.replace(',', '.'));
        if (isNaN(price) || price <= 0) return alert('Valor inválido!');

        const desc = prompt('Descrição do item (opcional):') || 'Item Avulso';

        this.cart.push({
            id: 'custom_' + Date.now(),
            name: desc,
            price: price,
            qty: 1,
            isCustom: true // Flag to identify non-inventory items
        });
        this.renderCart();
    }

    renderCart() {
        const container = _('pdv-cart-list');
        const totalEl = _('pdv-total');
        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-slate-600 py-8 italic opacity-50"><i data-lucide="shopping-basket" class="w-12 h-12 mb-2"></i>Carrinho Vazio</div>';
            if (totalEl) totalEl.innerText = fmtMoney(0);
            lucide.createIcons();
            return;
        }

        let total = 0;
        container.innerHTML = this.cart.map((item, index) => {
            const subtotal = item.price * item.qty;
            total += subtotal;
            return `
            <div class="flex justify-between items-center p-2 border-b border-white/5 bg-slate-800/30 mb-1 rounded hover:bg-slate-800/50 transition-colors">
                <div class="flex-1 min-w-0 pr-2">
                    <p class="text-white text-sm font-bold truncate">${item.name}</p>
                    <p class="text-[10px] text-slate-400">${fmtMoney(item.price)} un</p>
                </div>
                <div class="flex items-center gap-1.5 bg-slate-900 rounded-lg p-0.5">
                    <button onclick="App.pdvManager.updateQty(${index}, -1)" class="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white transition-colors">-</button>
                    <span class="text-xs font-bold font-mono w-4 text-center text-white">${item.qty}</span>
                    <button onclick="App.pdvManager.updateQty(${index}, 1)" class="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white transition-colors">+</button>
                </div>
                <div class="text-right w-20 ml-2">
                    <p class="text-cyan-400 font-mono text-xs font-bold">${fmtMoney(subtotal)}</p>
                    <button onclick="App.pdvManager.removeFromCart(${index})" class="text-[8px] uppercase font-bold text-red-500/60 hover:text-red-400 transition-colors">Excluir</button>
                </div>
            </div>`;
        }).join('');

        if (totalEl) totalEl.innerText = fmtMoney(total);
        lucide.createIcons();
    }

    addToCart(id) {
        if (DB.data.register.status !== 'open') return alert('Abra o caixa antes de realizar vendas!');
        const product = DB.data.inventory.find(p => p.id === id);
        if (!product) return;

        // Check Stock
        const currentQty = product.quantity || product.remaining || 0;
        const inCart = this.cart.find(i => i.id === id);
        const cartQty = inCart ? inCart.qty : 0;

        if (currentQty - cartQty <= 0) {
            if (!confirm(`Estoque insuficiente (${currentQty} un). Deseja vender mesmo assim (Estoque ficará negativo)?`)) return;
        }

        const price = product.price || (product.cost * 1.5) || 0;

        if (inCart) {
            inCart.qty++;
        } else {
            this.cart.push({ id: product.id, name: product.name, price: price, qty: 1, isCustom: false });
        }
        this.renderCart();
    }

    updateQty(index, change) {
        const item = this.cart[index];
        if (!item) return;
        item.qty += change;
        if (item.qty <= 0) this.removeFromCart(index);
        else this.renderCart();
    }

    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.renderCart();
    }

    checkout() {
        if (DB.data.register.status !== 'open') return alert('Caixa fechado!');
        if (this.cart.length === 0) return alert('Carrinho vazio!');
        if (!confirm('Finalizar venda?')) return;

        const total = this.cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const method = _('pdv-payment-method').value;
        const date = new Date().toISOString();
        const sessionId = DB.data.register.currentSessionId;

        // 1. Register Transaction
        // Save items snapshot in description or metadata if needed. For now simple desc.
        const desc = `Venda PDV (${this.cart.length} itens)`;
        // Store items in a separate field if we want to reverse inventory later properly? 
        // For simple reverse, we can store item IDs in desc or extended logic. 
        // Let's attach items to the transaction object for intelligent reverse.

        const transactionId = uid();
        const transItems = this.cart.map(i => ({ id: i.id, qty: i.qty, isCustom: i.isCustom || false }));

        if (!DB.data.transactions) DB.data.transactions = [];
        DB.data.transactions.unshift({
            id: transactionId,
            type: 'income',
            category: 'PDV', // Distinct from 'Venda' (Projects)
            amount: total,
            desc: desc, // Simple text
            date: date,
            method: method,
            refId: sessionId,
            items: transItems // NEW: Persist items for reversal
        });

        // 2. Deduct Inventory
        this.cart.forEach(item => {
            if (!item.isCustom) {
                const product = DB.data.inventory.find(p => p.id === item.id);
                if (product) {
                    product.quantity -= item.qty;
                    if (product.weight) product.remaining = product.quantity;
                    App.inventoryManager.addLog(item.id, 'saida', item.qty, 'Venda PDV #' + transactionId.substr(0, 4));
                }
            }
        });

        DB.save();
        this.cart = [];
        this.render();
        alert('Venda realizada com sucesso!');
        App.dashboardManager.render();
    }

    // REGISTER MANAGEMENT (Open/Close Logic remains mostly same, keeping it concise)
    openOpenRegisterModal() { _('openRegisterModal').classList.remove('hidden'); }

    submitOpenRegister(e) {
        e.preventDefault();
        const val = parseFloat(_('reg-initial-value').value) || 0;
        const sessionId = uid();

        DB.data.register.status = 'open';
        DB.data.register.currentSessionId = sessionId;
        DB.data.register.sessions.unshift({
            id: sessionId,
            openedAt: new Date().toISOString(),
            closedAt: null,
            initialValue: val,
            finalValue: 0,
            salesPerMethod: {}
        });

        DB.save();
        closeModal('openRegisterModal');
        this.render();
        alert('Caixa aberto com sucesso!');
    }

    openCloseRegisterModal() {
        const reg = DB.data.register;
        const session = reg.sessions.find(s => s.id === reg.currentSessionId);
        if (!session) return;
        // Logic same as before, simplified for brevity in this replace block
        const transactions = (DB.data.transactions || []).filter(t => t.refId === session.id);
        const totals = transactions.reduce((acc, t) => {
            acc[t.method] = (acc[t.method] || 0) + t.amount;
            acc.total += t.amount;
            return acc;
        }, { total: 0 });

        _('close-register-summary').innerHTML = `
            <div class="space-y-3">
                <div class="flex justify-between text-sm"><span class="text-slate-500">Fundo inicial:</span><span class="text-white font-mono">${fmtMoney(session.initialValue)}</span></div>
                <div class="border-t border-white/5 pt-2">
                    <p class="text-xs font-bold text-slate-500 uppercase mb-2">Resumo de Vendas</p>
                    ${Object.entries(totals).filter(([k]) => k !== 'total').map(([method, val]) => `
                        <div class="flex justify-between text-sm mb-1"><span class="text-slate-400">${method}:</span><span class="text-white font-mono">${fmtMoney(val)}</span></div>
                    `).join('')}
                </div>
                <div class="bg-slate-950 p-3 rounded-lg flex justify-between items-center mt-4">
                    <span class="text-sm text-slate-500 uppercase font-bold">Saldo Final Caixa:</span>
                    <span class="text-xl font-bold text-white font-mono">${fmtMoney(session.initialValue + (totals.Dinheiro || 0))}</span>
                </div>
            </div>
        `;
        _('closeRegisterModal').classList.remove('hidden');
    }

    confirmCloseRegister() {
        if (!confirm('Deseja encerrar este caixa?')) return;
        const reg = DB.data.register;
        const session = reg.sessions.find(s => s.id === reg.currentSessionId);
        if (session) session.closedAt = new Date().toISOString();
        reg.status = 'closed';
        reg.currentSessionId = null;
        DB.save();
        closeModal('closeRegisterModal');
        this.render();
        alert('Caixa encerrado!');
    }

    renderHistory() {
        const historyTable = _('pdv-session-history');
        if (!historyTable) return;

        const reg = DB.data.register;
        const sessionId = reg.currentSessionId;
        if (!sessionId) {
            historyTable.innerHTML = '<tr><td colspan="4" class="py-8 text-center text-slate-500 italic">Abra o caixa para ver o histórico.</td></tr>';
            return;
        }

        const transactions = (DB.data.transactions || []).filter(t => t.refId === sessionId);

        if (transactions.length === 0) {
            historyTable.innerHTML = '<tr><td colspan="4" class="py-8 text-center text-slate-500 italic">Nenhuma venda nesta sessão.</td></tr>';
            return;
        }

        historyTable.innerHTML = transactions.map(t => `
            <tr class="hover:bg-white/5 transition-colors">
                <td class="px-4 py-3 text-xs text-slate-400 font-mono">${new Date(t.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                <td class="px-4 py-3">
                    <div class="text-sm text-white font-bold">${t.desc}</div>
                    <div class="text-[10px] text-slate-500 uppercase">${t.method}</div>
                </td>
                <td class="px-4 py-3 text-right font-mono text-cyan-400 font-bold">${fmtMoney(t.amount)}</td>
                <td class="px-4 py-3 text-right">
                    <button onclick="App.pdvManager.reverseTransaction('${t.id}')" class="text-red-500 hover:text-red-400 p-1 transition-colors" title="Estornar"><i data-lucide="rotate-ccw" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `).join('');
        lucide.createIcons();
    }

    // New: Intelligent Reversal
    reverseTransaction(id) {
        if (!confirm('Deseja estornar esta venda?')) return;

        const idx = DB.data.transactions.findIndex(t => t.id === id);
        if (idx >= 0) {
            const t = DB.data.transactions[idx];

            // Logic to return stock
            if (t.items && t.items.length > 0) {
                if (confirm('Deseja devolver os itens ao estoque automaticamente?')) {
                    t.items.forEach(item => {
                        if (!item.isCustom) {
                            const prod = DB.data.inventory.find(p => p.id === item.id);
                            if (prod) {
                                prod.quantity += item.qty;
                                if (prod.weight) prod.remaining = prod.quantity;
                                App.inventoryManager.addLog(item.id, 'entrada', item.qty, 'Estorno de Venda');
                            }
                        }
                    });
                    alert('Itens devolvidos ao estoque.');
                }
            }

            DB.data.transactions.splice(idx, 1);
            DB.save();
            this.render();
            App.dashboardManager.render();
        }
    }
}
