class ClientManager {
    render() {
        const search = _('cli-search').value.toLowerCase();
        let list = DB.clients;
        if (search) list = list.filter(c => c.name.toLowerCase().includes(search) || c.phone.includes(search));
        const grid = _('clients-grid');
        if (list.length === 0) { grid.innerHTML = '<p class="text-center text-slate-500">Nenhum cliente.</p>'; return; }

        grid.innerHTML = list.map(c => {
            const stats = this.getStats(c.id);
            const tagsHtml = stats.tags.map(t => `<span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded ${t.color}">${t.label}</span>`).join('');
            const pulseClass = stats.tags.some(t => t.label.includes('Niver') || t.label.includes('Anos')) ? 'glow-pulse border-pink-500/50' : 'border-white/5';
            return `
            <div class="glass-panel p-5 rounded-xl border ${pulseClass} hover:border-purple-500/30 transition-all flex flex-col relative">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-purple-400 font-bold text-lg">${c.name.charAt(0).toUpperCase()}</div>
                        <div><h3 class="font-bold text-white text-base cursor-pointer" onclick="App.clientManager.openDetails('${c.id}')">${c.name}</h3><div class="flex flex-wrap gap-1 mt-1">${tagsHtml}</div></div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3 mb-4 bg-slate-950/30 p-3 rounded-lg">
                    <div><p class="text-[10px] text-slate-500 uppercase font-bold">LTV</p><p class="text-lg font-bold text-green-400 font-mono">${fmtMoney(stats.ltv)}</p></div>
                    <div class="text-right"><p class="text-[10px] text-slate-500 uppercase font-bold">Pedidos</p><p class="text-lg font-bold text-white">${stats.count}</p></div>
                </div>
                <div class="mt-auto flex gap-2 pt-3 border-t border-white/5">
                    <button onclick="App.projectManager.openModal(null, '${c.id}')" class="flex-1 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 text-xs font-bold py-2 rounded">Orçamento</button>
                    <button onclick="App.clientManager.openWhatsappActions('${c.id}')" class="bg-[#25D366]/10 text-[#25D366] px-3 py-2 rounded"><i data-lucide="message-circle" class="w-4 h-4"></i></button>
                </div>
            </div>`;
        }).join('');
        lucide.createIcons();
    }

    getStats(clientId) {
        const projects = DB.projects.filter(p => p.clientId === clientId);
        const concluded = projects.filter(p => p.status === 'Concluido');
        const client = DB.clients.find(c => c.id === clientId);
        const ltv = concluded.reduce((a, b) => a + b.price, 0);
        const lastProject = projects.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        const tags = [];
        const now = new Date();
        const joinDate = new Date(client.joined);
        const days = (now - joinDate) / (86400000);

        if (days < 30) tags.push({ label: 'Novo', color: 'bg-green-500/20 text-green-400' });
        if (ltv > 500) tags.push({ label: 'VIP', color: 'bg-purple-500/20 text-purple-400' });

        return { ltv, count: projects.length, last: lastProject ? lastProject.date : null, tags, projects };
    }

    submit(e) {
        e.preventDefault();
        const id = _('cd-id').value;
        const data = {
            id: id || uid(),
            name: _('cd-name').value,
            phone: _('cd-phone').value,
            email: _('cd-email').value,
            notes: _('cd-notes').value,
            birthDate: _('cd-birth').value,
            joined: _('cd-joined').value || new Date().toISOString()
        };
        if (id) {
            const idx = DB.clients.findIndex(c => c.id === id);
            DB.data.clients[idx] = data;
        } else {
            DB.data.clients.push(data);
        }
        DB.save();
        App.closeModal('clientDetailsModal');
        this.render();
    }

    openDetails(id) {
        _('clientDetailsModal').classList.remove('hidden');
        if (id) {
            const c = DB.clients.find(x => x.id === id);
            if (c) {
                _('cd-id').value = c.id;
                _('cd-name').value = c.name;
                _('cd-phone').value = c.phone;
                _('cd-email').value = c.email;
                _('cd-notes').value = c.notes;
                _('cd-birth').value = c.birthDate || '';
                _('cd-joined').value = c.joined.slice(0, 10);
                this.renderHistory(id);
            }
        } else {
            _('cd-id').value = ''; _('cd-name').value = '';
        }
    }

    renderHistory(id) {
        const stats = this.getStats(id);
        const list = _('cli-history-list');
        if (stats.projects.length === 0) { list.innerHTML = 'Sem histórico.'; return; }
        list.innerHTML = stats.projects.map(p => `
            <div class="flex justify-between items-center bg-slate-950 p-3 rounded border border-slate-800 mb-2">
                <div><p class="text-sm font-bold text-slate-300">${p.name}</p><span class="text-[10px] text-slate-500">${p.status} - ${new Date(p.date).toLocaleDateString()}</span></div>
                <span class="font-mono text-cyan-400 text-sm">${fmtMoney(p.price)}</span>
            </div>
        `).join('');
    }

    openWhatsappActions(id) {
        const c = DB.clients.find(x => x.id === id);
        if (!c) return;
        _('wa-title').innerText = `Msg para ${c.name}`;
        _('wa-preview').value = `Olá ${c.name}, tudo bem?`;
        _('whatsappActionsModal').classList.remove('hidden');
        this.currentWaClient = c;
    }

    confirmSend() {
        if (!this.currentWaClient) return;
        const text = _('wa-preview').value;
        const phone = this.currentWaClient.phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, '_blank');
        App.closeModal('whatsappActionsModal');
    }
}
