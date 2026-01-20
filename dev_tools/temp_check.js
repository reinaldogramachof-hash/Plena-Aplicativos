        // ESTADO GLOBAL
        const DB_KEY = 'plena_beauty_pro_v2';
        const defaultDB = {
            appointments: [],
            team: [
                { id: 'adm', name: 'Administrador (Dono)', commission: 0 }
            ],
            services: [
                { id: 's1', name: 'Corte Feminino', price: 80.00 },
                { id: 's2', name: 'Escova', price: 45.00 },
                { id: 's3', name: 'Hidratação Profunda', price: 90.00 },
                { id: 's4', name: 'Coloração', price: 150.00 },
                { id: 's5', name: 'Mechas / Luzes', price: 350.00 },
                { id: 's6', name: 'Botox Capilar', price: 180.00 },
                { id: 's7', name: 'Manicure', price: 35.00 },
                { id: 's8', name: 'Pedicure', price: 40.00 },
                { id: 's9', name: 'Spa dos Pés', price: 60.00 },
                { id: 's10', name: 'Design de Sobrancelhas', price: 40.00 },
                { id: 's11', name: 'Depilação Buço', price: 20.00 },
                { id: 's12', name: 'Maquiagem Social', price: 120.00 },
                { id: 's13', name: 'Limpeza de Pele', price: 100.00 }
            ],
            clients: [],
            transactions: [],
            settings: {
                businessName: '',
                businessOwner: '',
                businessDoc: '',
                businessHours: '09:00 às 19:00',
                theme: 'rose',
                termsAccepted: false,
                termsAcceptedAt: null
            },
            tutorial: {
                completedSteps: [],
                checklistState: {}
            }
        };
        let db = JSON.parse(localStorage.getItem(DB_KEY)) || defaultDB;
        if (!db.tutorial) db.tutorial = defaultDB.tutorial;
        // UTILITÁRIOS
        const sanitizeHTML = (str) => {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };
        const save = () => {
            localStorage.setItem(DB_KEY, JSON.stringify(db));
            updateDataStatus();
        };
        const fmtMoney = (v) => {
            return v.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        };
        const fmtDate = (d) => {
            if (!d) return '--/--/--';
            const date = new Date(d);
            return date.toLocaleDateString('pt-BR');
        };
        const fmtDateInput = (d) => {
            return new Date(d).toISOString().split('T')[0];
        };
        const getID = () => {
            return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        };
        const calculatePercentage = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous * 100).toFixed(1);
        };
        // INICIALIZAÇÃO
        function init() {
            lucide.createIcons();
            // Configurar datas padrão
            const today = new Date().toISOString().split('T')[0];
            const firstDay = new Date();
            firstDay.setDate(1);
            const firstDayStr = firstDay.toISOString().split('T')[0];
            // Configurar inputs de data
            document.getElementById('ap-date').value = today;
            document.getElementById('agenda-date').value = today;
            document.getElementById('exp-date').value = today;
            document.getElementById('rep-start').value = firstDayStr;
            document.getElementById('rep-end').value = today;
            document.getElementById('filter-start').value = firstDayStr;
            document.getElementById('filter-end').value = today;
            // Configurar business info
            document.getElementById('biz-name').value = db.settings.businessName || '';
            document.getElementById('biz-owner').value = db.settings.businessOwner || '';
            document.getElementById('biz-doc').value = db.settings.businessDoc || '';
            document.getElementById('biz-hours').value = db.settings.businessHours || '';
            // Bloquear campos se já preenchidos (Lógica de Travamento)
            if (db.settings.businessOwner && db.settings.businessDoc) {
                document.getElementById('biz-owner').disabled = true;
                document.getElementById('biz-doc').disabled = true;
                document.getElementById('biz-owner').classList.add('bg-gray-100', 'cursor-not-allowed');
                document.getElementById('biz-doc').classList.add('bg-gray-100', 'cursor-not-allowed');
            }
            // 🔐 VERIFICAÇÃO DE LICENÇA (Gatekeeper)
            injectWatermark();
            // Renderizar dados iniciais
            renderDashboard();
            updateDataStatus();
            updateTutorialProgress();
            renderChecklist();
            // Garantir que Lucide seja carregado
            if (window.lucide) {
                lucide.createIcons();
            } else {
                setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 500);
            }
            if (typeof updateTermsVisuals === 'function') updateTermsVisuals();
            // Configurar periodicidade para salvar
            setInterval(save, 30000); // Salva a cada 30 segundos
        }
        // ROTEAMENTO E NAVEGAÇÃO
        function router(view) {
            // Esconder todas as views
            document.querySelectorAll('.view-section').forEach(el => el.classList.add('hide'));
            // Remover classe active de todos os nav items
            document.querySelectorAll('.nav-item').forEach(el => {
                el.classList.remove('bg-white/10', 'text-white');
                el.classList.add('text-gray-400');
            });
            // Mostrar view selecionada
            const viewElement = document.getElementById(`view-${view}`);
            if (viewElement) {
                viewElement.classList.remove('hide');
                viewElement.classList.add('fade-in');
            }
            // Ativar nav item selecionado
            const navElement = document.getElementById(`nav-${view}`);
            if (navElement) {
                navElement.classList.add('bg-white/10', 'text-white');
                navElement.classList.remove('text-gray-400');
            }
            // Atualizar título da página
            const titles = {
                dashboard: 'Agenda',
                team: 'Profissionais',
                services: 'Serviços',
                finance: 'Financeiro',
                clients: 'Clientes',
                reports: 'Relatórios',
                settings: 'Configurações',
                instructions: 'Manual de Uso',
                about: 'Sobre a Plena'
            };
            document.getElementById('page-title').innerText = titles[view] || 'Plena Beleza';
            // Fechar sidebar no mobile
            if (window.innerWidth < 1024) {
                toggleSidebar();
            }
            // Renderizar dados específicos da view
            if (view === 'dashboard') {
                renderDashboard();
            } else if (view === 'team') {
                renderTeam();
            } else if (view === 'services') {
                renderServices();
            } else if (view === 'finance') {
                renderFinance();
            } else if (view === 'clients') {
                renderClients();
            }
        }
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('overlay');
            sidebar.classList.toggle('open');
            overlay.classList.toggle('hidden');
            // Bloquear scroll do body quando sidebar aberta
            document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
        }
        // DASHBOARD
        function renderDashboard() {
            const date = document.getElementById('agenda-date').value;
            const todayAppts = db.appointments
                .filter(a => a.date === date)
                .sort((a, b) => a.time.localeCompare(b.time));
            // Calcular estatísticas
            const todayStr = new Date().toISOString().split('T')[0];
            const todayTrans = db.transactions.filter(t => t.date === todayStr);
            const incomeToday = todayTrans
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            const expenseToday = todayTrans
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            const commissionPending = db.transactions
                .filter(t => t.type === 'income' && !t.commissionPaid)
                .reduce((sum, t) => sum + (t.commission || 0), 0);
            // Atualizar KPI cards
            document.getElementById('dash-appt-today').innerText = db.appointments
                .filter(a => a.date === todayStr && a.status === 'pending').length;
            document.getElementById('dash-rev-today').innerText = fmtMoney(incomeToday);
            document.getElementById('dash-comm-pending').innerText = fmtMoney(commissionPending);
            // Calcular crescimento vs ontem
            const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            const yesterdayIncome = db.transactions
                .filter(t => t.date === yesterdayStr && t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            const growth = calculatePercentage(incomeToday, yesterdayIncome);
            document.getElementById('rev-growth').innerText = `${growth}%`;
            // Renderizar agenda
            const agendaList = document.getElementById('agenda-list');
            if (todayAppts.length === 0) {
                agendaList.innerHTML = `
                    <div class="text-center py-8">
                        <i data-lucide="calendar-x" class="w-12 h-12 mx-auto mb-4 text-gray-300"></i>
                        <p class="text-gray-400">Nenhum agendamento para esta data</p>
                    </div>
                `;
            } else {
                agendaList.innerHTML = todayAppts.map(appt => `
                    <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center ${appt.status === 'canceled' ? 'opacity-60' : ''}">
                        <div class="flex items-center gap-4">
                            <div class="bg-white px-3 py-2 rounded-lg border text-center min-w-[70px]">
                                <span class="block font-bold text-lg text-gray-800">${appt.time}</span>
                            </div>
                            <div>
                                <h4 class="font-bold text-gray-900">${appt.client}</h4>
                                <p class="text-xs text-gray-500">
                                    ${appt.serviceName} com <strong>${appt.proName}</strong>
                                </p>
                                <span class="inline-block mt-1 px-2 py-1 text-xs rounded-full ${appt.status === 'pending' ? 'badge-pending' : appt.status === 'done' ? 'badge-done' : 'badge-canceled'}">
                                    ${appt.status === 'pending' ? 'Pendente' : appt.status === 'done' ? 'Concluído' : 'Cancelado'}
                                </span>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            ${appt.status === 'pending' ? `
                                <button onclick="cancelAppt('${appt.id}')" class="p-2 text-gray-400 hover:text-red-500" title="Cancelar">
                                    <i data-lucide="x" class="w-5 h-5"></i>
                                </button>
                                <button onclick="finishAppt('${appt.id}')" class="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200" title="Finalizar">
                                    <i data-lucide="check" class="w-5 h-5"></i>
                                </button>
                            ` : ''}
                            ${appt.status === 'done' ? `
                                <span class="text-green-600 text-sm font-bold">${fmtMoney(appt.price)}</span>
                            ` : ''}
                        </div>
                    </div>
                `).join('');
            }
            // Renderizar próximos agendamentos
            const upcoming = db.appointments
                .filter(a => a.status === 'pending' && a.date >= todayStr)
                .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
                .slice(0, 3);
            const upcomingList = document.getElementById('upcoming-appts');
            if (upcoming.length === 0) {
                upcomingList.innerHTML = '<p class="text-center text-gray-400 py-4">Nenhum agendamento futuro</p>';
            } else {
                upcomingList.innerHTML = upcoming.map(appt => `
                    <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                            <p class="text-sm font-medium text-gray-800">${appt.client}</p>
                            <p class="text-xs text-gray-500">${fmtDate(appt.date)} às ${appt.time}</p>
                        </div>
                        <span class="text-sm text-plena-rose font-bold">${appt.serviceName}</span>
                    </div>
                `).join('');
            }
            lucide.createIcons();
        }
        // TEAM MANAGEMENT
        function renderTeam() {
            const container = document.getElementById('team-list');
            if (db.team.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-8">
                        <i data-lucide="users" class="w-12 h-12 mx-auto mb-4 text-gray-300"></i>
                        <p class="text-gray-400">Nenhum profissional cadastrado</p>
                    </div>
                `;
                return;
            }
            container.innerHTML = db.team.map(pro => {
                const pendingCommissions = db.transactions
                    .filter(t => t.proId === pro.id && t.type === 'income' && !t.commissionPaid)
                    .reduce((sum, t) => sum + (t.commission || 0), 0);
                const completedServices = db.transactions
                    .filter(t => t.proId === pro.id && t.type === 'income')
                    .length;
                return `
                    <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm card-hover">
                        <div class="flex justify-between items-start mb-4">
                            <div class="bg-plena-rose/10 p-3 rounded-full text-plena-rose">
                                <i data-lucide="user" class="w-6 h-6"></i>
                            </div>
                            <span class="text-xs font-bold bg-gray-100 px-2 py-1 rounded">
                                Comissão: ${pro.commission}%
                            </span>
                        </div>
                        <h3 class="font-bold text-lg text-gray-800 mb-2">${pro.name}</h3>
                        <div class="mt-4 space-y-3">
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-500">Serviços realizados:</span>
                                <span class="font-bold">${completedServices}</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-500">Comissões pendentes:</span>
                                <span class="font-bold text-plena-rose">${fmtMoney(pendingCommissions)}</span>
                            </div>
                        </div>
                        <div class="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                            <button onclick="payCommission('${pro.id}')" 
                                    class="text-sm font-bold text-plena-rose hover:text-plena-dark ${pendingCommissions === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
                                    ${pendingCommissions === 0 ? 'disabled' : ''}>
                                Pagar Comissão
                            </button>
                            <button onclick="editTeam('${pro.id}')" 
                                    class="text-gray-400 hover:text-gray-600">
                                <i data-lucide="edit" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            lucide.createIcons();
        }
        // SERVICES MANAGEMENT
        function renderServices() {
            const container = document.getElementById('services-list');
            if (db.services.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-8">
                        <i data-lucide="sparkles" class="w-12 h-12 mx-auto mb-4 text-gray-300"></i>
                        <p class="text-gray-400">Nenhum serviço cadastrado</p>
                    </div>
                `;
                return;
            }
            container.innerHTML = db.services.map(service => {
                const serviceCount = db.transactions
                    .filter(t => t.serviceId === service.id)
                    .length;
                return `
                    <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center card-hover">
                        <div>
                            <span class="font-bold text-gray-800">${service.name}</span>
                            <p class="text-xs text-gray-500 mt-1">${serviceCount} realizados</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="font-bold text-plena-rose">${fmtMoney(service.price)}</span>
                            <button onclick="editService('${service.id}')" 
                                    class="text-gray-400 hover:text-gray-600">
                                <i data-lucide="edit" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            lucide.createIcons();
        }
        // FINANCE MANAGEMENT
        function renderFinance() {
            const term = document.getElementById('search-term').value.toLowerCase();
            const filter = document.getElementById('filter-type').value;
            const start = document.getElementById('filter-start').value;
            const end = document.getElementById('filter-end').value;
            // Filtrar transações
            let filtered = db.transactions.filter(t => {
                const matchesTerm = t.description.toLowerCase().includes(term) ||
                    (t.proName && t.proName.toLowerCase().includes(term));
                const matchesType = filter === 'all' || t.type === filter;
                const matchesDate = (!start || t.date >= start) && (!end || t.date <= end);
                return matchesTerm && matchesType && matchesDate;
            });
            // Ordenar por data (mais recente primeiro)
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
            // Atualizar estatísticas
            const monthTrans = db.transactions.filter(t => {
                const today = new Date();
                const transDate = new Date(t.date);
                return transDate.getMonth() === today.getMonth() &&
                    transDate.getFullYear() === today.getFullYear();
            });
            const incomeMonth = monthTrans
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            const expenseMonth = monthTrans
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            const commissionMonth = monthTrans
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (t.commission || 0), 0);
            document.getElementById('fin-income').textContent = fmtMoney(incomeMonth);
            document.getElementById('fin-expense').textContent = fmtMoney(expenseMonth);
            document.getElementById('fin-commission').textContent = fmtMoney(commissionMonth);
            // Atualizar tabela
            const tbody = document.getElementById('trans-list');
            const emptyMsg = document.getElementById('empty-msg');
            if (filtered.length === 0) {
                tbody.innerHTML = '';
                emptyMsg.classList.remove('hidden');
                return;
            }
            emptyMsg.classList.add('hidden');
            tbody.innerHTML = filtered.map(t => {
                const isIncome = t.type === 'income';
                return `
                    <tr class="hover:bg-gray-50 group border-b border-gray-100">
                        <td class="px-6 py-4 text-gray-500 whitespace-nowrap">${fmtDate(t.date)}</td>
                        <td class="px-6 py-4">
                            <div class="font-medium text-gray-800">${t.description}</div>
                            ${t.category ? `<div class="text-xs text-gray-400">${t.category}</div>` : ''}
                        </td>
                        <td class="px-6 py-4">${t.proName || '-'}</td>
                        <td class="px-6 py-4">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isIncome ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${isIncome ? 'Entrada' : 'Saída'}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-right font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}">
                            ${isIncome ? '+' : '-'} ${fmtMoney(t.amount)}
                        </td>
                        <td class="px-6 py-4 text-right text-sm text-gray-500">
                            ${t.commission ? fmtMoney(t.commission) : '-'}
                        </td>
                    </tr>
                `;
            }).join('');
            lucide.createIcons();
        }
        // CLIENTS MANAGEMENT
        function renderClients() {
            const container = document.getElementById('clients-list');
            if (db.clients.length === 0) {
                container.innerHTML = `
                    <tr>
                        <td colspan="5" class="px-6 py-8 text-center text-gray-400">
                            <i data-lucide="user" class="w-12 h-12 mx-auto mb-4 text-gray-300"></i>
                            <p>Nenhum cliente cadastrado</p>
                        </td>
                    </tr>
                `;
                return;
            }
            container.innerHTML = db.clients.map(client => {
                const clientTrans = db.transactions
                    .filter(t => t.clientId === client.id && t.type === 'income');
                const totalSpent = clientTrans.reduce((sum, t) => sum + t.amount, 0);
                const lastVisit = clientTrans.length > 0
                    ? clientTrans.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
                    : null;
                return `
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 font-medium text-gray-800">${client.name}</td>
                        <td class="px-6 py-4 text-gray-600">${client.phone || '-'}</td>
                        <td class="px-6 py-4 text-gray-500">${lastVisit ? fmtDate(lastVisit) : 'Nunca'}</td>
                        <td class="px-6 py-4 font-bold text-plena-rose">${fmtMoney(totalSpent)}</td>
                        <td class="px-6 py-4 text-center">
                            <button onclick="editClient('${client.id}')" 
                                    class="text-gray-400 hover:text-plena-rose">
                                <i data-lucide="edit" class="w-4 h-4"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
            lucide.createIcons();
        }
        // MODAIS E FORMULÁRIOS
        function openApptModal() {
            // Carregar Serviços
            const svcSelect = document.getElementById('ap-service');
            svcSelect.innerHTML = '<option value="">Selecione o Serviço...</option>';
            db.services.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.text = `${s.name} - ${fmtMoney(s.price)}`;
                opt.dataset.price = s.price;
                svcSelect.appendChild(opt);
            });
            // Carregar Profissionais
            const proSelect = document.getElementById('ap-pro');
            proSelect.innerHTML = '<option value="">Selecione o Profissional...</option>';
            db.team.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.text = p.name;
                proSelect.appendChild(opt);
            });
            // Resetar campos
            document.getElementById('ap-id').value = '';
            document.getElementById('ap-client').value = '';
            document.getElementById('ap-time').value = '';
            document.getElementById('ap-display-val').textContent = 'R$ 0,00';
            document.getElementById('apptModal').classList.remove('hidden');
        }
        function updateApptValue() {
            const svcSelect = document.getElementById('ap-service');
            const price = svcSelect.options[svcSelect.selectedIndex].dataset.price || 0;
            document.getElementById('ap-display-val').textContent = fmtMoney(parseFloat(price));
        }
        function openTeamModal(professional = null) {
            if (professional) {
                document.getElementById('tm-id').value = professional.id;
                document.getElementById('tm-name').value = professional.name;
                document.getElementById('tm-comm').value = professional.commission;
            } else {
                document.querySelector('#teamModal form').reset();
                document.getElementById('tm-id').value = '';
            }
            document.getElementById('teamModal').classList.remove('hidden');
        }
        function openServiceModal(service = null) {
            if (service) {
                document.getElementById('svc-id').value = service.id;
                document.getElementById('svc-name').value = service.name;
                document.getElementById('svc-price').value = service.price;
            } else {
                document.querySelector('#serviceModal form').reset();
                document.getElementById('svc-id').value = '';
            }
            document.getElementById('serviceModal').classList.remove('hidden');
        }
        function openExpenseModal() {
            document.querySelector('#expenseModal form').reset();
            document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('expenseModal').classList.remove('hidden');
        }
        function openClientModal(client = null) {
            if (client) {
                document.getElementById('cli-id').value = client.id;
                document.getElementById('cli-name').value = client.name;
                document.getElementById('cli-phone').value = client.phone || '';
                document.getElementById('cli-email').value = client.email || '';
                document.getElementById('cli-notes').value = client.notes || '';
            } else {
                document.querySelector('#clientModal form').reset();
                document.getElementById('cli-id').value = '';
            }
            document.getElementById('clientModal').classList.remove('hidden');
        }
        function openClosingModal() {
            const today = new Date().toISOString().split('T')[0];
            const todayTrans = db.transactions.filter(t => t.date === today);
            const incomeToday = todayTrans
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            const expenseToday = todayTrans
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            const commissionToday = todayTrans
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (t.commission || 0), 0);
            const balanceToday = incomeToday - expenseToday - commissionToday;
            document.getElementById('close-inc').textContent = fmtMoney(incomeToday);
            document.getElementById('close-exp').textContent = fmtMoney(expenseToday);
            document.getElementById('close-com').textContent = fmtMoney(commissionToday);
            document.getElementById('close-bal').textContent = fmtMoney(balanceToday);
            document.getElementById('close-date').textContent = fmtDate(today);
            document.getElementById('close-time').textContent = new Date().toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            document.getElementById('closingModal').classList.remove('hidden');
        }
        function openModal(modalId) {
            document.getElementById(modalId).classList.remove('hidden');
        }
        function closeModal(modalId) {
            document.getElementById(modalId).classList.add('hidden');
        }
        function updateApptValue() {
            const sel = document.getElementById('ap-service');
            const price = parseFloat(sel.options[sel.selectedIndex]?.getAttribute('data-price')) || 0;
            document.getElementById('ap-display-val').innerText = fmtMoney(price);
        }
        // CRUD OPERATIONS
        function submitAppt(e) {
            e.preventDefault();
            const id = document.getElementById('ap-id').value;
            const client = document.getElementById('ap-client').value.trim();
            const date = document.getElementById('ap-date').value;
            const time = document.getElementById('ap-time').value;
            const serviceId = document.getElementById('ap-service').value;
            const proId = document.getElementById('ap-pro').value;
            const service = db.services.find(s => s.id === serviceId);
            const professional = db.team.find(t => t.id === proId);
            if (!client || !service || !professional) {
                showNotification('Por favor, preencha todos os campos corretamente.', 'error');
                return;
            }
            const appointment = {
                id: id || getID(),
                client,
                date,
                time,
                serviceId,
                serviceName: service.name,
                proId,
                proName: professional.name,
                price: service.price,
                status: 'pending',
                commissionPct: professional.commission,
                commissionVal: service.price * (professional.commission / 100)
            };
            if (id) {
                // Editar
                const index = db.appointments.findIndex(a => a.id === id);
                if (index !== -1) {
                    db.appointments[index] = appointment;
                }
            } else {
                // Adicionar
                db.appointments.push(appointment);
            }
            save();
            closeModal('apptModal');
            renderDashboard();
            showNotification('Agendamento salvo com sucesso!', 'success');
        }
        function submitTeam(e) {
            e.preventDefault();
            const id = document.getElementById('tm-id').value;
            const name = document.getElementById('tm-name').value.trim();
            const commission = parseFloat(document.getElementById('tm-comm').value) || 0;
            if (!name) {
                showNotification('Por favor, insira o nome do profissional.', 'error');
                return;
            }
            const professional = {
                id: id || getID(),
                name,
                commission
            };
            if (id) {
                const index = db.team.findIndex(t => t.id === id);
                if (index !== -1) {
                    db.team[index] = professional;
                }
            } else {
                db.team.push(professional);
            }
            save();
            closeModal('teamModal');
            renderTeam();
            showNotification('Profissional salvo com sucesso!', 'success');
        }
        function submitService(e) {
            e.preventDefault();
            const id = document.getElementById('svc-id').value;
            const name = document.getElementById('svc-name').value.trim();
            const price = parseFloat(document.getElementById('svc-price').value) || 0;
            if (!name || price <= 0) {
                showNotification('Por favor, preencha todos os campos corretamente.', 'error');
                return;
            }
            const service = {
                id: id || getID(),
                name,
                price
            };
            if (id) {
                const index = db.services.findIndex(s => s.id === id);
                if (index !== -1) {
                    db.services[index] = service;
                }
            } else {
                db.services.push(service);
            }
            save();
            closeModal('serviceModal');
            renderServices();
            showNotification('Serviço salvo com sucesso!', 'success');
        }
        function submitExpense(e) {
            e.preventDefault();
            const type = document.getElementById('exp-type').value;
            const description = document.getElementById('exp-desc').value.trim();
            const amount = parseFloat(document.getElementById('exp-amount').value) || 0;
            const date = document.getElementById('exp-date').value;
            const category = document.getElementById('exp-category').value;
            if (!description || amount <= 0) {
                showNotification('Por favor, preencha todos os campos corretamente.', 'error');
                return;
            }
            const transaction = {
                id: getID(),
                type: type, // 'income' or 'expense'
                description,
                amount,
                date,
                category
            };
            db.transactions.push(transaction);
            save();
            closeModal('expenseModal');
            if (document.getElementById('view-finance').classList.contains('hide') === false) {
                renderFinance();
            }
            const msg = type === 'income' ? 'Receita registrada!' : 'Despesa registrada!';
            showNotification(msg, 'success');
        }
        function submitClient(e) {
            e.preventDefault();
            const id = document.getElementById('cli-id').value;
            const name = document.getElementById('cli-name').value.trim();
            const phone = document.getElementById('cli-phone').value.trim();
            const email = document.getElementById('cli-email').value.trim();
            const notes = document.getElementById('cli-notes').value.trim();
            if (!name) {
                showNotification('Por favor, insira o nome do cliente.', 'error');
                return;
            }
            const client = {
                id: id || getID(),
                name,
                phone: phone || null,
                email: email || null,
                notes: notes || null,
                createdAt: new Date().toISOString()
            };
            if (id) {
                const index = db.clients.findIndex(c => c.id === id);
                if (index !== -1) {
                    db.clients[index] = client;
                }
            } else {
                db.clients.push(client);
            }
            save();
            closeModal('clientModal');
            renderClients();
            showNotification('Cliente salvo com sucesso!', 'success');
        }
        // APPOINTMENT ACTIONS
        function finishAppt(id) {
            showCustomConfirm('Finalizar Atendimento', 'Finalizar atendimento e lançar no caixa?', () => {
                const index = db.appointments.findIndex(a => a.id === id);
                if (index === -1) return;
                const appt = db.appointments[index];
                appt.status = 'done';
                // Criar transação de entrada
                const incomeTransaction = {
                    id: getID(),
                    type: 'income',
                    description: `Serviço: ${appt.serviceName} - ${appt.client}`,
                    amount: appt.price,
                    date: appt.date,
                    proId: appt.proId,
                    proName: appt.proName,
                    serviceId: appt.serviceId,
                    clientId: findOrCreateClient(appt.client),
                    commission: appt.commissionVal
                };
                db.transactions.push(incomeTransaction);
                save();
                renderDashboard();
                showNotification('Atendimento finalizado e lançado no caixa!', 'success');
            }, false);
        }
        function cancelAppt(id) {
            showCustomConfirm('Cancelar Agendamento', 'Cancelar este agendamento?', () => {
                const index = db.appointments.findIndex(a => a.id === id);
                if (index !== -1) {
                    db.appointments[index].status = 'canceled';
                    save();
                    renderDashboard();
                    showNotification('Agendamento cancelado!', 'success');
                }
            }, true);
        }
        function findOrCreateClient(name) {
            let client = db.clients.find(c => c.name.toLowerCase() === name.toLowerCase());
            if (!client) {
                client = {
                    id: getID(),
                    name,
                    createdAt: new Date().toISOString()
                };
                db.clients.push(client);
            }
            return client.id;
        }
        // COMMISSIONS
        let currentCommissionData = null;
        function payCommission(proId) {
            const pendingTransactions = db.transactions.filter(t =>
                t.proId === proId && t.type === 'income' && !t.commissionPaid
            );
            if (pendingTransactions.length === 0) {
                if (pendingTransactions.length === 0) {
                    showNotification('Não há comissões pendentes para este profissional.', 'warning');
                    return;
                }
            }
            const totalCommission = pendingTransactions.reduce((sum, t) => sum + (t.commission || 0), 0);
            const professional = db.team.find(t => t.id === proId);
            // Store data for the modal actions
            currentCommissionData = {
                proId: proId,
                proName: professional.name,
                amount: totalCommission,
                date: new Date().toISOString().split('T')[0]
            };
            // Fill Modal
            document.getElementById('comm-pro-name').innerText = professional.name;
            document.getElementById('comm-value').innerText = fmtMoney(totalCommission);
            // Show Modal
            document.getElementById('commissionModal').classList.remove('hidden');
        }
        function confirmCommissionPayment() {
            if (!currentCommissionData) return;
            // Generate Expense
            const expenseTransaction = {
                id: getID(),
                description: `Pagamento Comissão: ${currentCommissionData.proName}`,
                amount: currentCommissionData.amount,
                date: currentCommissionData.date,
                category: 'comissao'
            };
            db.transactions.push(expenseTransaction);
            // Mark transactions as paid
            db.transactions.forEach(t => {
                if (t.proId === currentCommissionData.proId && t.type === 'income' && !t.commissionPaid) {
                    t.commissionPaid = true;
                    t.commissionPaidDate = currentCommissionData.date;
                }
            });
            save();
            renderFinance(); // Ensure finance view updates if active
            renderTeam();    // Refresh team list to disable button
            closeModal('commissionModal');
            showNotification('Comissão paga com sucesso!', 'success');
            currentCommissionData = null;
        }
        function shareCommissionWhatsApp() {
            if (!currentCommissionData) return;
            const salonName = db.settings.businessName || 'PLENA BELEZA';
            let msg = `💰 *PAGAMENTO DE COMISSÃO*\n`;
            msg += `🏢 ${salonName.toUpperCase()}\n`;
            msg += `📅 ${fmtDate(currentCommissionData.date)}\n`;
            msg += `--------------------------------\n`;
            msg += `👤 Profissional: *${currentCommissionData.proName}*\n`;
            msg += `💵 Valor Pago: *${fmtMoney(currentCommissionData.amount)}*\n`;
            msg += `--------------------------------\n`;
            msg += `✅ *PAGAMENTO CONFIRMADO*`;
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
        }
        function printCommissionReceipt() {
            if (!currentCommissionData) return;
            const salonName = db.settings.businessName || 'SALÃO DE BELEZA';
            const dateStr = new Date().toLocaleDateString('pt-BR');
            const receiptHTML = `
                <div style="padding: 40px; font-family: sans-serif; max-width: 800px; margin: 0 auto; border: 2px solid #000;">
                    <h1 style="text-align: center; margin-bottom: 30px;">RECIBO DE PAGAMENTO DE COMISSÃO</h1>
                    <p style="margin-bottom: 20px; font-size: 14px;">
                        <strong>EMPREGADOR:</strong> ${salonName.toUpperCase()}<br>
                        <strong>DATA:</strong> ${dateStr}
                    </p>
                    <p style="font-size: 16px; line-height: 1.6; text-align: justify; margin-bottom: 40px;">
                        Eu, <strong>${currentCommissionData.proName.toUpperCase()}</strong>, declaro que recebi do estabelecimento 
                        <strong>${salonName.toUpperCase()}</strong> a importância líquida de 
                        <strong>${fmtMoney(currentCommissionData.amount)}</strong>, referente ao pagamento das comissões 
                        pelos serviços prestados.
                    </p>
                    <p style="text-align: center; margin-bottom: 15px; font-size: 18px; font-weight: bold;">
                        VALOR RECEBIDO: ${fmtMoney(currentCommissionData.amount)}
                    </p>
                    <div style="margin-top: 80px; text-align: center;">
                        <div style="border-top: 1px solid #000; display: inline-block; width: 300px; padding-top: 5px;">
                            Assinatura do Profissional
                        </div>
                    </div>
                </div>
             `;
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            iframe.contentDocument.write(receiptHTML);
            iframe.contentDocument.close();
            iframe.contentWindow.print();
            // Cleanup after a delay
            setTimeout(() => iframe.remove(), 2000);
        }
        // EDIT FUNCTIONS
        function editTeam(id) {
            if (professional) {
                openTeamModal(professional);
            }
        }
        function editService(id) {
            const service = db.services.find(s => s.id === id);
            if (service) {
                openServiceModal(service);
            }
        }
        function editClient(id) {
            const client = db.clients.find(c => c.id === id);
            if (client) {
                openClientModal(client);
            }
        }
        // REPORTS
        function generateReport() {
            const start = document.getElementById('rep-start').value;
            const end = document.getElementById('rep-end').value;
            if (!start || !end) {
                showNotification('Por favor, selecione um período.', 'error');
                return;
            }
            const transactions = db.transactions.filter(t => t.date >= start && t.date <= end);
            const income = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            const expense = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            const commission = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (t.commission || 0), 0);
            document.getElementById('rep-inc').textContent = fmtMoney(income);
            document.getElementById('rep-exp').textContent = fmtMoney(expense);
            document.getElementById('rep-com').textContent = fmtMoney(commission);
            // Top services
            renderTopServicesReport(transactions);
            document.getElementById('report-result').classList.remove('hide');
        }
        function generateMonthReport() {
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            document.getElementById('rep-start').value = firstDay.toISOString().split('T')[0];
            document.getElementById('rep-end').value = lastDay.toISOString().split('T')[0];
            generateReport();
        }
        function renderTopServicesReport(transactions) {
            const serviceMap = {};
            transactions
                .filter(t => t.type === 'income' && t.serviceId)
                .forEach(t => {
                    const service = db.services.find(s => s.id === t.serviceId);
                    if (service) {
                        if (!serviceMap[service.name]) {
                            serviceMap[service.name] = { count: 0, total: 0 };
                        }
                        serviceMap[service.name].count++;
                        serviceMap[service.name].total += t.amount;
                    }
                });
            const topServices = Object.entries(serviceMap)
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, 5);
            const container = document.getElementById('top-services');
            if (topServices.length === 0) {
                container.innerHTML = '<p class="text-gray-400 text-center">Sem dados para o período</p>';
                return;
            }
            container.innerHTML = topServices.map(([name, data]) => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p class="text-sm font-medium text-gray-800">${name}</p>
                        <p class="text-xs text-gray-500">${data.count} serviços</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-bold text-green-600">${fmtMoney(data.total)}</p>
                        <p class="text-xs text-gray-500">${data.count > 0 ? fmtMoney(data.total / data.count) : 'R$ 0,00'} (média)</p>
                    </div>
                </div>
            `).join('');
        }
        // EXPORTAÇÃO E COMPARTILHAMENTO
        function shareReport() {
            const inc = document.getElementById('rep-inc').textContent;
            const exp = document.getElementById('rep-exp').textContent;
            const com = document.getElementById('rep-com').textContent;
            const salonName = db.settings.businessName || 'PLENA BELEZA';
            const date = document.getElementById('rep-start').value === document.getElementById('rep-end').value
                ? fmtDate(document.getElementById('rep-start').value)
                : `${fmtDate(document.getElementById('rep-start').value)} a ${fmtDate(document.getElementById('rep-end').value)}`;
            let msg = `📊 *RELATÓRIO FINANCEIRO* 📊\n`;
            msg += `🏢 ${salonName.toUpperCase()}\n`;
            msg += `📅 Período: ${date}\n`;
            msg += `--------------------------------\n`;
            msg += `💰 Faturamento: *${inc}*\n`;
            msg += `🔻 Despesas: ${exp}\n`;
            msg += `👛 Comissões: ${com}\n`;
            msg += `--------------------------------\n`;
            msg += `_Gerado por Plena Beleza_`;
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
        }
        function shareClosing() {
            const inc = document.getElementById('close-inc').textContent;
            const exp = document.getElementById('close-exp').textContent;
            const com = document.getElementById('close-com').textContent;
            const bal = document.getElementById('close-bal').textContent;
            const date = new Date().toLocaleDateString('pt-BR');
            const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const salonName = db.settings.businessName || 'PLENA BELEZA';
            let msg = `🔒 *FECHAMENTO DE CAIXA* 🔒\n`;
            msg += `🏢 *${salonName.toUpperCase()}*\n`;
            msg += `📅 Data: ${date} às ${time}\n`;
            msg += `--------------------------------\n`;
            msg += `📈 *RESUMO FINANCEIRO*\n`;
            msg += `💰 Entradas: *${inc}*\n`;
            msg += `🔻 Despesas: ${exp}\n`;
            msg += `👥 Comissões: ${com}\n`;
            msg += `--------------------------------\n`;
            msg += `✨ *SALDO FINAL: ${bal}*\n`;
            msg += `--------------------------------\n`;
            msg += `_Documento de conferência interna_`;
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
        }
        function printClosing() {
            const inc = document.getElementById('close-inc').textContent;
            const exp = document.getElementById('close-exp').textContent;
            const com = document.getElementById('close-com').textContent;
            const bal = document.getElementById('close-bal').textContent;
            const salonName = db.settings.businessName || 'PLENA BELEZA';
            const dateStr = new Date().toLocaleDateString('pt-BR');
            const timeStr = new Date().toLocaleTimeString('pt-BR');
            const receiptHTML = `
                <div style="font-family: 'Courier New', monospace; padding: 40px; max-width: 800px; margin: 0 auto; color: #000;">
                    <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 20px; margin-bottom: 30px;">
                        <h1 style="margin: 0; font-size: 24px; text-transform: uppercase;">${salonName}</h1>
                        <p style="margin: 5px 0; font-size: 14px;">RELATÓRIO DE FECHAMENTO DE CAIXA</p>
                        <p style="margin: 5px 0; font-size: 12px;">Data: ${dateStr} - Hora: ${timeStr}</p>
                    </div>
                    <div style="margin-bottom: 30px;">
                        <h3 style="border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 15px;">RESUMO FINANCEIRO</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">(+) Total de Entradas</td>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${inc}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">(-) Despesas Operacionais</td>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${exp}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">(-) Comissões Pagas/Previstas</td>
                                <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${com}</td>
                            </tr>
                            <tr style="font-size: 18px;">
                                <td style="padding: 15px 0; font-weight: bold;">(=) SALDO EM CAIXA</td>
                                <td style="padding: 15px 0; text-align: right; font-weight: bold;">${bal}</td>
                            </tr>
                        </table>
                    </div>
                    <div style="margin-top: 50px;">
                        <div style="border: 1px solid #000; padding: 15px; font-size: 12px; text-align: center; margin-bottom: 50px;">
                            <p style="font-weight: bold; margin-bottom: 5px;">DECLARAÇÃO DE CONFERÊNCIA</p>
                            <p>Declaro que os valores acima conferem com o numerário físico e comprovantes em caixa nesta data.</p>
                        </div>
                        <div style="display: flex; justify-content: space-between; gap: 40px;">
                            <div style="flex: 1; text-align: center;">
                                <div style="border-top: 1px solid #000; padding-top: 10px;">
                                    Responsável pelo Caixa
                                </div>
                            </div>
                            <div style="flex: 1; text-align: center;">
                                <div style="border-top: 1px solid #000; padding-top: 10px;">
                                    Gerência / Auditoria
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #666; border-top: 1px dotted #ccc; padding-top: 10px;">
                        Documento gerado eletronicamente por Plena Beleza V4 Pro<br>
                        ${new Date().toLocaleString('pt-BR')}
                    </div>
                </div>
            `;
            // 3. Criar Iframe Invisível (Técnica Robusta)
            const iframe = document.createElement('iframe');
            // Posicionamento fora da tela (melhor que display:none para impressão)
            iframe.style.position = 'absolute';
            iframe.style.left = '-9999px';
            iframe.style.top = '0';
            iframe.style.width = '1px';
            iframe.style.height = '1px';
            document.body.appendChild(iframe);
            // 4. Escrever e Imprimir
            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(receiptHTML);
            doc.close();
            // Executar com pequeno delay para garantir renderização das fontes
            setTimeout(() => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                // Limpeza após impressão
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 2000);
            }, 500);
        }
        function updatePrintHeaders() {
            const s = db.settings;
            // Header estilo Beleza
            const headerHTML = `
                <div class="print-header">
                    <h2 style="font-size: 24px; font-weight: bold; color: #E11D48; margin-bottom: 5px; text-transform: uppercase;">${s.businessName || 'SALÃO DE BELEZA'}</h2>
                    <p style="font-size: 12px; color: #666; text-transform: uppercase;">${s.businessHours || ''}</p>
                </div>
            `;
            const containers = [
                document.getElementById('report-result')
            ];
            containers.forEach(container => {
                if (!container) return;
                const existing = container.querySelector('.print-header');
                if (existing) existing.outerHTML = headerHTML;
                else container.insertAdjacentHTML('afterbegin', headerHTML);
            });
        }
        function downloadReportPDF() {
            showNotification('Na janela de impressão, selecione "Salvar como PDF".', 'info');
            setTimeout(printReport, 1000);
        }
        function printReport() {
            updatePrintHeaders();
            window.print();
        }
        function printFinanceReport() {
            updatePrintHeaders();
            window.print();
        }
        // SETTINGS
        function saveBusinessInfo() {
            const name = document.getElementById('biz-name').value.trim();
            const owner = document.getElementById('biz-owner').value.trim();
            const doc = document.getElementById('biz-doc').value.replace(/\D/g, ''); // Remove non-digits
            const hours = document.getElementById('biz-hours').value.trim();
            if (!name || !owner || !doc) {
                showNotification('Preencha Nome do Salão, Responsável e CPF/CNPJ.', 'error');
                return;
            }
            // Validação de CPF ou CNPJ
            if (doc.length === 11) {
                if (!validateCPF(doc)) {
                    showNotification('CPF inválido. Verifique os números.', 'error');
                    return;
                }
            } else if (doc.length === 14) {
                if (!validateCNPJ(doc)) {
                    showNotification('CNPJ inválido. Verifique os números.', 'error');
                    return;
                }
            } else {
                showNotification('Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos.', 'error');
                return;
            }
            db.settings.businessName = name;
            db.settings.businessOwner = owner;
            db.settings.businessDoc = doc;
            db.settings.businessHours = hours;
            save();
            // Bloquear campos visualmente
            document.getElementById('biz-owner').disabled = true;
            document.getElementById('biz-doc').disabled = true;
            document.getElementById('biz-owner').classList.add('bg-gray-100', 'cursor-not-allowed');
            document.getElementById('biz-doc').classList.add('bg-gray-100', 'cursor-not-allowed');
            showNotification('Informações salvas e registradas com sucesso!', 'success');
        }
        // VALIDATORS
        function validateCPF(cpf) {
            let sum = 0;
            let remainder;
            if (cpf === "00000000000") return false;
            for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
            remainder = (sum * 10) % 11;
            if ((remainder === 10) || (remainder === 11)) remainder = 0;
            if (remainder !== parseInt(cpf.substring(9, 10))) return false;
            sum = 0;
            for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
            remainder = (sum * 10) % 11;
            if ((remainder === 10) || (remainder === 11)) remainder = 0;
            if (remainder !== parseInt(cpf.substring(10, 11))) return false;
            return true;
        }
        function validateCNPJ(cnpj) {
            if (cnpj.length !== 14) return false;
            // Validação simplificada de comprimento e formato numérico já garantida.
            // Para validação completa de dígito verificador de CNPJ:
            let size = cnpj.length - 2;
            let numbers = cnpj.substring(0, size);
            let digits = cnpj.substring(size);
            let sum = 0;
            let pos = size - 7;
            for (let i = size; i >= 1; i--) {
                sum += numbers.charAt(size - i) * pos--;
                if (pos < 2) pos = 9;
            }
            let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
            if (result !== parseInt(digits.charAt(0))) return false;
            size = size + 1;
            numbers = cnpj.substring(0, size);
            sum = 0;
            pos = size - 7;
            for (let i = size; i >= 1; i--) {
                sum += numbers.charAt(size - i) * pos--;
                if (pos < 2) pos = 9;
            }
            result = sum % 11 < 2 ? 0 : 11 - sum % 11;
            if (result !== parseInt(digits.charAt(1))) return false;
            return true;
        }
        // BACKUP E RESTAURAÇÃO
        function downloadBackup() {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "plena_beleza_backup.json");
            document.body.appendChild(downloadAnchorNode); // Required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }
        function restoreBackup(input) {
            const file = input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const backup = JSON.parse(e.target.result);
                    // Validação básica de integridade
                    const requiredKeys = ['appointments', 'team', 'services', 'transactions', 'clients', 'settings'];
                    const isValid = requiredKeys.every(key => Array.isArray(backup[key]) || typeof backup[key] === 'object');
                    if (isValid) {
                        // Sanitização profunda do backup antes de carregar
                        // Evita que JSON malicioso injete scripts via innerHTML posteriormente
                        const sanitizeObj = (obj) => {
                            if (typeof obj === 'string') return sanitizeHTML(obj);
                            if (Array.isArray(obj)) return obj.map(sanitizeObj);
                            if (typeof obj === 'object' && obj !== null) {
                                Object.keys(obj).forEach(key => {
                                    obj[key] = sanitizeObj(obj[key]);
                                });
                                return obj;
                            }
                            return obj;
                        };
                        db = sanitizeObj(backup);
                        db = sanitizeObj(backup);
                        save();
                        showNotification('Backup restaurado com sucesso! A página será recarregada.', 'success');
                        setTimeout(() => location.reload(), 2000);
                    } else {
                        showNotification('Arquivo de backup inválido ou corrompido.', 'error');
                    }
                } catch (err) {
                    console.error(err);
                    showNotification('Erro ao ler arquivo. Verifique se é um backup válido.', 'error');
                }
            };
            reader.readAsText(file);
        }
        function clearAllData() {
            showCustomConfirm('Limpar Tudo', 'Tem certeza que deseja limpar TODOS os dados? Esta ação é irreversível!', () => {
                db.appointments = [];
                db.transactions = [];
                save();
                renderDashboard();
                renderFinance();
                showNotification('Todos os dados foram removidos!', 'success');
            }, true);
        }
        function factoryReset() {
            showCustomConfirm('Factory Reset', 'ATENÇÃO: Isso resetará TODO o sistema para as configurações de fábrica. Todos os dados serão perdidos. Tem certeza?', () => {
                localStorage.removeItem(DB_KEY);
                location.reload();
            }, true);
        }
        function clearFinanceFilters() {
            const firstDay = new Date();
            firstDay.setDate(1);
            const firstDayStr = firstDay.toISOString().split('T')[0];
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('search-term').value = '';
            document.getElementById('filter-type').value = 'all';
            document.getElementById('filter-start').value = firstDayStr;
            document.getElementById('filter-end').value = today;
            renderFinance();
        }
        // UTILITÁRIOS GERAIS
        function updateDataStatus() {
            const totalAppts = db.appointments.length;
            const totalTeam = db.team.length;
            const totalServices = db.services.length;
            const totalClients = db.clients.length;
            console.log(`Dados atualizados: ${totalAppts} agendamentos, ${totalTeam} profissionais, ${totalServices} serviços, ${totalClients} clientes`);
        }
        function showCustomConfirm(title, message, onConfirm, isDestructive = false, cancelText = 'Cancelar', confirmText = 'Confirmar') {
            document.getElementById('confirmTitle').textContent = title;
            document.getElementById('confirmMessage').innerText = message;
            const confirmBtn = document.getElementById('confirmBtn');
            const iconContainer = document.getElementById('confirmIcon');
            const icon = iconContainer.querySelector('i');
            // Reset
            confirmBtn.className = 'px-5 py-2.5 rounded-xl text-white font-bold transition-colors flex-1 shadow-lg';
            iconContainer.className = 'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4';
            if (isDestructive) {
                confirmBtn.classList.add('bg-red-600', 'hover:bg-red-700', 'shadow-red-200');
                iconContainer.classList.add('bg-red-100');
                icon.classList.add('text-red-600');
                icon.setAttribute('data-lucide', 'alert-triangle');
            } else {
                confirmBtn.classList.add('bg-plena-rose', 'hover:bg-plena-dark', 'shadow-rose-200');
                iconContainer.classList.add('bg-rose-100');
                icon.classList.add('text-plena-rose');
                icon.setAttribute('data-lucide', 'help-circle');
            }
            confirmBtn.textContent = confirmText;
            confirmBtn.onclick = () => {
                closeConfirmModal(true);
                if (onConfirm) onConfirm();
            };
            lucide.createIcons();
            document.getElementById('customConfirmModal').classList.remove('hidden');
            document.getElementById('customConfirmModal').classList.add('flex');
        }
        function closeConfirmModal(confirmed) {
            document.getElementById('customConfirmModal').classList.add('hidden');
            document.getElementById('customConfirmModal').classList.remove('flex');
        }
        function showNotification(message, type = 'info') {
            // Criar elemento de notificação
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${type === 'success' ? 'bg-green-500 text-white' :
                type === 'error' ? 'bg-red-500 text-white' :
                    'bg-blue-500 text-white'
                }`;
            notification.innerHTML = `
                <div class="flex items-center">
                    <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info'}" 
                       class="w-5 h-5 mr-2"></i>
                    <span>${message}</span>
                </div>
            `;
            document.body.appendChild(notification);
            lucide.createIcons();
            // Remover após 3 segundos
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
        // PWA INSTALL PROMPT
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            // Mostrar botão de instalação
            const installButton = document.createElement('button');
            installButton.className = 'fixed bottom-4 right-4 bg-plena-rose text-white px-4 py-2 rounded-lg shadow-lg z-40';
            installButton.innerHTML = '<i data-lucide="download" class="w-4 h-4 inline mr-2"></i>Instalar App';
            installButton.onclick = () => {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then(() => {
                    deferredPrompt = null;
                    installButton.remove();
                });
            };
            document.body.appendChild(installButton);
            lucide.createIcons();
        });
        // OFFLINE SUPPORT
        window.addEventListener('online', () => {
            showNotification('Conexão restaurada!', 'success');
        });
        window.addEventListener('offline', () => {
            showNotification('Modo offline ativado. Seus dados estão seguros localmente.', 'warning');
        });
        // SECURITY CHECK
        setInterval(() => {
            const footer = document.querySelector('.sidebar .border-t');
            if (footer && !footer.innerText.includes('Plena')) {
                document.body.innerHTML = '<div style="background:#111;color:red;height:100vh;display:flex;align-items:center;justify-content:center;"><h1>VIOLAÇÃO DE SEGURANÇA</h1></div>';
                throw new Error("Piracy");
            }
        }, 8000);
        // === MANUAL INTERATIVO PADRONIZADO ===
        function scrollToSection(sectionId) {
            const section = document.getElementById(sectionId);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        function markSectionComplete(sectionId) {
            let completed = JSON.parse(localStorage.getItem('plena_manual_completed') || '[]');
            if (!completed.includes(sectionId)) {
                completed.push(sectionId);
                localStorage.setItem('plena_manual_completed', JSON.stringify(completed));
                showNotification('Etapa concluída!', 'success');
            }
            updateTutorialProgress();
        }
        function updateTutorialProgress() {
            const sections = ['instalacao', 'primeiro-cadastro', 'agendamentos', 'relatorios', 'backup', 'duvidas', 'checklist'];
            const completed = JSON.parse(localStorage.getItem('plena_manual_completed') || '[]');
            const total = sections.length;
            const percent = Math.round((completed.length / total) * 100);
            const progressBar = document.getElementById('tutorial-progress');
            const completedSteps = document.getElementById('completed-steps');
            if (progressBar) progressBar.style.width = percent + '%';
            if (completedSteps) completedSteps.textContent = `${completed.length}/${total} etapas`;
            // Atualizar visual dos botões
            sections.forEach(id => {
                const btn = document.querySelector(`[onclick="scrollToSection('${id}')"]`);
                if (btn) {
                    if (completed.includes(id)) {
                        btn.classList.add('bg-green-100', 'border-green-300', 'text-green-700');
                        btn.classList.remove('border-gray-200');
                    } else {
                        btn.classList.remove('bg-green-100', 'border-green-300', 'text-green-700');
                        btn.classList.add('border-gray-200');
                    }
                }
            });
        }
        function updateChecklist() {
            const checkboxes = document.querySelectorAll('#checklist input[type="checkbox"]');
            const totalTasks = checkboxes.length;
            let completedTasks = 0;
            const checklistState = {};
            checkboxes.forEach(cb => {
                checklistState[cb.id] = cb.checked;
                if (cb.checked) completedTasks++;
                // Estilo visual do item
                const item = cb.closest('.checklist-item');
                if (item) {
                    if (cb.checked) {
                        item.classList.add('opacity-60');
                        item.querySelector('span').classList.add('line-through');
                    } else {
                        item.classList.remove('opacity-60');
                        item.querySelector('span').classList.remove('line-through');
                    }
                }
            });
            localStorage.setItem('plena_checklist_state', JSON.stringify(checklistState));
            const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const percentEl = document.getElementById('checklist-percent');
            const progressEl = document.getElementById('checklist-progress');
            const completedEl = document.getElementById('checklist-completed');
            const totalEl = document.getElementById('checklist-total');
            if (percentEl) percentEl.textContent = percent + '%';
            if (progressEl) progressEl.style.width = percent + '%';
            if (completedEl) completedEl.textContent = completedTasks;
            if (totalEl) totalEl.textContent = totalTasks;
            // Atualizar próximas tarefas
            const nextTasks = document.getElementById('next-tasks');
            if (nextTasks) {
                const unchecked = Array.from(checkboxes).filter(cb => !cb.checked).slice(0, 2);
                if (unchecked.length > 0) {
                    nextTasks.innerHTML = unchecked.map(cb => {
                        const text = cb.nextElementSibling.textContent;
                        return `<div class="flex items-center gap-2 text-xs text-gray-300">
                                    <i data-lucide="circle" class="w-3 h-3"></i>
                                    <span>${text}</span>
                                </div>`;
                    }).join('');
                } else {
                    nextTasks.innerHTML = `<div class="flex items-center gap-2 text-xs text-green-400 font-bold">
                                                <i data-lucide="check-circle" class="w-3 h-3"></i>
                                                <span>Tudo em dia!</span>
                                            </div>`;
                }
                lucide.createIcons();
            }
        }
        function loadChecklistState() {
            const saved = JSON.parse(localStorage.getItem('plena_checklist_state') || '{}');
            Object.keys(saved).forEach(id => {
                const checkbox = document.getElementById(id);
                if (checkbox) checkbox.checked = saved[id];
            });
            updateChecklist();
        }
        function showExample(type) {
            showNotification(`Exemplo de ${type} carregado!`, 'info');
        }
        // === LOGICA DE TERMOS E ACEITE ===
        function confirmTerms() {
            showCustomConfirm('Termos de Uso', 'Tem certeza que leu e concorda com todos os termos apresentados?', () => {
                // Update DB
                if (!db.settings) db.settings = {};
                db.settings.termsAccepted = true;
                db.settings.termsAcceptedAt = new Date().toISOString();
                save();
                // Update Visuals
                updateTermsVisuals();
                // Celebration Effect
                const btn = document.getElementById('btn-confirm-terms');
                if (btn) {
                    showNotification('Obrigado! Seu aceite foi registrado com sucesso.', 'success');
                }
            }, false);
        }
        function updateTermsVisuals() {
            // Safety check for DB
            if (typeof db === 'undefined' || !db.settings) return;
            const hasAccepted = db.settings.termsAccepted;
            const termsBox = document.getElementById('terms-box');
            const btn = document.getElementById('btn-confirm-terms');
            const badge = document.getElementById('terms-accepted-badge');
            const icon = document.getElementById('terms-icon');
            const title = document.getElementById('terms-title');
            const desc = document.getElementById('terms-desc');
            if (hasAccepted && termsBox) {
                // Change Box Style
                termsBox.classList.remove('bg-gray-50', 'border-gray-200');
                termsBox.classList.add('bg-green-50', 'border-green-200');
                // Hide Button / Show Badge
                if (btn) btn.classList.add('hidden');
                if (badge) {
                    badge.classList.remove('hidden');
                    badge.classList.add('flex');
                }
                // Update Date
                const dateElement = document.getElementById('terms-date');
                if (dateElement && db.settings.termsAcceptedAt) {
                    const dateObj = new Date(db.settings.termsAcceptedAt);
                    dateElement.textContent = 'Confirmado em: ' + dateObj.toLocaleString('pt-BR');
                }
                // Update Icon and Text
                if (icon) {
                    icon.setAttribute('class', 'w-16 h-16 text-green-500 mb-3 transition-colors duration-500');
                    if (window.lucide) {
                        icon.setAttribute('data-lucide', 'shield-check');
                    }
                }
                if (title) {
                    title.textContent = 'Termos Aceitos e Válidos';
                    title.classList.add('text-green-800');
                }
                if (desc) {
                    desc.textContent = 'Obrigado por sua transparência e confiança. Seu uso está regularizado.';
                    desc.classList.add('text-green-700');
                }
                if (window.lucide) lucide.createIcons();
            }
        }
        // Carregar estado do manual ao carregar pÃ¡gina
        document.addEventListener('DOMContentLoaded', () => {
            updateTutorialProgress();
            loadChecklistState();
            // Tentar restaurar estado dos termos com pequeno delay para garantir DB carregado
            setTimeout(updateTermsVisuals, 500);
        });
        // INICIALIZAR APLICATIVO
        document.addEventListener('DOMContentLoaded', init);
