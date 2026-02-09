class InventoryManager {
    render() {
        const currentTab = document.querySelector('.inv-tab-content:not(.hidden)')?.id.replace('view-inv-', '') || 'impressoras';
        this.renderPrinters();
        this.renderFilaments();
        this.renderResins();
        this.renderParts();
        this.renderTools();
        this.renderLogs();
        lucide.createIcons();
    }

    switchTab(tab) {
        ['impressoras', 'filamentos', 'resinas', 'pecas', 'ferramentas', 'historico'].forEach(t => {
            _(`tab-inv-${t}`).classList.remove('text-purple-400', 'border-b-2', 'border-purple-400');
            _(`tab-inv-${t}`).classList.add('text-slate-500');
            _(`view-inv-${t}`).classList.add('hidden');
        });
        _(`tab-inv-${tab}`).classList.add('text-purple-400', 'border-b-2', 'border-purple-400');
        _(`tab-inv-${tab}`).classList.remove('text-slate-500');
        _(`view-inv-${tab}`).classList.remove('hidden');
        if (tab === 'historico') this.renderLogs();
        lucide.createIcons();
    }

    renderPrinters() {
        const grid = _('printers-grid');
        const printers = DB.inventory.filter(i => i.category === 'impressora');
        if (printers.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center text-slate-500 py-12"><i data-lucide="printer" class="w-12 h-12 mx-auto mb-3 opacity-20"></i><p>Nenhuma impressora cadastrada.</p></div>';
            return;
        }
        grid.innerHTML = printers.map(p => {
            const statusColors = { 'operacional': 'bg-green-500/20 text-green-400 border-green-500/30', 'manutencao': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', 'inativa': 'bg-slate-700 text-slate-400 border-slate-600' };
            const statusColor = statusColors[p.specs?.status || 'operacional'];
            return `<div class="glass-panel p-5 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all">
                <div class="flex justify-between items-start mb-4">
                    <div><h3 class="font-bold text-white text-lg">${p.name}</h3><p class="text-xs text-slate-400">${p.brand}</p><p class="text-[10px] text-slate-500 font-mono">${p.specs?.model || ''}</p></div>
                    <span class="text-xs px-2 py-1 rounded border ${statusColor} font-bold uppercase">${p.specs?.status || 'Operacional'}</span>
                </div>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between"><span class="text-slate-500">Horas de Uso:</span><span class="text-white font-mono">${p.specs?.hoursUsed || 0}h</span></div>
                    <div class="flex justify-between"><span class="text-slate-500">Última Manutenção:</span><span class="text-white text-xs">${p.specs?.lastMaintenance ? new Date(p.specs.lastMaintenance).toLocaleDateString() : 'Nunca'}</span></div>
                </div>
                <div class="mt-4 pt-4 border-t border-white/5 flex gap-2">
                    <button onclick="App.inventoryManager.openMaintenanceModal('${p.id}')" class="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs py-2 rounded font-bold"><i data-lucide="wrench" class="w-3 h-3 inline mr-1"></i>Manutenção</button>
                    <button onclick="App.inventoryManager.editItem('${p.id}')" class="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 py-2 rounded"><i data-lucide="edit" class="w-3 h-3"></i></button>
                    <button onclick="App.inventoryManager.deleteItem('${p.id}')" class="bg-red-900/20 hover:bg-red-900/40 text-red-500 text-xs px-3 py-2 rounded border border-red-500/20"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
                </div>
            </div>`;
        }).join('');
    }

    renderFilaments() {
        const grid = _('filaments-grid');
        const filaments = DB.inventory.filter(i => i.category === 'filamento');
        // ... (Similar structure to index.html, calling App.inventoryManager.editItem/deleteItem)
        if (filaments.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center text-slate-500 py-12"><i data-lucide="spool" class="w-12 h-12 mx-auto mb-3 opacity-20"></i><p>Nenhum filamento cadastrado.</p></div>';
            return;
        }
        grid.innerHTML = filaments.map(f => {
            const percent = (f.quantity / (f.weight || f.quantity)) * 100;
            let barColor = 'bg-green-500';
            if (percent < 30) barColor = 'bg-red-500'; else if (percent < 60) barColor = 'bg-yellow-500';
            return `
            <div class="glass-panel p-5 rounded-xl border border-white/5 relative overflow-hidden hover:border-purple-500/30 transition-all">
                <div class="absolute top-0 left-0 w-1 h-full ${barColor}"></div>
                <div class="flex justify-between items-start mb-2 pl-3">
                    <div>
                        <span class="text-[10px] font-bold uppercase text-slate-500 tracking-wider">${f.specs?.type || 'PLA'}</span>
                        <h3 class="font-bold text-white text-lg">${f.specs?.color || f.name}</h3>
                        <p class="text-xs text-slate-400">${f.brand}</p>
                        ${f.quantity < (f.minStock || 200) ? '<span class="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-bold uppercase">Baixo Estoque</span>' : ''}
                    </div>
                    <div class="text-right">
                        <span class="block text-sm font-bold text-white">${(f.quantity / 1000).toFixed(1)}kg</span>
                        <span class="text-[10px] text-slate-500">~ ${(f.quantity / (f.weight || 1000)).toFixed(1)} rolos (${f.weight || 1000}g)</span>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-white/5 flex gap-2 ml-3" style="width: calc(100% - 12px)">
                    <button onclick="App.inventoryManager.editItem('${f.id}')" class="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs py-2 rounded font-bold"><i data-lucide="edit" class="w-3 h-3 inline mr-1"></i>Editar</button>
                    <button onclick="App.inventoryManager.deleteItem('${f.id}')" class="bg-red-900/20 hover:bg-red-900/40 text-red-500 text-xs px-3 py-2 rounded border border-red-500/20"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
                </div>
            </div>`;
        }).join('');
    }

    renderResins() {
        const grid = _('resins-grid');
        const resins = DB.inventory.filter(i => i.category === 'resina');
        if (resins.length === 0) { grid.innerHTML = '<p class="col-span-full text-center text-slate-500">Nenhuma resina.</p>'; return; }
        grid.innerHTML = resins.map(r => `
            <div class="glass-panel p-5 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all">
             <div class="flex justify-between items-start mb-2">
                 <div><h3 class="font-bold text-white text-lg">${r.name}</h3><p class="text-xs text-slate-400">${r.brand}</p></div>
                 <div class="text-right"><span class="block text-sm font-bold text-white">${r.quantity}${r.unit}</span></div>
             </div>
             <div class="mt-4 pt-4 border-t border-white/5 flex gap-2">
                 <button onclick="App.inventoryManager.editItem('${r.id}')" class="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded font-bold">Editar</button>
                 <button onclick="App.inventoryManager.deleteItem('${r.id}')" class="bg-red-900/20 text-red-500 text-xs px-3 rounded border border-red-500/20"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
             </div>
            </div>
         `).join('');
    }

    renderParts() {
        const grid = _('parts-grid');
        const parts = DB.inventory.filter(i => i.category === 'peca');
        if (parts.length === 0) { grid.innerHTML = '<p class="col-span-full text-center text-slate-500">Nenhuma peça.</p>'; return; }
        grid.innerHTML = parts.map(p => `
            <div class="glass-panel p-4 rounded-xl border border-white/5 flex justify-between items-center">
                <div><h3 class="font-bold text-white">${p.name}</h3><button onclick="App.inventoryManager.editItem('${p.id}')" class="text-xs text-cyan-400 mt-1">Editar</button> <button onclick="App.inventoryManager.deleteItem('${p.id}')" class="text-xs text-red-400 mt-1 ml-2">Excluir</button></div>
                <span class="block text-lg font-bold text-white">${p.quantity}</span>
            </div>`).join('');
    }

    renderTools() {
        const grid = _('tools-grid');
        const tools = DB.inventory.filter(i => i.category === 'ferramenta');
        if (tools.length === 0) { grid.innerHTML = '<p class="col-span-full text-center text-slate-500">Nenhuma ferramenta.</p>'; return; }
        grid.innerHTML = tools.map(t => `
            <div class="glass-panel p-4 rounded-xl border border-white/5 flex justify-between items-center">
                 <div><h3 class="font-bold text-white">${t.name}</h3><button onclick="App.inventoryManager.editItem('${t.id}')" class="text-xs text-cyan-400 mt-1">Editar</button> <button onclick="App.inventoryManager.deleteItem('${t.id}')" class="text-xs text-red-400 mt-1 ml-2">Excluir</button></div>
                 <span class="block text-lg font-bold text-white">${t.quantity}</span>
            </div>`).join('');
    }

    renderLogs() {
        const container = _('inventory-logs-table');
        const logs = (DB.data.inventoryLogs || []).slice(0, 50);
        if (logs.length === 0) { container.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-slate-500">Sem registros.</td></tr>'; return; }
        container.innerHTML = logs.map(l => {
            const item = DB.inventory.find(i => i.id === l.itemId);
            return `<tr class="hover:bg-white/5"><td class="px-6 py-4 text-xs text-slate-500">${new Date(l.date).toLocaleString('pt-BR')}</td><td class="px-6 py-4 font-bold text-white">${item ? item.name : 'Removido'}</td><td class="px-6 py-4 text-center">${l.type}</td><td class="px-6 py-4 text-right">${l.type === 'entrada' ? '+' : '-'}${l.quantity}</td><td class="px-6 py-4 text-xs text-slate-400">${l.desc}</td></tr>`;
        }).join('');
    }

    addLog(itemId, type, quantity, desc) {
        if (!DB.data.inventoryLogs) DB.data.inventoryLogs = [];
        DB.data.inventoryLogs.unshift({ id: uid(), itemId, date: new Date().toISOString(), type, quantity, desc });
        if (DB.data.inventoryLogs.length > 1000) DB.data.inventoryLogs.pop();
    }

    openModal(id = null) {
        _('inventoryModal').classList.remove('hidden');
        if (id) {
            const item = DB.inventory.find(i => i.id === id);
            if (item) {
                _('inv-modal-title').innerText = 'Editar Item';
                _('inv-id').value = item.id;
                _('inv-category').value = item.category;
                _('inv-name').value = item.name;
                _('inv-brand').value = item.brand;

                // FIX: If filament, show Spool Count (Total Grams / Weight per Spool)
                if (item.category === 'filamento' && item.weight) {
                    _('inv-quantity').value = item.quantity / item.weight;
                } else {
                    _('inv-quantity').value = item.quantity;
                }

                _('inv-minstock').value = item.minStock;
                _('inv-cost').value = item.cost;
                _('inv-price').value = item.price || '';
                this.updateFormFields();
                if (item.specs) {
                    Object.keys(item.specs).forEach(key => {
                        const field = _(`inv-spec-${key}`);
                        if (field) field.value = item.specs[key];
                    });
                }
            }
        } else {
            _('inv-modal-title').innerText = 'Adicionar Item';
            _('inv-id').value = '';
            _('inv-category').value = '';
            _('inv-name').value = '';
            _('inv-brand').value = '';
            _('inv-quantity').value = '';
            _('inv-minstock').value = '';
            _('inv-cost').value = '';
            _('inv-price').value = '';
            _('inv-dynamic-fields').innerHTML = '';
        }
    }

    updateFormFields() {
        // Logic to inject HTML for dynamic fields based on category
        const category = _('inv-category').value;
        const container = _('inv-dynamic-fields');
        if (!category || !container) { if (container) container.innerHTML = ''; return; }

        let fields = '';
        if (category === 'impressora') fields = `<div><label class="text-xs font-bold text-slate-500">Modelo</label><input type="text" id="inv-spec-model" class="w-full bg-slate-950 p-3 rounded text-white"><label class="text-xs font-bold text-slate-500">Status</label><select id="inv-spec-status" class="w-full bg-slate-950 p-3 rounded text-white"><option value="operacional">Operacional</option><option value="manutencao">Manutenção</option></select></div>`;
        else if (category === 'filamento') {
            // CHANGE: Label clarifies inputs
            fields = `<div><label class="text-xs font-bold text-slate-500">Tipo da Matéria</label><select id="inv-spec-type" class="w-full bg-slate-950 p-3 rounded text-white"><option value="PLA">PLA</option><option value="ABS">ABS</option><option value="PETG">PETG</option><option value="TPU">TPU</option></select><label class="text-xs font-bold text-slate-500 mt-2 block">Cor</label><input type="text" id="inv-spec-color" class="w-full bg-slate-950 p-3 rounded text-white"></div><div><label class="text-xs font-bold text-slate-500 mt-2 block">Peso por Carretel (g)</label><input type="number" id="inv-weight" value="1000" class="w-full bg-slate-950 p-3 rounded text-white"><p class="text-[10px] text-slate-500 mt-1">*A Quantidade acima será multiplicada por este peso.</p></div>`;
        }

        const unitField = `<div><label class="text-xs font-bold text-slate-500">Unidade de Medida</label><select id="inv-unit" class="w-full bg-slate-950 p-3 rounded text-white"><option value="un">Unidade (un)</option><option value="g">Gramas (g)</option><option value="kg">Quilos (kg)</option></select></div>`;
        container.innerHTML = unitField + fields;
        if (_('inv-unit')) _('inv-unit').value = (category === 'filamento') ? 'g' : 'un';
    }

    submit(e) {
        e.preventDefault();
        const id = _('inv-id').value;
        const category = _('inv-category').value;
        const name = _('inv-name').value;
        const newQty = parseFloat(_('inv-quantity').value) || 0;

        if (!category || !name) return;

        const specs = {};
        const container = _('inv-dynamic-fields');
        if (container) {
            container.querySelectorAll('[id^="inv-spec-"]').forEach(f => specs[f.id.replace('inv-spec-', '')] = f.value);
        }

        const item = {
            id: id || uid(),
            category, name, brand: _('inv-brand').value, unit: _('inv-unit')?.value || 'un',
            quantity: newQty, minStock: parseFloat(_('inv-minstock').value) || 0,
            cost: parseFloat(_('inv-cost').value) || 0,
            price: parseFloat(_('inv-price').value) || 0, // Explicit Sales Price
            specs
        };

        if (category === 'filamento') {
            const w = _('inv-weight');
            if (w) {
                const weightPerSpool = parseFloat(w.value) || 1000;
                item.weight = weightPerSpool;
                // CRITICAL FIX: User Inputs COUNT (e.g. 50 spools), we store GRAMS (50 * 1000 = 50000g)
                item.quantity = newQty * weightPerSpool;
                item.remaining = item.quantity;
            }
        }

        const index = DB.inventory.findIndex(i => i.id === item.id);
        if (index >= 0) {
            const diff = newQty - DB.inventory[index].quantity;
            if (diff !== 0) this.addLog(item.id, diff > 0 ? 'entrada' : 'saida', Math.abs(diff), 'Ajuste manual');
            DB.data.inventory[index] = item;
        } else {
            DB.data.inventory.push(item);
            this.addLog(item.id, 'entrada', newQty, 'Cadastro inicial');
        }

        DB.save();
        App.closeModal('inventoryModal');
        this.render();
    }

    deleteItem(id) {
        if (confirm('Excluir item?')) {
            const idx = DB.inventory.findIndex(i => i.id === id);
            if (idx >= 0) { DB.data.inventory.splice(idx, 1); DB.save(); this.render(); App.dashboardManager.render(); }
        }
    }

    editItem(id) { this.openModal(id); }

    openMaintenanceModal(id) {
        _('maintenanceModal').classList.remove('hidden');
        _('maint-printer-id').value = id;
    }

    submitMaintenance(e) {
        e.preventDefault();
        const pid = _('maint-printer-id').value;
        const maintenance = { id: uid(), printerId: pid, date: new Date().toISOString(), type: _('maint-type').value, description: _('maint-desc').value, cost: parseFloat(_('maint-cost').value) };
        if (!DB.data.maintenances) DB.data.maintenances = [];
        DB.data.maintenances.push(maintenance);
        if (p) { if (!p.specs) p.specs = {}; p.specs.lastMaintenance = maintenance.date; }

        // INTEGRATION: Register Expense in Financial Module
        if (maintenance.cost > 0) {
            App.financialManager.addTransaction(
                'expense',
                'Manutenção',
                maintenance.cost,
                `Manutenção: ${p ? p.name : 'Impressora'}`,
                maintenance.date,
                maintenance.id
            );
        }

        DB.save();
        App.closeModal('maintenanceModal');
        this.render();
    }
}
