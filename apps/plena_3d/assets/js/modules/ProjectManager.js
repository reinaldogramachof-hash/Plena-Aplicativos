class ProjectManager {
    constructor() {
        this.initListeners();
    }

    initListeners() {
        // Listeners globais mantidos no html/app.js
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
                <div class="flex items-center"><i data-lucide="clock" class="w-3 h-3 mr-1"></i> ${p.time}h total</div>
                <div class="flex items-center"><i data-lucide="package" class="w-3 h-3 mr-1"></i> ${p.quantity || 1} un</div>
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

    // Lógica segura de leitura de campos
    getVal(id, type = 'float') {
        const el = document.getElementById(id);
        if (!el) {
            console.warn(`Element #${id} not found`);
            return type === 'string' ? '' : 0;
        }
        if (type === 'string') return el.value;
        const val = parseFloat(el.value);
        return isNaN(val) ? 0 : val;
    }

    promoteStatus(id) {
        const p = DB.data.projects.find(x => x.id === id);
        if (!p) return;
        const next = { 'Orçamento': 'Fila', 'Fila': 'Imprimindo', 'Imprimindo': 'Concluido' };
        const nextStatus = next[p.status];
        if (nextStatus) {
            if (p.status === 'Orçamento' && nextStatus === 'Fila') {
                const materialsToDeduct = p.materials || (p.filamentId ? [{ id: p.filamentId, weight: p.weight }] : []);
                const quantity = p.quantity || 1;

                materialsToDeduct.forEach(mat => {
                    const fil = DB.inventory.find(f => f.id === mat.id);
                    if (fil) {
                        const totalDeduct = mat.weight * quantity;
                        fil.quantity -= totalDeduct;
                        if (fil.weight) fil.remaining = fil.quantity;
                        App.inventoryManager.addLog(mat.id, 'saida', totalDeduct, `Orçamento aprovado: ${p.name} (${quantity} un)`);
                    }
                });
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
        if (App.dashboardManager) App.dashboardManager.render();
    }

    submit(e) {
        e.preventDefault();

        // Garante cálculo atualizado antes de ler valores
        this.calculateCost();

        const id = this.getVal('pj-id', 'string');
        const status = this.getVal('pj-status', 'string');
        const materials = this.getMaterialsFromUI();
        const quantity = this.getVal('pj-quantity') || 1;

        if (!id && status !== 'Orçamento') {
            materials.forEach(mat => {
                const fil = DB.inventory.find(f => f.id === mat.id);
                if (fil) {
                    const totalDeduct = mat.weight * quantity;
                    fil.quantity -= totalDeduct;
                    if (fil.weight) fil.remaining = fil.quantity;
                    App.inventoryManager.addLog(mat.id, 'saida', totalDeduct, `Projeto novo direto: ${_('pj-name').value} (${quantity} un)`);
                }
            });
        }

        const unitWeight = materials.reduce((acc, curr) => acc + curr.weight, 0);

        // Ler valores da UI (que acabaram de ser recalculados)
        const finalPriceUI = parseFloat(_('final-price').innerText.replace('R$', '').replace('.', '').replace(',', '.').trim());
        const finalCostUI = parseFloat(_('cost-total').innerText.replace('R$', '').replace('.', '').replace(',', '.').trim());

        const projectData = {
            id: id || uid(),
            name: this.getVal('pj-name', 'string'),
            clientId: this.getVal('pj-client', 'string'),
            materials: materials,
            filamentId: materials.length > 0 ? materials[0].id : null,
            weight: unitWeight,
            quantity: quantity,

            time: this.getVal('pj-time'),
            extraCost: this.getVal('pj-extras'),
            setupCost: this.getVal('pj-setup'),
            notes: this.getVal('pj-notes', 'string'),
            markup: this.getVal('pj-markup') || 100,

            // Usar valor da UI se cálculo interno falhar, ou vice-versa
            price: finalPriceUI || this.currentCalculatedPrice || 0,
            cost: finalCostUI || this.currentCalculatedCost || 0,

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

    addMaterialRow(savedMaterial = null) {
        const container = _('material-list');
        const rowId = 'mat-row-' + Math.random().toString(36).substr(2, 9);

        const filaments = DB.inventory.filter(f => {
            if (f.category && f.category !== 'filamento') return false;
            const qty = f.quantity || f.remaining || 0;
            return qty > 10;
        });

        const options = '<option value="">Selecione...</option>' + filaments.map(f => {
            const price = f.cost || f.price || 0;
            const weight = f.weight || f.quantity || 1000;
            const type = f.specs?.type || f.type || 'PLA';
            const color = f.specs?.color || f.color || f.name;
            const brand = f.brand || 'Genérico';
            const pricePerKg = (price / weight * 1000).toFixed(0);
            const selected = savedMaterial && savedMaterial.id === f.id ? 'selected' : '';
            return `<option value="${f.id}" data-price="${price}" data-weight="${weight}" ${selected}>${type} - ${color} (${brand}) [R$${pricePerKg}/kg]</option>`;
        }).join('');

        const html = `
            <div id="${rowId}" class="flex gap-2 items-start material-row">
                <div class="flex-grow">
                    <select class="w-full bg-slate-950 border border-slate-700 p-2 rounded text-xs text-white mat-select" onchange="App.projectManager.calculateCost()">
                        ${options}
                    </select>
                </div>
                <div class="w-24">
                    <input type="number" class="w-full bg-slate-950 border border-slate-700 p-2 rounded text-xs text-white mat-weight" 
                        placeholder="Qtd(g)" oninput="App.projectManager.calculateCost()" value="${savedMaterial ? savedMaterial.weight : ''}">
                </div>
                <button type="button" onclick="document.getElementById('${rowId}').remove(); App.projectManager.calculateCost()" 
                    class="text-red-400 p-2 hover:bg-slate-800 rounded">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
        lucide.createIcons();
    }

    getMaterialsFromUI() {
        const rows = document.querySelectorAll('.material-row');
        const materials = [];
        rows.forEach(row => {
            const select = row.querySelector('.mat-select');
            const weightInput = row.querySelector('.mat-weight');
            if (select && select.value && weightInput && weightInput.value) {
                materials.push({
                    id: select.value,
                    weight: parseFloat(weightInput.value)
                });
            }
        });
        return materials;
    }

    openModal(id = null) {
        const modal = _('projectModal');
        if (!modal) return;
        modal.classList.remove('hidden');

        const clients = DB.clients;
        const clientSelect = _('pj-client');
        if (clientSelect) clientSelect.innerHTML = '<option value="">Cliente Avulso</option>' + clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

        // Limpar lista de materiais e recriar
        _('material-list').innerHTML = '';

        const idEl = _('pj-id');
        if (idEl) idEl.value = '';

        if (id) {
            const p = DB.data.projects.find(x => x.id === id);
            if (p) {
                if (idEl) idEl.value = p.id;
                const setVal = (eid, val) => { const e = _(eid); if (e) e.value = val; };

                setVal('pj-name', p.name);
                setVal('pj-client', p.clientId);
                setVal('pj-time', p.time);
                setVal('pj-status', p.status);
                setVal('pj-quantity', p.quantity || 1);
                setVal('pj-extras', p.extraCost || '');
                setVal('pj-setup', p.setupCost || '');
                setVal('pj-notes', p.notes || '');
                setVal('pj-markup', p.markup || 100);

                if (p.materials && Array.isArray(p.materials)) {
                    p.materials.forEach(m => this.addMaterialRow(m));
                } else if (p.filamentId) {
                    this.addMaterialRow({ id: p.filamentId, weight: p.weight });
                } else {
                    this.addMaterialRow();
                }
            }
        } else {
            const setVal = (eid, val) => { const e = _(eid); if (e) e.value = val; };
            setVal('pj-name', '');
            setVal('pj-time', '');
            setVal('pj-quantity', '1');
            setVal('pj-extras', '');
            setVal('pj-setup', '');
            setVal('pj-notes', '');
            setVal('pj-markup', '100');
            setVal('pj-status', 'Orçamento');
            this.addMaterialRow();
        }
        this.calculateCost();
    }

    calculateCost() {
        // Validação defensiva - se elementos não carregaram ainda
        if (!document.getElementById('pj-time')) return;

        const time = this.getVal('pj-time');
        const markup = this.getVal('pj-markup') || 0;
        const extraCostUnit = this.getVal('pj-extras') || 0;
        const setupCost = this.getVal('pj-setup') || 0;
        const quantity = this.getVal('pj-quantity') || 1;

        // 1. Custo de Material Unitário
        let matCostUnit = 0;
        const rows = document.querySelectorAll('.material-row');
        rows.forEach(row => {
            const select = row.querySelector('.mat-select');
            const weightInput = row.querySelector('.mat-weight');

            if (select && select.value) {
                const opt = select.selectedOptions[0];
                if (opt) {
                    const price = parseFloat(opt.getAttribute('data-price')) || 0;
                    const originalWeight = parseFloat(opt.getAttribute('data-weight')) || 1000;
                    const weight = parseFloat(weightInput.value) || 0;
                    // +5% perda no material
                    matCostUnit += (price / originalWeight) * weight * 1.05;
                }
            }
        });

        // 2. Custo de Processo Unitário (Energia + Máquina)
        const kwhPrice = DB.settings.kwh || 0;
        const watts = DB.settings.watts || 0;
        const energyCostUnit = (watts / 1000) * time * kwhPrice;
        const machineCostUnit = time * (DB.settings.depreciation || 0);

        // 3. Custo de Produção Unitário Base
        const baseUnitCost = matCostUnit + energyCostUnit + machineCostUnit + extraCostUnit;

        // 4. Custo de Risco
        const failureRate = DB.settings.failure || 0;
        const riskCostUnit = baseUnitCost * (failureRate / 100);

        // 5. Custo Unitário Final
        const finalUnitCost = baseUnitCost + riskCostUnit;

        // 6. Totais para exibir UI
        const totalMatCost = matCostUnit * quantity;
        const totalEnergyCost = energyCostUnit * quantity;
        const totalMachineCost = machineCostUnit * quantity;
        const totalRiskCost = riskCostUnit * quantity;
        const totalExtraCost = extraCostUnit * quantity;

        const totalProductionCost = (finalUnitCost * quantity); // Sem Markup, Sem Setup

        // 7. Preço Final
        const finalPrice = (totalProductionCost * (1 + (markup / 100))) + setupCost;

        // Guardar valores calculados para o submit
        this.currentCalculatedPrice = finalPrice;
        this.currentCalculatedCost = totalProductionCost;

        // Atualizar UI
        const setTxt = (eid, txt) => { const e = _(eid); if (e) e.innerText = txt; };

        setTxt('cost-material', fmtMoney(totalMatCost));
        setTxt('cost-energy', fmtMoney(totalEnergyCost));
        setTxt('cost-machine', fmtMoney(totalMachineCost));
        setTxt('cost-failure', fmtMoney(totalRiskCost));
        setTxt('cost-extras', fmtMoney(totalExtraCost));
        setTxt('cost-total', fmtMoney(totalProductionCost));
        setTxt('final-price', fmtMoney(finalPrice));

        const labelSetup = _('label-setup-cost');
        if (labelSetup) {
            setupCost > 0 ? labelSetup.classList.remove('hidden') : labelSetup.classList.add('hidden');
            labelSetup.innerText = `+ ${fmtMoney(setupCost)} (Setup/Modelagem)`;
        }

        const btnWa = _('btn-wa-text');
        if (btnWa) {
            const statusVal = _('pj-status') ? _('pj-status').value : 'Orçamento';
            btnWa.innerText = statusVal === 'Orçamento' ? 'Enviar Orçamento' : 'Enviar Status';
        }
    }

    openBudgetModal(id) {
        const p = DB.data.projects.find(x => x.id === id);
        if (!p) return;
        const quantity = p.quantity || 1;
        const sName = DB.settings.storeName || 'Plena 3D';
        const sDoc = DB.settings.storeDoc ? `CNPJ: ${DB.settings.storeDoc}` : '';

        const setTxt = (eid, txt) => { const e = _(eid); if (e) e.innerText = txt; };

        setTxt('bdg-store-name', sName);
        setTxt('bdg-store-doc', sDoc);
        setTxt('bdg-id', '#' + p.id.substr(0, 6).toUpperCase());

        const c = DB.clients.find(cli => cli.id === p.clientId);
        setTxt('bdg-client-name', c ? c.name : (DB.settings.owner || 'Cliente'));
        setTxt('bdg-client-contact', c ? `Contato: ${c.phone}` : 'Contato: -');

        // Construir Tabela Dinâmica
        const tbody = _('bdg-tbody');
        tbody.innerHTML = '';

        const addRow = (label, value) => {
            tbody.insertAdjacentHTML('beforeend', `
                <tr class="border-b border-slate-100">
                    <td class="py-3 text-slate-500">${label}</td>
                    <td class="py-3 font-bold text-right text-slate-900">${value}</td>
                </tr>
            `);
        };

        // 1. Projeto e Quantidade
        const projName = `${p.name} <span class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded ml-2 border border-gray-300">Qtd: ${quantity}</span>`;
        addRow('Projeto', projName);

        // 2. Materiais
        const materials = p.materials || (p.filamentId ? [{ id: p.filamentId, weight: p.weight }] : []);
        let matHtml = '';
        materials.forEach(m => {
            const fil = DB.inventory.find(f => f.id === m.id);
            const type = fil ? fil.specs?.type || fil.type || 'PLA' : 'Desconhecido';
            const color = fil ? fil.specs?.color || fil.color || 'Cor Padrão' : '';
            const brand = fil ? fil.brand || 'Genérico' : '';
            matHtml += `<div class="text-sm">${type} ${color} <span class="text-xs text-slate-400">(${brand})</span> - ${m.weight}g</div>`;
        });
        addRow('Materiais', matHtml || 'Nenhum material registrado');

        // 3. Peso Total
        const totalWeight = p.weight ? (p.weight * quantity) : materials.reduce((a, b) => a + b.weight, 0) * quantity;
        addRow('Peso Estimado Total', `${totalWeight}g <span class="text-[10px] text-gray-400 block font-normal">(${quantity} x ${(totalWeight / quantity).toFixed(0)}g)</span>`);

        // 4. Tempo Total
        addRow('Tempo de Execução Total', `${(p.time * quantity).toFixed(1)}h <span class="text-[10px] text-gray-400 block font-normal">(${quantity} x ${p.time}h)</span>`);

        // 5. Custos Extras (Se houver)
        if (p.setupCost > 0) {
            addRow('Setup / Modelagem (Fixo)', fmtMoney(p.setupCost));
        }

        if (p.extraCost > 0) {
            const totalExtra = p.extraCost * quantity;
            addRow('Acabamento / Extras', `${fmtMoney(totalExtra)} <span class="text-[10px] text-gray-400 block font-normal">(${quantity} x ${fmtMoney(p.extraCost)})</span>`);
        }

        setTxt('bdg-total', fmtMoney(p.price));

        _('budgetModal').classList.remove('hidden');
    }

    sendWhatsapp(idToUse = null) {
        let name, clientID, price, notes;
        if (idToUse) {
            const p = DB.data.projects.find(x => x.id === idToUse);
            if (!p) return;
            name = p.name;
            clientID = p.clientId;
            price = p.price;
            notes = p.notes || '';
        } else {
            name = _('pj-name').value;
            clientID = _('pj-client').value;
            price = _('final-price').innerText;
            notes = _('pj-notes').value || '';
        }

        if (!name) return alert('Dê um nome ao projeto!');

        let phone = '';
        let clientName = 'Cliente';
        if (clientID) {
            const c = DB.clients.find(x => x.id === clientID);
            if (c) { phone = c.phone.replace(/\D/g, ''); clientName = c.name; }
        }

        const saudacao = `Olá, *${clientName}*! Tudo bem?`;
        const detalhe = `Segue o orçamento para o projeto *${name}*.`;
        const valor = `*Valor Total: ${typeof price === 'number' ? fmtMoney(price) : price}*`;
        const obs = notes ? `%0AObs: ${notes}` : '';
        const callToAction = `%0AFico no aguardo para iniciarmos a produção! 🚀`;

        const text = `${saudacao}%0A%0A${detalhe}%0A${valor}${obs}%0A${callToAction}`;
        window.open(`https://wa.me/55${phone}?text=${text}`, '_blank');
    }
}
