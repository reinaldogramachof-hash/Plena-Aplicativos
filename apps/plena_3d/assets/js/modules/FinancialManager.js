class FinancialManager {
    render() {
        const m = _('fin-month').value;
        let trans = DB.data.transactions || [];

        if (m) {
            trans = trans.filter(t => t.date.startsWith(m));
        }

        const inc = trans.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
        const exp = trans.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
        _('fin-income').innerText = fmtMoney(inc);
        _('fin-expense').innerText = fmtMoney(exp);
        _('fin-balance').innerText = fmtMoney(inc - exp);
        _('financial-table').innerHTML = trans.map(t => `
            <tr class="hover:bg-white/5 transition-colors group">
            <td class="px-6 py-4 font-mono text-slate-400 text-xs">${new Date(t.date).toLocaleDateString()}</td>
            <td class="px-6 py-4">
                <div class="font-bold text-white">${t.desc}</div>
                <div class="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="App.financialManager.openModal('${t.id}')" class="text-[10px] text-slate-500 hover:text-cyan-400 flex items-center gap-1"><i data-lucide="edit-3" class="w-3 h-3"></i> Editar</button>
                    <button onclick="App.financialManager.deleteTransaction('${t.id}')" class="text-[10px] text-slate-500 hover:text-red-400 flex items-center gap-1"><i data-lucide="trash-2" class="w-3 h-3"></i> Excluir</button>
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="text-xs uppercase text-slate-400 font-bold">${t.category}</div>
                <div class="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                    <i data-lucide="wallet" class="w-3 h-3"></i> ${t.method || 'Pix'}
                </div>
            </td>
            <td class="px-6 py-4 text-right font-mono text-sm text-white">${fmtMoney(t.amount)}</td>
            <td class="px-6 py-4 text-center">
            <span class="${t.type === 'income' ? 'text-green-500' : 'text-red-500'} font-bold text-[10px] uppercase px-2 py-1 bg-${t.type === 'income' ? 'green' : 'red'}-500/10 rounded-full border border-${t.type === 'income' ? 'green' : 'red'}-500/20">${t.type === 'income' ? 'Entrada' : 'Saída'}</span>
            </td>
            </tr>
            `).join('');
        lucide.createIcons();
    }

    addTransaction(type, category, amount, desc, date, refId = null, method = 'Pix') {
        if (!DB.data.transactions) DB.data.transactions = [];
        DB.data.transactions.unshift({
            id: uid(),
            type, category, amount: parseFloat(amount) || 0, desc, date: date || new Date().toISOString(), method, refId
        });
        DB.save();
    }

    openModal(id = null) {
        _('transactionModal').classList.remove('hidden');
        if (id) {
            const t = DB.data.transactions.find(x => x.id === id);
            if (t) {
                _('tr-modal-title').innerText = 'Editar Lançamento';
                _('tr-id').value = t.id;
                _('tr-amount').value = t.amount;
                _('tr-desc').value = t.desc;
                _('tr-cat').value = t.category;
                _('tr-date').value = t.date.slice(0, 10);
                _('tr-method').value = t.method || 'Pix';
                document.querySelector(`input[name="tr-type"][value="${t.type}"]`).checked = true;
            }
        } else {
            _('tr-modal-title').innerText = 'Novo Lançamento';
            _('tr-id').value = '';
            _('tr-amount').value = '';
            _('tr-desc').value = '';
            _('tr-cat').value = 'Venda';
            _('tr-method').value = 'Pix';
            _('tr-date').value = new Date().toISOString().slice(0, 10);
            document.querySelector('input[name="tr-type"][value="income"]').checked = true;
            _('tr-amount').focus();
        }
    }

    submit(e) {
        e.preventDefault();
        const id = _('tr-id').value;
        const type = document.querySelector('input[name="tr-type"]:checked').value;
        const amount = parseFloat(_('tr-amount').value);
        const desc = _('tr-desc').value;
        const category = _('tr-cat').value;
        const method = _('tr-method').value;
        const date = _('tr-date').value;

        if (id) {
            const index = DB.data.transactions.findIndex(t => t.id === id);
            if (index >= 0) {
                DB.data.transactions[index] = { ...DB.data.transactions[index], type, amount, desc, category, date, method };
                DB.save();
            }
        } else {
            this.addTransaction(type, category, amount, desc, date, null, method);
        }

        App.closeModal('transactionModal');
        if (!_('view-financial').classList.contains('hide')) this.render();
        App.dashboardManager.render();
    }

    deleteTransaction(id) {
        if (confirm('Tem certeza que deseja excluir este lançamento?')) {
            const index = DB.data.transactions.findIndex(t => t.id === id);
            if (index >= 0) {
                DB.data.transactions.splice(index, 1);
                DB.save();
                this.render();
                App.dashboardManager.render();
            }
        }
    }
}
