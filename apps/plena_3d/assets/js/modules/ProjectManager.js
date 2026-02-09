class ProjectManager {
    constructor() {
        this.initListeners();
    }

    initListeners() {
        // Form submissions are handled by global functions referenced in HTML for now, 
        // or we need to attach them here if we remove onsubmit from HTML.
        // For this refactor, we will keep the global proxy functions in App.js that call these methods.
    }

    render(context = 'projects') {
        const isBudgets = context === 'budgets';
        const filterEl = isBudgets ? null : _('proj-filter');
        const searchEl = isBudgets ? _('bdg-search') : _('proj-search');

        const filter = filterEl ? filterEl.value : 'all';
        const search = searchEl ? searchEl.value.toLowerCase() : '';

        let list = DB.data.projects;

        if (isBudgets) {
            list = list.filter(p => p.status === 'Orçamento');
        } else {
            list = list.filter(p => p.status !== 'Orçamento');
            if (filter !== 'all') list = list.filter(p => p.status === filter);
        }

        if (search) list = list.filter(p => p.name.toLowerCase().includes(search));
        list.sort((a, b) => new Date(b.date) - new Date(a.date));

        const grid = isBudgets ? _('budgets-grid') : _('projects-grid');
        if (!grid) return;

        if (list.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center text-slate-500 py-12"><i data-lucide="${isBudgets ? 'file-text' : 'box'}" class="w-12 h-12 mx-auto mb-3 opacity-20"></i><p>Nenhum ${isBudgets ? 'orçamento' : 'projeto'} encontrado.</p></div>`;
            return;
        }

        grid.innerHTML = list.map(p => {
            const colorClass = { 'Orçamento': 'text-slate-400', 'Fila': 'text-yellow-400', 'Imprimindo': 'text-purple-400', 'Concluido': 'text-green-400', 'Cancelado': 'text-red-500' }[p.status] || 'text-slate-400';
            const dateStr = new Date(p.date).toLocaleDateString();

            let primaryAction = '';
            let secondaryAction = '';

            if (p.status === 'Orçamento') {
                primaryAction = `<button onclick="App.projectManager.promoteStatus('${p.id}')" class="flex-1 bg-green-600/20 hover:bg-green-600/40 text-green-400 text-xs font-bold py-2 rounded flex items-center justify-center border border-green-600/30 transition-all"><i data-lucide="check" class="w-3 h-3 mr-1"></i> Aprovar</button>`;
                secondaryAction = `<button onclick="App.projectManager.rejectStatus('${p.id}')" class="bg-red-600/20 hover:bg-red-600/40 text-red-400 p-2 rounded border border-red-600/30 transition-all" title="Rejeitar"><i data-lucide="x" class="w-3 h-3"></i></button>`;
            } else if (p.status === 'Fila') {
                primaryAction = `<button onclick="App.projectManager.promoteStatus('${p.id}')" class="flex-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 text-xs font-bold py-2 rounded flex items-center justify-center border border-purple-600/30 transition-all"><i data-lucide="play" class="w-3 h-3 mr-1"></i> Iniciar Impressão</button>`;
            } else if (p.status === 'Imprimindo') {
                primaryAction = `<button onclick="App.projectManager.promoteStatus('${p.id}')" class="flex-1 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 text-xs font-bold py-2 rounded flex items-center justify-center border border-cyan-600/30 transition-all"><i data-lucide="check-circle" class="w-3 h-3 mr-1"></i> Concluir</button>`;
            }

            const extraActions = `
                <div class="flex gap-2 mt-2">
                <button onclick="App.projectManager.openBudgetModal('${p.id}')" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 rounded border border-white/10 transition-colors flex items-center justify-center">
                <i data-lucide="printer" class="w-3 h-3 mr-1"></i> ${isBudgets ? 'Gerar PDF' : 'Detalhes'}
                </button>
                <button onclick="App.projectManager.sendWhatsapp('${p.id}')" class="bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] px-3 py-2 rounded border border-[#25D366]/30 transition-colors" title="Enviar WhatsApp">
                <i data-lucide="message-circle" class="w-3 h-3"></i>
                </button>
                </div>`;

            const actionsBar = (p.status !== 'Concluido' && p.status !== 'Cancelado')
                ? `<div class="mt-3 pt-3 border-t border-white/5 space-y-2"><div class="flex gap-2">${primaryAction}${secondaryAction}</div>${extraActions}</div>`
                : `<div class="mt-3 pt-3 border-t border-white/5">${extraActions}</div>`;

            return `
                <div class="glass-panel p-5 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all group relative flex flex-col">
                <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onclick="App.projectManager.duplicateProject('${p.id}')" title="Duplicar" class="text-slate-400 hover:text-cyan-400"><i data-lucide="copy" class="w-4 h-4"></i></button>
                <button onclick="App.projectManager.deleteProject('${p.id}')" title="Excluir" class="text-slate-400 hover:text-red-400"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
                <div class="flex justify-between items-start mb-4">
                <div class="bg-slate-800 p-2 rounded-lg text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors"><i data-lucide="${isBudgets ? 'file-text' : 'box'}" class="w-6 h-6"></i></div>
                <span class="text-xs font-bold uppercase ${colorClass} bg-slate-950 px-2 py-1 rounded">${p.status}</span>
                </div>
                <div class="flex-1">
                <h3 class="font-bold text-white text-lg mb-1 truncate pr-8 cursor-pointer hover:text-cyan-400" onclick="App.projectManager.openModal('${p.id}')">${p.name}</h3>
                <div class="flex justify-between items-center mb-4">
                <p class="text-xs text-slate-400 font-mono">${fmtMoney(p.price)}</p>
                <p class="text-[10px] text-slate-500">${dateStr}</p>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-2">
                <div class="flex items-center"><i data-lucide="clock" class="w-3 h-3 mr-1"></i> ${p.time}h</div>
                <div class="flex items-center"><i data-lucide="spool" class="w-3 h-3 mr-1"></i> ${p.weight}g</div>
                </div>
                </div>
                ${actionsBar}
                <button onclick="App.projectManager.openModal('${p.id}')" class="w-full text-center text-xs font-bold text-slate-600 hover:text-cyan-400 pt-2 mt-2 border-t border-white/5 flex items-center justify-center">
                <i data-lucide="edit-3" class="w-3 h-3 mr-2"></i> Editar Dados
                </button>
                </div>`;
        }).join('');
        lucide.createIcons();
    }

    // ... Implementation of other methods (submit, delete, promote, etc.) adapted from index.html ...
    // Since I cannot write 3000 lines in one go, I'm simplifying the structure.
    // I will implementation the logic methods now.

    promoteStatus(id) {
        const p = DB.data.projects.find(x => x.id === id);
        if (!p) return;
        const next = { 'Orçamento': 'Fila', 'Fila': 'Imprimindo', 'Imprimindo': 'Concluido' };
        const nextStatus = next[p.status];
        if (nextStatus) {
            if (p.status === 'Orçamento' && nextStatus === 'Fila' && p.filamentId) {
                const fil = DB.inventory.find(f => f.id === p.filamentId);
                if (fil) {
                    fil.quantity -= p.weight;
                    if (fil.weight) fil.remaining = fil.quantity;
                    App.inventoryManager.addLog(p.filamentId, 'saida', p.weight, `Orçamento aprovado: ${p.name}`);
                }
            }
            if (nextStatus === 'Concluido') {
                const today = new Date().toISOString();
                App.financialManager.addTransaction('income', 'Venda', p.price, `Projeto Concluído: ${p.name}`, today, p.id);
                if (p.cost > 0) {
                    App.financialManager.addTransaction('expense', 'Material', p.cost, `Custo de Produção: ${p.name}`, today, p.id);
                }
            }
            p.status = nextStatus;
            DB.save();
            this.refreshViews();
        }
    }

    rejectStatus(id) {
        if (confirm('Deseja rejeitar/cancelar este orçamento?')) {
            const p = DB.data.projects.find(x => x.id === id);
            if (p) {
                p.status = 'Cancelado';
                DB.save();
                this.refreshViews();
            }
        }
    }

    refreshViews() {
        if (!_('view-projects').classList.contains('hide')) this.render('projects');
        if (!_('view-budgets').classList.contains('hide')) this.render('budgets');
        App.dashboardManager.render();
    }

    submit(e) {
        e.preventDefault();
        const id = _('pj-id').value;
        const filamentId = _('pj-filament').value;
        const weight = parseFloat(_('pj-weight').value);
        const status = _('pj-status').value;

        if (!id && status !== 'Orçamento' && filamentId) {
            const fil = DB.inventory.find(f => f.id === filamentId);
            if (fil) {
                fil.quantity -= weight;
                if (fil.weight) fil.remaining = fil.quantity;
                App.inventoryManager.addLog(filamentId, 'saida', weight, `Projeto: ${_('pj-name').value}`);
            }
        }

        const projectData = {
            id: id || uid(),
            name: _('pj-name').value,
            clientId: _('pj-client').value,
            filamentId: filamentId,
            weight: weight,
            time: parseFloat(_('pj-time').value),
            price: parseFloat(_('final-price').innerText.replace('R$', '').replace('.', '').replace(',', '.').trim()),
            cost: parseFloat(_('cost-total').innerText.replace('R$', '').replace('.', '').replace(',', '.').trim()),
            status: status,
            date: id ? DB.data.projects.find(x => x.id === id).date : new Date().toISOString()
        };

        if (id) {
            const index = DB.data.projects.findIndex(x => x.id === id);
            DB.data.projects[index] = projectData;
        } else {
            DB.data.projects.unshift(projectData);
        }

        DB.save();
        App.closeModal('projectModal');
        this.refreshViews();
    }

    deleteProject(id) {
        if (confirm('Tem certeza que deseja excluir?')) {
            DB.data.projects = DB.data.projects.filter(p => p.id !== id);
            DB.save();
            this.refreshViews();
        }
    }

    duplicateProject(id) {
        const p = DB.data.projects.find(x => x.id === id);
        if (p) {
            const newP = { ...p, id: uid(), name: p.name + ' (Cópia)', status: 'Orçamento', date: new Date().toISOString() };
            DB.data.projects.unshift(newP);
            DB.save();
            this.refreshViews();
            alert('Projeto duplicado como Orçamento!');
        }
    }

    openModal(id = null) {
        _('projectModal').classList.remove('hidden');
        const clients = DB.clients;
        const filaments = DB.inventory.filter(f => {
            if (f.category && f.category !== 'filamento') return false;
            const qty = f.quantity || f.remaining || 0;
            return qty > 50;
        });

        _('pj-client').innerHTML = '<option value="">Cliente Avulso</option>' + clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        _('pj-filament').innerHTML = '<option value="">Selecione...</option>' + filaments.map(f => {
            const price = f.cost || f.price || 0;
            const weight = f.weight || f.quantity || 1000;
            const type = f.specs?.type || f.type || 'PLA';
            const color = f.specs?.color || f.color || f.name;
            const brand = f.brand || 'Genérico';
            const pricePerKg = (price / weight * 1000).toFixed(0);
            return `<option value="${f.id}" data-price="${price}" data-weight="${weight}">${type} - ${color} (${brand}) [R$${pricePerKg}/kg]</option>`;
        }).join('');

        _('pj-id').value = '';
        if (id) {
            const p = DB.data.projects.find(x => x.id === id);
            if (p) {
                _('pj-id').value = p.id;
                _('pj-name').value = p.name;
                _('pj-client').value = p.clientId;
                _('pj-filament').value = p.filamentId;
                _('pj-weight').value = p.weight;
                _('pj-time').value = p.time;
                _('pj-status').value = p.status;
            }
        } else {
            _('pj-name').value = ''; _('pj-weight').value = ''; _('pj-time').value = ''; _('pj-filament').value = '';
            _('pj-status').value = 'Orçamento';
        }
        this.calculateCost();
    }

    calculateCost() {
        const filamentId = _('pj-filament').value;
        const weight = parseFloat(_('pj-weight').value) || 0;
        const time = parseFloat(_('pj-time').value) || 0;
        const markup = parseFloat(_('pj-markup').value) || 0;
        let matCost = 0;
        if (filamentId) {
            const opt = _('pj-filament').selectedOptions[0];
            const price = parseFloat(opt.getAttribute('data-price'));
            const originalWeight = parseFloat(opt.getAttribute('data-weight'));
            matCost = (price / originalWeight) * weight;
        }
        const kwhPrice = DB.settings.kwh;
        const watts = DB.settings.watts;
        const energyCost = (watts / 1000) * time * kwhPrice;
        const machineCost = time * DB.settings.depreciation;
        const baseCost = matCost + energyCost + machineCost;
        const riskCost = baseCost * (DB.settings.failure / 100);
        const totalCost = baseCost + riskCost;
        const finalPrice = totalCost * (1 + (markup / 100));

        _('cost-material').innerText = fmtMoney(matCost);
        _('cost-energy').innerText = fmtMoney(energyCost);
        _('cost-machine').innerText = fmtMoney(machineCost);
        _('cost-failure').innerText = fmtMoney(riskCost);
        _('cost-total').innerText = fmtMoney(totalCost);
        _('final-price').innerText = fmtMoney(finalPrice);
        _('btn-wa-text').innerText = _('pj-status').value === 'Orçamento' ? 'Enviar Orçamento' : 'Enviar Status';
    }

    openBudgetModal(id) {
        const p = DB.data.projects.find(x => x.id === id);
        if (!p) return;
        const sName = DB.settings.storeName || 'Plena 3D';
        const sDoc = DB.settings.storeDoc ? `CNPJ: ${DB.settings.storeDoc}` : '';
        _('bdg-store-name').innerText = sName;
        _('bdg-store-doc').innerText = sDoc;
        _('bdg-id').innerText = '#' + p.id.substr(0, 6).toUpperCase();

        const c = DB.clients.find(cli => cli.id === p.clientId);
        _('bdg-client-name').innerText = c ? c.name : (DB.settings.owner || 'Cliente');
        _('bdg-client-contact').innerText = c ? `Contato: ${c.phone}` : 'Contato: -';

        _('bdg-project-name').innerText = p.name;
        const fil = DB.inventory.find(f => f.id === p.filamentId);
        _('bdg-material').innerText = fil ? `${fil.type} - ${fil.color} (${fil.brand})` : 'Material Padrão';
        _('bdg-weight').innerText = `${p.weight}g`;
        _('bdg-time').innerText = `${p.time}h`;
        _('bdg-total').innerText = fmtMoney(p.price);
        _('budgetModal').classList.remove('hidden');
    }

    sendWhatsapp(idToUse = null) {
        let name, clientID;
        if (idToUse) {
            const p = DB.projects.find(x => x.id === idToUse);
            if (!p) return;
            name = p.name;
            clientID = p.clientId;
        } else {
            name = _('pj-name').value;
            clientID = _('pj-client').value;
        }
        if (!name) return alert('Dê um nome ao projeto!');
        let phone = '';
        let clientName = 'Cliente';
        if (clientID) {
            const c = DB.clients.find(x => x.id === clientID);
            if (c) { phone = c.phone.replace(/\D/g, ''); clientName = c.name; }
        }
        const text = `Olá, *${clientName}*! Tudo bem? %0A%0AEstou finalizando o orçamento do seu projeto *${name}*. %0A%0APodemos conversar?`;
        window.open(`https://wa.me/55${phone}?text=${text}`, '_blank');
    }
}
