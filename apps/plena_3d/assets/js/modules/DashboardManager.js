class DashboardManager {
    render() {
        const projects = DB.data.projects || [];
        const transactions = DB.data.transactions || [];
        const inventory = DB.data.inventory || [];

        const today = new Date();
        const currentMonth = today.toISOString().slice(0, 7);

        // --- 1. KPI: Faturamento (Receita Real do Mês) ---
        // Considera apenas transações de ENTRADA (income) dentro do mês atual
        const incomeTransactions = transactions.filter(t => t.type === 'income' && t.date.startsWith(currentMonth));
        const revenue = incomeTransactions.reduce((acc, t) => acc + t.amount, 0);

        // --- 2. KPI: Filamento Gasto (Total ACUMULADO) ---
        // Considera apenas projetos que REALMENTE consumiram material (Concluido, Imprimindo, Cancelado parcial? Não, apenas os que rodaram)
        // Vamos considerar: Concluido e Imprimindo.
        const consummedProjects = projects.filter(p => p.status === 'Concluido' || p.status === 'Imprimindo');
        const filamentTotalWeight = consummedProjects.reduce((acc, p) => acc + (p.weight || 0), 0);

        // --- 3. KPI: Horas Impressão (Tempo de Máquina Mês) ---
        // Alterado para refletir HORAS de uso no Mês Atual (baseado na data de conclusão/início)
        // Se o projeto é deste mês e foi impresso
        const machineTimeProjects = consummedProjects.filter(p => p.date.startsWith(currentMonth));
        const machineHours = machineTimeProjects.reduce((acc, p) => acc + (p.time || 0), 0);

        // --- 4. KPI: Projetos Ativos (Fila + Imprimindo) ---
        const activeProjects = projects.filter(p => p.status === 'Fila' || p.status === 'Imprimindo');

        // --- Atualização da UI (Cards) ---
        const kpiRev = _('kpi-revenue');
        if (kpiRev) {
            kpiRev.innerText = fmtMoney(revenue);
            // Meta visual (ex: 5mil) - Barra de progresso subtil
            const meta = 5000;
            const pct = Math.min(100, (revenue / meta) * 100);
            kpiRev.parentElement.style.background = `linear-gradient(to right, rgba(14, 165, 233, 0.1) ${pct}%, transparent ${pct}%)`;
        }

        const kpiFilament = _('kpi-filament');
        if (kpiFilament) {
            kpiFilament.innerText = (filamentTotalWeight / 1000).toFixed(1) + 'kg';
            if (kpiFilament.nextElementSibling) kpiFilament.nextElementSibling.innerHTML = `<i data-lucide="spool" class="w-3 h-3 mr-1"></i> Total Processado`;
        }

        const kpiHoursEl = _('kpi-hours');
        if (kpiHoursEl) {
            kpiHoursEl.innerText = machineHours.toFixed(1) + 'h';
            if (kpiHoursEl.nextElementSibling) kpiHoursEl.nextElementSibling.innerHTML = `<i data-lucide="calendar" class="w-3 h-3 mr-1"></i> Neste Mês`;
        }

        const kpiActive = _('kpi-active');
        if (kpiActive) kpiActive.innerText = activeProjects.length;


        // --- 5. Lista de Projetos Recentes (Fila de Prioridade) ---
        // Prioriza: Imprimindo > Fila > Orçamento Aprovado (que deveria estar na fila)
        const queue = activeProjects.sort((a, b) => {
            if (a.status === 'Imprimindo') return -1;
            if (b.status === 'Imprimindo') return 1;
            return new Date(a.date) - new Date(b.date); // Mais antigos primeiro
        }).slice(0, 5); // Top 5

        const recentsContainer = _('recent-projects-list');
        if (recentsContainer) {
            if (queue.length > 0) {
                recentsContainer.innerHTML = queue.map(p => {
                    const isPrinting = p.status === 'Imprimindo';
                    const icon = isPrinting ? 'printer' : 'clock';
                    const color = isPrinting ? 'text-purple-400' : 'text-yellow-400';
                    const bg = isPrinting ? 'bg-purple-500/10 border-purple-500/30' : 'bg-slate-800 border-white/5';
                    const actionBtn = isPrinting
                        ? `<button onclick="App.projectManager.promoteStatus('${p.id}')" class="px-2 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors">Concluir</button>`
                        : `<button onclick="App.projectManager.promoteStatus('${p.id}')" class="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors">Iniciar</button>`;

                    return `
                    <div class="flex items-center justify-between p-3 rounded-lg border ${bg} mb-2">
                        <div class="flex items-center gap-3">
                            <div class="p-2 rounded-full bg-slate-900 ${color}"><i data-lucide="${icon}" class="w-4 h-4"></i></div>
                            <div>
                                <p class="text-sm font-bold text-white truncate max-w-[150px]">${p.name}</p>
                                <p class="text-[10px] text-slate-400 uppercase">${p.weight}g • ${p.time}h</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-mono font-bold text-slate-300 hidden sm:block">${fmtMoney(p.price)}</span>
                            ${actionBtn}
                        </div>
                    </div>`;
                }).join('');
            } else {
                recentsContainer.innerHTML = `<div class="text-center py-6 text-slate-500 italic flex flex-col items-center"><i data-lucide="coffee" class="w-8 h-8 mb-2 opacity-50"></i><p class="text-xs">Máquinas paradas.</p></div>`;
            }
        }

        // --- 6. Estoque Baixo (Com Indicadores Visuais) ---
        const lowStock = inventory.filter(i => {
            if (i.category === 'impressora') return false;
            const qty = i.quantity || i.remaining || 0;
            const min = i.minStock || 2;
            return qty <= min;
        }).sort((a, b) => (a.quantity || 0) - (b.quantity || 0)).slice(0, 5);

        const stockContainer = _('low-stock-list');
        if (stockContainer) {
            if (lowStock.length > 0) {
                stockContainer.innerHTML = lowStock.map(item => {
                    const qty = item.quantity || item.remaining || 0;
                    const unit = item.unit || 'un';
                    // Crítico se < 50% do mínimo
                    const isCritical = qty < ((item.minStock || 0) * 0.5);
                    const colorClass = isCritical ? 'text-red-500' : 'text-yellow-400';
                    const icon = isCritical ? 'alert-triangle' : 'alert-circle';

                    return `
                    <div class="flex items-center justify-between p-2 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors rounded">
                        <div class="flex items-center gap-2 overflow-hidden">
                            <i data-lucide="${icon}" class="w-3 h-3 ${colorClass} flex-shrink-0"></i>
                            <span class="text-xs text-slate-300 truncate">${item.name}</span>
                        </div>
                        <span class="text-xs font-mono font-bold ${colorClass}">${qty}${unit}</span>
                    </div>`;
                }).join('');
            } else {
                stockContainer.innerHTML = `<div class="text-center py-4 text-slate-500 text-xs flex items-center justify-center gap-2"><i data-lucide="check-circle" class="w-4 h-4 text-green-500"></i> Estoque Saudável</div>`;
            }
        }

        // --- 7. Mini Gráfico Financeiro (HTML/CSS) ---
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push(d.toISOString().slice(0, 7)); // '2023-10'
        }

        let maxVal = 0;
        const chartData = months.map(m => {
            const inc = transactions.filter(t => t.type === 'income' && t.date.startsWith(m)).reduce((a, b) => a + b.amount, 0);
            const exp = transactions.filter(t => t.type === 'expense' && t.date.startsWith(m)).reduce((a, b) => a + b.amount, 0);
            const val = Math.max(inc, exp);
            if (val > maxVal) maxVal = val;
            return { month: m.split('-')[1], income: inc, expense: exp };
        });

        const chartContainer = _('financial-history-chart');
        if (chartContainer) {
            chartContainer.innerHTML = chartData.map(d => {
                const hInc = maxVal > 0 ? (d.income / maxVal) * 100 : 0;
                const hExp = maxVal > 0 ? (d.expense / maxVal) * 100 : 0;
                return `
                <div class="flex-1 flex flex-col justify-end gap-1 group relative h-full">
                    <div class="w-full bg-green-500/20 hover:bg-green-500/40 rounded-t transition-all relative group-hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]" style="height: ${Math.max(4, hInc)}%">
                         <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-green-400 text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 border border-green-500/20 pointer-events-none transition-opacity">${fmtMoney(d.income)}</div>
                    </div>
                    <div class="w-full bg-red-500/20 hover:bg-red-500/40 rounded-t transition-all relative group-hover:shadow-[0_0_10px_rgba(239,68,68,0.3)]" style="height: ${Math.max(4, hExp)}%">
                         <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-red-400 text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 border border-red-500/20 pointer-events-none transition-opacity">${fmtMoney(d.expense)}</div>
                    </div>
                    <div class="text-[10px] text-slate-500 text-center mt-1 border-t border-white/5 pt-1 uppercase font-mono">${d.month}</div>
                </div>`;
            }).join('');
        }

        lucide.createIcons();
    }
}
