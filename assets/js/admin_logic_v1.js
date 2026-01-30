const { createApp, ref, computed, onMounted, nextTick, watch } = Vue;

createApp({
    directives: {
        mask: (window.Vue3InputMask) ? Vue3InputMask.default : { mounted: () => { } }
    },

    setup() {
        // Auth State
        const isAuthenticated = ref(false);
        const loginPassword = ref('');
        const loggingIn = ref(false);
        const sidebarToggled = ref(false);

        // Modal States
        const newLicense = ref({
            cliente: '',
            email: '',
            produto: '',
            type: 'monthly',
            price: '',
            cpf: '',
            whatsapp: '',
            sendEmail: true
        });
        const editingLicense = ref(null);
        const newPartner = ref({
            name: '',
            email: '',
            whatsapp: '',
            code: '',
            discount_percent: 10,
            commission_percent: 20,
            status: 'active'
        });
        const editingPartner = ref(null);
        const newTrans = ref({ type: 'expense', amount: 0, description: '', category: 'outros' });
        const newLead = ref({ name: '', email: '', phone: '', source: 'Website', status: 'Novo' });
        const selectedSale = ref(null);
        const saleLogs = ref([]);

        let newLicenseModalBS = null;
        let editLicenseModalBS = null;
        let partnerModalBS = null;
        let saleDetailsModalBS = null;
        let newLeadModalBS = null;
        let financeModalBS = null; // Nexus 2.0

        const currentTab = ref('dashboard');
        const chartPeriod = ref('6m');

        // Data Refs
        const topProducts = ref([]);
        const kpi = ref({
            faturamento: 0,
            mrr: 0,
            licencas: 0,
            tickets: 0
        });
        const vendas = ref([]);
        const licencas = ref([]);

        const apps = ref([]);
        const editingApp = ref({ slug: '', name: '', price: 0 }); // Nexus 2.0 (Init object to avoid v-if)
        const financeiro = ref({
            saldo: 0,
            receitas: 0,
            despesas: 0,
            transacoes: []
        });
        const parceiros = ref([]);
        const leads = ref([]);
        const logs = ref([]);
        const realTimeLogs = ref([]);
        const activeDevicesCount = ref(0); // New Stat
        const notifications_history = ref([]);

        // Stats
        const statsLicencas = ref({ total: 0, ativas: 0, expirando: 0, bloqueadas: 0 });
        const statsParceiros = ref({ total: 0, comissaoPendente: 0, vendasMes: 0, totalPago: 0 });

        // Filters
        const salesSearch = ref('');
        const salesStatusFilter = ref('');
        const salesDateFilter = ref('');
        const licenseSearch = ref('');
        const licenseTypeFilter = ref('');

        // System Diagnosis State
        const diagnosisLoading = ref(false);
        const systemStatus = ref({ db: false, smtp: false, mp: false });
        const testEmail = ref('');
        const testEmailResult = ref('');
        const lastBackup = ref('');

        // Notifications State
        const newNotification = ref({
            target: 'all',
            type: 'info',
            message: '',
            requireRead: false,
            title: ''
        });
        const sendingNotification = ref(false);

        // UI State
        const loading = ref(false);
        const loadingMessage = ref('Carregando...');
        const refreshing = ref(false);
        const creatingLicense = ref(false);
        const updatingLicense = ref(false);
        const savingPartner = ref(false);

        // Toast Notifications
        const toasts = ref([]);
        let toastCounter = 0;

        // Charts
        let revenueChartInstance = null;
        let financeChartInstance = null;
        let distributionChartInstance = null;
        let editAppModalBS = null; // Nexus 2.0

        // Helper: Show Toast
        const showToast = (type, title, message, duration = 5000) => {
            const id = ++toastCounter;
            const toast = {
                id,
                type,
                title,
                message,
                time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            };

            toasts.value.unshift(toast);

            // Auto remove
            setTimeout(() => {
                removeToast(id);
            }, duration);
        };

        const removeToast = (id) => {
            const index = toasts.value.findIndex(t => t.id === id);
            if (index !== -1) {
                toasts.value.splice(index, 1);
            }
        };


        const getToastIcon = (type) => {
            switch (type) {
                case 'success': return 'fa-solid fa-check-circle text-success';
                case 'danger': return 'fa-solid fa-exclamation-circle text-danger';
                case 'warning': return 'fa-solid fa-exclamation-triangle text-warning';
                default: return 'fa-solid fa-info-circle text-info';
            }
        };

        // API Helper
        const apiCall = async (action, method = 'GET', body = null) => {
            const secret = localStorage.getItem('admin_secret');
            if (!secret && !loginPassword.value) {
                showToast('danger', 'Erro de Autenticação', 'Token de acesso não encontrado');
                throw new Error("No Auth");
            }

            const headers = {
                'Content-Type': 'application/json',
                'X-Admin-Secret': secret || loginPassword.value
            };

            const options = { method, headers };
            if (body) options.body = JSON.stringify(body);

            try {
                showLoading('Conectando ao servidor...');
                const res = await fetch(`api_licenca.php?action=${action}`, options);

                if (res.status === 403) {
                    isAuthenticated.value = false;
                    localStorage.removeItem('admin_secret');
                    showToast('danger', 'Acesso Negado', 'Credenciais inválidas ou expiradas');
                    throw new Error("Acesso Negado");
                }

                const data = await res.json();
                hideLoading();
                return data;
            } catch (e) {
                hideLoading();
                console.error("API Error:", e);
                showToast('danger', 'Erro de Conexão', `Não foi possível conectar ao servidor: ${e.message}`);
                addLog(`API Error (${action}): ${e.message}`);
                return null;
            }
        };

        // Loading Helpers
        const showLoading = (message = 'Carregando...') => {
            loading.value = true;
            loadingMessage.value = message;
        };

        const hideLoading = () => {
            loading.value = false;
        };

        // Data Fetching
        const refreshData = async () => {
            refreshing.value = true;

            try {
                // 1. Dashboard Stats
                const stats = await apiCall('dashboard_stats');
                if (stats) {
                    kpi.value = {
                        faturamento: stats.total_revenue || 0,
                        mrr: stats.mrr || 0,
                        licencas: stats.active_subscriptions || 0,
                        tickets: stats.expiring_soon || 0
                    };

                    if (stats.active_devices_count !== undefined) {
                        activeDevicesCount.value = stats.active_devices_count;
                    }

                    // Map top products
                    topProducts.value = [];
                    if (stats.top_products) {
                        let i = 0;
                        let max = 0;
                        for (const p in stats.top_products) {
                            if (stats.top_products[p] > max) max = stats.top_products[p];
                        }

                        for (const p in stats.top_products) {
                            if (i >= 3) break;
                            topProducts.value.push({
                                name: p,
                                sales: stats.top_products[p],
                                percent: max > 0 ? Math.round((stats.top_products[p] / max) * 100) : 0
                            });
                            i++;
                        }
                    }

                    // Update Chart
                    if (stats.chart && revenueChartInstance) {
                        revenueChartInstance.data.labels = stats.chart.labels;
                        revenueChartInstance.data.datasets[0].data = stats.chart.data;
                        revenueChartInstance.update();
                    }
                }

                // 2. Licenses List
                const licData = await apiCall('list');
                if (licData && Array.isArray(licData)) {
                    licencas.value = licData.map(l => ({
                        key: l.key,
                        cliente: l.client,
                        email: l.email,
                        produto: l.product,
                        activated_at: l.activated_at, // New Field
                        device_id: l.device_id, // New Field
                        type: l.license_type,
                        expires_at: l.expires_at,
                        status: l.status
                    }));

                    // Calculate license stats
                    updateLicenseStats();
                }

                // 3. Products (From Disk Scan + Config)
                const prodData = await apiCall('list_apps');
                if (prodData) apps.value = prodData;
                if (apps.value.length > 0 && !newLicense.value.produto) {
                    newLicense.value.produto = apps.value[0].name;
                }

                // 4. Sales History
                const salesData = await apiCall('get_sales_history');
                if (salesData) {
                    vendas.value = salesData.map(s => ({
                        id: s.id,
                        mp_id: s.id,
                        data: s.date,
                        cliente: s.client,
                        email: s.email || '---',
                        produto: s.product,
                        valor: s.amount,
                        status: s.status
                    }));
                }

                // 5. System Health
                const health = await apiCall('system_health');
                if (health) {
                    systemStatus.value = health;
                }

                // 6. Leads (CRM)
                const leadsData = await apiCall('get_leads');
                if (leadsData) {
                    leads.value = leadsData.map(l => ({
                        id: l.unique_id,
                        name: l.name || 'Desconhecido',
                        email: l.email || '---',
                        phone: l.phone || '---',
                        source: l.source || 'Direct',
                        status: l.status || 'Novo'
                    }));
                }

                // 7. Finance
                const finData = await apiCall('get_finance');
                if (finData) {
                    financeiro.value.saldo = finData.balance || 0;
                    financeiro.value.receitas = finData.incomes || 0;
                    financeiro.value.despesas = finData.expenses || 0;
                    financeiro.value.transacoes = finData.transactions || []; // New Key

                    // Update finance charts (Simple Refresh)
                    if (currentTab.value === 'financeiro') updateFinanceCharts();
                }

                // 8. Partners
                const partData = await apiCall('list_partners');
                if (partData) {
                    parceiros.value = partData;
                    updatePartnerStats();
                }

                // 9. Logs
                const logData = await apiCall('get_logs');
                if (logData && logData.logs) {
                    logs.value = logData.logs;

                    // Populate RealTimeLogs from History if empty
                    if (realTimeLogs.value.length === 0) {
                        realTimeLogs.value = logData.logs.slice(0, 50).map(logStr => {
                            // Format: [2024-01-01 10:00:00] [INFO] Message
                            const match = logStr.match(/^\[(.*?)\] \[(.*?)\] (.*)$/);
                            if (match) {
                                return {
                                    ts: match[1].split(' ')[1], // Just time
                                    level: match[2],
                                    msg: match[3]
                                };
                            }
                            return { ts: '---', level: 'INFO', msg: logStr };
                        });
                    }
                }

                // 10. Last backup
                const backupData = await apiCall('get_last_backup');
                if (backupData && backupData.last_backup) {
                    lastBackup.value = new Date(backupData.last_backup).toLocaleString('pt-BR');
                }

                // 11. Notifications History
                await loadNotifications();

                showToast('success', 'Dados Atualizados', 'Os dados foram atualizados com sucesso');
                addLog('System data refreshed.');
            } catch (error) {
                showToast('danger', 'Erro ao Atualizar', 'Não foi possível atualizar os dados');
            } finally {
                refreshing.value = false;
            }
        };

        // Initialize Charts
        const initCharts = () => {
            const revenueCtx = document.getElementById('revenueChart');
            if (revenueCtx) {
                if (revenueChartInstance) revenueChartInstance.destroy();

                revenueChartInstance = new Chart(revenueCtx, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                        datasets: [{
                            label: 'Vendas (R$)',
                            data: [12000, 19000, 15000, 25000, 22000, 30000],
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.4,
                            fill: true,
                            borderWidth: 3
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: (context) => `R$ ${context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: { color: '#f3f4f6' },
                                ticks: {
                                    callback: (value) => `R$ ${value.toLocaleString('pt-BR')}`
                                }
                            },
                            x: { grid: { display: false } }
                        }
                    }
                });
            }
        };

        const updateFinanceCharts = () => {
            // Finance Chart
            const financeCtx = document.getElementById('financeChart');
            if (financeCtx) {
                if (financeChartInstance) financeChartInstance.destroy();

                financeChartInstance = new Chart(financeCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                        datasets: [
                            {
                                label: 'Entradas',
                                data: [12000, 19000, 15000, 25000, 22000, 30000],
                                backgroundColor: '#10b981',
                                borderColor: '#10b981',
                                borderWidth: 1
                            },
                            {
                                label: 'Saídas',
                                data: [4000, 5000, 3000, 7000, 6000, 8000],
                                backgroundColor: '#ef4444',
                                borderColor: '#ef4444',
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: (context) => `R$ ${context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: { color: '#f3f4f6' },
                                ticks: {
                                    callback: (value) => `R$ ${value.toLocaleString('pt-BR')}`
                                }
                            }
                        }
                    }
                });
            }

            // Distribution Chart
            const distributionCtx = document.getElementById('distributionChart');
            if (distributionCtx) {
                if (distributionChartInstance) distributionChartInstance.destroy();

                distributionChartInstance = new Chart(distributionCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Apps', 'Licenças', 'Consultoria', 'Outros'],
                        datasets: [{
                            data: [45, 30, 15, 10],
                            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
                            borderWidth: 2,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            }
        };

        const updateChart = () => {
            if (revenueChartInstance) {
                // Simulate data update based on period
                const periods = {
                    '3m': ['Abr', 'Mai', 'Jun'],
                    '6m': ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                    '1y': ['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
                };

                const data = {
                    '3m': [25000, 22000, 30000],
                    '6m': [12000, 19000, 15000, 25000, 22000, 30000],
                    '1y': [10000, 12000, 15000, 17000, 20000, 22000, 12000, 19000, 15000, 25000, 22000, 30000]
                };

                revenueChartInstance.data.labels = periods[chartPeriod.value] || periods['6m'];
                revenueChartInstance.data.datasets[0].data = data[chartPeriod.value] || data['6m'];
                revenueChartInstance.update();
            }
        };

        onMounted(async () => {
            // Initialize Bootstrap modals
            // Initialize Bootstrap modals
            const newLicEl = document.getElementById('newLicenseModal');
            if (newLicEl) newLicenseModalBS = new bootstrap.Modal(newLicEl);

            const editLicEl = document.getElementById('editLicenseModal');
            if (editLicEl) editLicenseModalBS = new bootstrap.Modal(editLicEl);

            const editAppEl = document.getElementById('editAppModal'); // Nexus 2.0
            if (editAppEl) editAppModalBS = new bootstrap.Modal(editAppEl);

            const partEl = document.getElementById('partnerModal');
            if (partEl) partnerModalBS = new bootstrap.Modal(partEl);

            const saleEl = document.getElementById('saleDetailsModal');
            if (saleEl) saleDetailsModalBS = new bootstrap.Modal(saleEl);

            const leadEl = document.getElementById('newLeadModal');
            if (leadEl) newLeadModalBS = new bootstrap.Modal(leadEl);

            const financeEl = document.getElementById('financeModal');
            if (financeEl) financeModalBS = new bootstrap.Modal(financeEl);

            const savedSecret = localStorage.getItem('admin_secret');
            if (savedSecret) {
                try {
                    isAuthenticated.value = true;
                    await nextTick();
                    initCharts();
                    await refreshData();
                } catch (e) {
                    isAuthenticated.value = false;
                    localStorage.removeItem('admin_secret');
                }
            }

            // Auto Refresh & Polling
            setInterval(() => {
                if (isAuthenticated.value && currentTab.value === 'dashboard') {
                    refreshData();
                }
            }, 300000); // 5 mins

            setInterval(async () => {
                if (isAuthenticated.value) {
                    const logData = await apiCall('get_logs');
                    if (logData && logData.logs) logs.value = logData.logs;
                }
            }, 5000); // 5 secs logs (Real-time feel)
        });

        // System Methods (Moved up)
        const runSystemDiagnosis = async () => {
            diagnosisLoading.value = true;
            await new Promise(r => setTimeout(r, 800));

            const res = await apiCall('system_health');

            if (res) {
                // PHP returns the health object directly
                systemStatus.value = res;
                if (res.db && res.smtp && res.mp) {
                    // OK
                } else {
                    showToast('warning', 'Atenção', 'Alguns serviços não estão operando 100%.');
                }
            } else {
                systemStatus.value = { db: false, smtp: false, mp: false };
                showToast('danger', 'Diagnóstico Falhou', 'Não foi possível verificar status do backend');
            }
            diagnosisLoading.value = false;
        };

        watch(currentTab, async (newTab) => {
            if (newTab === 'dashboard') {
                await nextTick();
                initCharts();
            } else if (newTab === 'financeiro') {
                await nextTick();
                updateFinanceCharts();
            } else if (newTab === 'sistema') {
                runSystemDiagnosis();
            }

            // Auto close sidebar on mobile
            if (window.innerWidth < 768) {
                sidebarToggled.value = false;
            }
        });

        // Methods
        const setCurrentTab = (tab) => {
            currentTab.value = tab;
            window.scrollTo(0, 0);
        };

        const login = async () => {
            if (!loginPassword.value) {
                showToast('warning', 'Atenção', 'Digite a senha de acesso');
                return;
            }

            loggingIn.value = true;

            try {
                const stats = await apiCall('dashboard_stats');
                if (stats && !stats.error) {
                    isAuthenticated.value = true;
                    localStorage.setItem('admin_secret', loginPassword.value);
                    await nextTick();
                    initCharts();
                    await refreshData();
                    showToast('success', 'Bem-vindo', 'Login realizado com sucesso!');
                } else {
                    showToast('danger', 'Erro de Login', 'Senha incorreta ou erro de conexão.');
                    localStorage.removeItem('admin_secret');
                }
            } catch (e) {
                showToast('danger', 'Erro', 'Não foi possível conectar ao servidor');
            } finally {
                loggingIn.value = false;
            }
        };

        const logout = () => {
            if (confirm('Deseja realmente sair do sistema?')) {
                isAuthenticated.value = false;
                localStorage.removeItem('admin_secret');
                loginPassword.value = '';
                showToast('info', 'Logout', 'Você saiu do sistema');
                setTimeout(() => window.location.reload(), 1000); // Reload to clear memory states
            }
        };

        // License Methods
        const openNewLicenseModal = () => {
            if (!newLicenseModalBS) {
                const el = document.getElementById('newLicenseModal');
                if (el) newLicenseModalBS = new bootstrap.Modal(el);
            }
            if (apps.value.length > 0) newLicense.value.produto = apps.value[0].name;
            if (newLicenseModalBS) newLicenseModalBS.show();
        };

        const createLicense = async () => {
            creatingLicense.value = true;

            const payload = {
                client_name: newLicense.value.cliente,
                client_email: newLicense.value.email,
                product: newLicense.value.produto,
                license_type: newLicense.value.type,
                duration: newLicense.value.type === 'developer' ? 9999 : (newLicense.value.type === 'monthly' ? 30 : (newLicense.value.type === 'yearly' ? 365 : 3650)),
                is_manual: true,
                price: newLicense.value.price,
                cpf: newLicense.value.cpf,
                whatsapp: newLicense.value.whatsapp,
                send_email: newLicense.value.sendEmail
            };

            const res = await apiCall('create', 'POST', payload);

            creatingLicense.value = false;

            if (res && res.success) {
                newLicenseModalBS.hide();
                showToast('success', 'Licença Criada', `Licença ${res.license_key} criada com sucesso`);
                addLog(`Licença criada: ${res.license_key}`);

                // Ask about WhatsApp
                if (newLicense.value.whatsapp && confirm(`Licença Criada!\n\nDeseja enviar para o cliente via WhatsApp?`)) {
                    const phone = newLicense.value.whatsapp.replace(/\D/g, '');
                    const text = encodeURIComponent(`Olá, sua licença do ${newLicense.value.produto} foi gerada com sucesso.\n\nChave de Ativação: *${res.license_key}*\n\nObrigado pela preferência!`);
                    window.open(`https://wa.me/55${phone}?text=${text}`, '_blank');
                }

                refreshData();
                // Reset form
                newLicense.value.cliente = '';
                newLicense.value.email = '';
                newLicense.value.cpf = '';
                newLicense.value.whatsapp = '';
                newLicense.value.price = '';
            } else {
                showToast('danger', 'Erro', 'Erro ao criar licença: ' + (res ? res.error : 'Erro desconhecido'));
            }
        };

        const openEditModal = (lic) => {
            editingLicense.value = { ...lic };
            editLicenseModalBS.show();
        };

        const updateLicense = async () => {
            updatingLicense.value = true;

            const payload = {
                key: editingLicense.value.key,
                status: editingLicense.value.status,
                client: editingLicense.value.cliente,
                email: editingLicense.value.email,
                expires_at: editingLicense.value.expires_at
            };

            const res = await apiCall('update_status', 'POST', payload);

            updatingLicense.value = false;

            if (res && res.success) {
                editLicenseModalBS.hide();
                showToast('success', 'Licença Atualizada', 'Licença atualizada com sucesso');
                refreshData();
            } else {
                showToast('danger', 'Erro', 'Erro ao atualizar: ' + (res ? res.error : 'Unknown'));
            }
        };

        const toggleBlock = async (lic) => {
            const action = lic.status === 'active' ? 'BLOQUEAR' : 'DESBLOQUEAR';
            if (!confirm(`Deseja realmente ${action} esta licença?`)) return;

            const newStatus = lic.status === 'active' ? 'blocked' : 'active';
            const res = await apiCall('update_status', 'POST', { key: lic.key, status: newStatus });

            if (res && res.success) {
                showToast('success', 'Status Alterado', `Licença ${action === 'BLOQUEAR' ? 'bloqueada' : 'desbloqueada'} com sucesso`);
                refreshData();
            } else {
                showToast('danger', 'Erro', 'Erro ao alterar status da licença');
            }
        };

        const renewLicense = async (lic) => {
            if (!confirm(`Renovar licença de ${lic.cliente} por mais 30 dias?`)) return;

            const res = await apiCall('renew', 'POST', { key: lic.key, days: 30 });
            if (res && res.success) {
                showToast('success', 'Renovada', 'Licença renovada com sucesso!');
                refreshData();
            } else {
                showToast('danger', 'Erro', 'Erro ao renovar licença');
            }
        };

        const updateLicenseStats = () => {
            const total = licencas.value.length;
            const ativas = licencas.value.filter(l => l.status === 'active').length;
            const expirando = licencas.value.filter(l => {
                if (l.type === 'lifetime' || l.status !== 'active') return false;
                const expDate = new Date(l.expires_at);
                const today = new Date();
                const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
                return diffDays <= 7 && diffDays > 0;
            }).length;
            const bloqueadas = licencas.value.filter(l => l.status === 'blocked').length;

            statsLicencas.value = { total, ativas, expirando, bloqueadas };
        };

        const isExpiringSoon = (expiresAt) => {
            if (!expiresAt) return false;
            const expDate = new Date(expiresAt);
            const today = new Date();
            const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
            return diffDays <= 7 && diffDays > 0;
        };

        // Sales Methods


        const viewSaleDetails = async (sale) => {
            selectedSale.value = sale;
            // Fetch sale logs
            const logsData = await apiCall('get_sale_logs', 'POST', { sale_id: sale.id });
            if (logsData && logsData.logs) {
                saleLogs.value = logsData.logs;
            }
            saleDetailsModalBS.show();
        };

        const resendSaleEmail = async (sale) => {
            if (confirm(`Reenviar email para ${sale.cliente}?`)) {
                const res = await apiCall('resend_email', 'POST', { sale_id: sale.id });
                if (res && res.success) {
                    showToast('success', 'Email Reenviado', 'Email enviado com sucesso');
                } else {
                    showToast('danger', 'Erro', 'Erro ao reenviar email');
                }
            }
        };

        const refundSale = async (sale) => {
            if (!confirm(`Estornar venda #${sale.mp_id} no valor de R$ ${formatMoney(sale.valor)}?`)) return;

            const res = await apiCall('refund_sale', 'POST', { sale_id: sale.id });
            if (res && res.success) {
                showToast('success', 'Estorno Realizado', 'Venda estornada com sucesso');
                refreshData();
            } else {
                showToast('danger', 'Erro', 'Erro ao estornar venda');
            }
        };



        // Partners Methods
        const openPartnerModal = (partner = null) => {
            if (partner) {
                editingPartner.value = partner;
                newPartner.value = { ...partner };
            } else {
                editingPartner.value = null;
                newPartner.value = {
                    name: '',
                    email: '',
                    whatsapp: '',
                    code: '',
                    discount_percent: 10,
                    commission_percent: 20,
                    status: 'active'
                };
            }
            partnerModalBS.show();
        };

        const createPartner = async () => {
            savingPartner.value = true;

            const payload = { partner: newPartner.value, is_edit: false };
            const res = await apiCall('save_partner', 'POST', payload);

            savingPartner.value = false;

            if (res && res.success) {
                partnerModalBS.hide();
                showToast('success', 'Parceiro Criado', 'Parceiro criado com sucesso!');
                refreshData();
            } else {
                showToast('danger', 'Erro', 'Erro ao criar parceiro: ' + (res?.error || 'Unknown'));
            }
        };

        const updatePartner = async () => {
            savingPartner.value = true;

            const payload = { partner: newPartner.value, is_edit: true, id: editingPartner.value.id };
            const res = await apiCall('save_partner', 'POST', payload);

            savingPartner.value = false;

            if (res && res.success) {
                partnerModalBS.hide();
                showToast('success', 'Parceiro Atualizado', 'Parceiro atualizado com sucesso!');
                refreshData();
            } else {
                showToast('danger', 'Erro', 'Erro ao atualizar parceiro: ' + (res?.error || 'Unknown'));
            }
        };

        const editPartner = (partner) => {
            openPartnerModal(partner);
        };

        const deletePartner = async (id) => {
            if (!confirm('Tem certeza que deseja excluir este parceiro?')) return;

            const res = await apiCall('delete_partner', 'POST', { id });
            if (res && res.success) {
                showToast('success', 'Parceiro Excluído', 'Parceiro excluído com sucesso');
                refreshData();
            } else {
                showToast('danger', 'Erro', 'Erro ao excluir parceiro');
            }
        };

        const settlePartner = async (p) => {
            const pending = p.pending_commission || 0;
            const amountStr = prompt(`Qual valor deseja repassar (pagar) para ${p.name}?\nSaldo pendente: R$ ${formatMoney(pending)}`, pending.toFixed(2));

            if (!amountStr) return;
            const amount = parseFloat(amountStr.replace(',', '.'));

            if (isNaN(amount) || amount <= 0) {
                showToast('warning', 'Valor Inválido', 'Digite um valor válido maior que zero.');
                return;
            }

            // Using the new versatile endpoint 'partner_op'
            const res = await apiCall('partner_op', 'POST', {
                type: 'settle',
                id: p.id,
                amount: amount
            });

            if (res && res.success) {
                const paidVal = res.paid_amount || amount;
                showToast('success', 'Pagamento Registrado', `Pagamento de R$ ${formatMoney(paidVal)} realizado com sucesso!`);

                // WhatsApp Link Generation
                if (confirm('Deseja enviar o comprovante via WhatsApp agora?')) {
                    const msg = `Olá ${p.name}, realizamos o fechamento do seu caixa referente às comissões.\n\nvalor pago: *R$ ${formatMoney(paidVal)}* 💰\n\nConfira na sua conta! Obrigado pela parceria.`;
                    const phone = p.whatsapp ? p.whatsapp.replace(/\D/g, '') : '';
                    const waLink = phone
                        ? `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`
                        : `https://wa.me/?text=${encodeURIComponent(msg)}`;

                    window.open(waLink, '_blank');
                }

                refreshData();
            } else {
                showToast('danger', 'Erro', 'Erro ao fechar caixa: ' + (res?.error || 'Unknown'));
            }
        };

        const updatePartnerStats = () => {
            const total = parceiros.value.length;
            const comissaoPendente = parceiros.value.reduce((sum, p) => sum + (p.pending_commission || 0), 0);
            const vendasMes = parceiros.value.reduce((sum, p) => sum + (p.sales_count || 0), 0); // Using sales_count as proxy for now
            const totalPago = parceiros.value.reduce((sum, p) => sum + (p.total_paid || 0), 0);

            statsParceiros.value = { total, comissaoPendente, vendasMes, totalPago };
        };

        const exportPartners = () => {
            showToast('info', 'Exportar', 'Funcionalidade de exportação em desenvolvimento');
        };



        const sendTestEmail = async () => {
            if (!testEmail.value) {
                showToast('warning', 'Atenção', 'Digite um e-mail para teste.');
                return;
            }

            testEmailResult.value = `Enviando para ${testEmail.value}...`;

            const res = await apiCall('test_smtp', 'POST', { email_destino: testEmail.value });

            if (res && res.success) {
                testEmailResult.value = `✅ SUCESSO! ${res.message}`;
                showToast('success', 'Teste de Email', 'E-mail de teste enviado com sucesso!');
                addLog(`SMTP Test: ${res.message}`);
            } else {
                const errMsg = res?.error || 'Erro desconhecido';
                testEmailResult.value = `❌ ERRO: ${errMsg}`;
                showToast('danger', 'Teste de Email', 'Erro ao enviar e-mail de teste');
                addLog(`SMTP Error: ${errMsg}`);
            }
        };

        // Notifications Methods




        const getNotificationTypeLabel = (type) => {
            const labels = {
                'info': 'INFORMAÇÃO',
                'success': 'SUCESSO',
                'warning': 'ALERTA',
                'danger': 'CRÍTICO'
            };
            return labels[type] || type.toUpperCase();
        };



        // CRM Methods
        const openNewLeadModal = () => {
            newLeadModalBS.show();
        };

        const saveLead = async () => {
            const res = await apiCall('save_lead', 'POST', newLead.value);
            if (res && res.success) {
                newLeadModalBS.hide();
                showToast('success', 'Lead Salvo', 'Lead salvo com sucesso');
                refreshData();
                // Reset form
                newLead.value = { name: '', email: '', phone: '', source: 'Website', status: 'Novo' };
            } else {
                showToast('danger', 'Erro', 'Erro ao salvar lead');
            }
        };

        const editLead = (lead) => {
            // TODO: Implement lead editing
            showToast('info', 'Editar Lead', 'Funcionalidade em desenvolvimento');
        };

        const getLeadStatusClass = (status) => {
            switch (status) {
                case 'Novo': return 'bg-info';
                case 'Contatado': return 'bg-warning';
                case 'Interessado': return 'bg-primary';
                case 'Cliente': return 'bg-success';
                default: return 'bg-secondary';
            }
        };

        // Apps Methods
        const saveAppConfig = async (app) => {
            const payload = {
                slug: app.slug,
                price: app.price,
                name: app.name
            };

            const res = await apiCall('update_app', 'POST', payload);
            if (res && res.success) {
                showToast('success', 'App Atualizado', 'Configuração do App salva com sucesso!');
            } else {
                showToast('danger', 'Erro', 'Erro ao salvar: ' + (res?.error || 'Unknown'));
            }
        };

        const openAppDetails = (app) => {
            showToast('info', 'Configurar App', `Abrindo configurações para ${app.name}`);
            // TODO: Implement app details modal
        };

        const openNewAppModal = () => {
            showToast('info', 'Novo App', 'Funcionalidade em desenvolvimento');
        };

        // Finance Methods
        const addTransaction = async (type) => {
            const desc = prompt("Descrição da transação:", type === 'income' ? "Venda extra" : "Pagamento");
            if (!desc) return;

            const val = prompt("Valor (R$):", "0.00");
            if (!val || isNaN(parseFloat(val))) return;

            const res = await apiCall('finance_op', 'POST', {
                type: type,
                description: desc,
                value: parseFloat(val)
            });

            if (res && res.success) {
                showToast('success', 'Transação Registrada', 'Transação registrada com sucesso!');
                refreshData();
            } else {
                showToast('danger', 'Erro', 'Erro ao registrar transação');
            }
        };

        const openWithdrawModal = () => {
            showToast('info', 'Saque', 'Funcionalidade em desenvolvimento');
        };

        const openStatementModal = () => {
            showToast('info', 'Extrato', 'Funcionalidade em desenvolvimento');
        };

        // System Actions
        const createBackup = async () => {
            showLoading('Gerando Backup...');
            const res = await apiCall('backup_system');
            hideLoading();

            if (res && res.success) {
                lastBackup.value = new Date().toLocaleString('pt-BR');
                showToast('success', 'Backup Criado', 'Download iniciado...');
                // Download file
                const link = document.createElement('a');
                link.href = res.file; // The API returns the filename/relative path
                link.download = res.file;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                showToast('danger', 'Erro', 'Erro ao criar backup');
            }
        };

        const clearCache = () => {
            if (confirm('Limpar cache do sistema?')) {
                showToast('success', 'Cache Limpo', 'Cache limpo com sucesso');
                addLog('System cache cleared.');
            }
        };

        const optimizeDatabase = () => {
            showToast('info', 'Otimizar DB', 'Funcionalidade em desenvolvimento');
        };

        const clearLogs = () => {
            if (confirm('Limpar todos os logs do sistema?')) {
                logs.value = [];
                realTimeLogs.value = [];
                showToast('info', 'Logs Limpos', 'Logs do sistema limpos');
            }
        };

        const downloadLogs = () => {
            const content = logs.value.map(l => l.msg).join('\n');
            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `system_logs_${new Date().toISOString().slice(0, 10)}.txt`;
            a.click();
            window.URL.revokeObjectURL(url);
        };

        // Filter Methods
        const filteredSales = computed(() => {
            let filtered = vendas.value;

            // 1. Text Search
            if (salesSearch.value) {
                const q = salesSearch.value.toLowerCase();
                filtered = filtered.filter(s =>
                    (s.cliente && s.cliente.toLowerCase().includes(q)) ||
                    (s.email && s.email.toLowerCase().includes(q)) ||
                    (s.mp_id && s.mp_id.toString().includes(q)) ||
                    (s.produto && s.produto.toLowerCase().includes(q))
                );
            }

            // 2. Status Filter
            if (salesStatusFilter.value) {
                // Map frontend status to backend status if needed, or use raw
                // Backend assumes 'paid', 'pending', 'refunded'
                let status = salesStatusFilter.value;
                if (status === 'approved') status = 'paid'; // alias

                filtered = filtered.filter(s => s.status === status);
            }

            return filtered;
        });

        const filteredLicenses = computed(() => {
            let filtered = licencas.value;

            if (licenseSearch.value) {
                const search = licenseSearch.value.toLowerCase();
                filtered = filtered.filter(l =>
                    l.cliente.toLowerCase().includes(search) ||
                    l.key.toLowerCase().includes(search) ||
                    l.email.toLowerCase().includes(search)
                );
            }

            if (licenseTypeFilter.value) {
                filtered = filtered.filter(l => l.type === licenseTypeFilter.value);
            }

            return filtered;
        });

        const filterLicenses = () => {
            // Just trigger the computed property
            showToast('info', 'Filtro', 'Licenças filtradas');
        };



        // Local Notifications Methods
        const loadNotifications = async () => {
            const res = await apiCall('admin_get_notifications');
            if (res && res.notifications) {
                notifications_history.value = res.notifications;
            }
        };

        const sendNotification = async () => {
            if (!newNotification.value.message || !newNotification.value.title) {
                showToast('warning', 'Atenção', 'Preencha o título e a mensagem para enviar');
                return;
            }

            sendingNotification.value = true;

            // Payload Seguro
            const payload = {
                target: newNotification.value.target,
                type: newNotification.value.type,
                message: newNotification.value.message,
                title: newNotification.value.title,
                requireRead: newNotification.value.requireRead === true
            };

            const res = await apiCall('send_notification', 'POST', payload);

            sendingNotification.value = false;

            if (res && res.success) {
                showToast('success', 'Enviado', 'Broadcast realizado com sucesso!');

                // ATUALIZAÇÃO OTIMISTA DA UI
                const visualNotif = res.notification || {
                    ...payload,
                    date: new Date().toLocaleString('pt-BR'),
                    id: 'temp_' + Date.now()
                };

                notifications_history.value.unshift(visualNotif);

                // Reset Form
                newNotification.value.message = '';
                newNotification.value.title = '';
                newNotification.value.requireRead = false;
            } else {
                showToast('danger', 'Erro', 'Falha ao enviar notificação');
            }
        };

        const addLog = (msg, level = 'INFO') => {
            const ts = new Date().toLocaleTimeString('pt-BR');
            realTimeLogs.value.unshift({
                ts,
                msg,
                level
            });
            if (realTimeLogs.value.length > 50) realTimeLogs.value.pop();
        };

        const getTabTitle = (tab) => {
            const titles = {
                'dashboard': 'Visão Geral',
                'vendas': 'Transações',
                'licencas': 'Gerenciamento de Licenças',
                'crm': 'Relacionamento com Cliente',
                'financeiro': 'Controle Financeiro',
                'apps': 'Catálogo de Produtos',
                'parceiros': 'Afiliados & Parceiros',
                'notificacoes': 'Central de Notificações',
                'sistema': 'System Status & DevOps'
            };
            return titles[tab] || 'Painel';
        };

        const getTabIcon = (tab) => {
            const icons = {
                'dashboard': 'fa-solid fa-chart-line',
                'vendas': 'fa-solid fa-sack-dollar',
                'licencas': 'fa-solid fa-key',
                'crm': 'fa-solid fa-users',
                'financeiro': 'fa-solid fa-wallet',
                'apps': 'fa-solid fa-store',
                'parceiros': 'fa-solid fa-handshake',
                'notificacoes': 'fa-solid fa-bullhorn',
                'sistema': 'fa-solid fa-server'
            };
            return icons[tab] || 'fa-solid fa-cube';
        };

        const getTabBadge = (tab) => {
            const badges = {
                'dashboard': null,
                'vendas': vendas.value.length,
                'licencas': licencas.value.length,
                'crm': leads.value.length,
                'financeiro': null,
                'apps': apps.value.length,
                'parceiros': parceiros.value.length,
                'notificacoes': notifications_history.value.length,
                'sistema': null
            };
            return badges[tab];
        };

        const formatMoney = (val) => {
            if (typeof val !== 'number') val = parseFloat(val) || 0;
            return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };

        const formatDate = (dateStr) => {
            if (!dateStr || dateStr === '0000-00-00 00:00:00') return '---';
            return new Date(dateStr).toLocaleDateString('pt-BR');
        };

        const formatDateTime = (dateStr) => {
            if (!dateStr || dateStr === '0000-00-00 00:00:00') return '---';
            return new Date(dateStr).toLocaleString('pt-BR');
        };

        const formatPhone = (phone) => {
            if (!phone) return '---';
            const cleaned = phone.replace(/\D/g, '');
            if (cleaned.length === 11) {
                return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            } else if (cleaned.length === 10) {
                return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
            }
            return phone;
        };

        const getStatusClass = (status) => {
            if (status === 'approved' || status === 'paid' || status === 'active') return 'status-success';
            if (status === 'pending') return 'status-warning';
            if (status === 'refunded' || status === 'cancelled' || status === 'blocked' || status === 'expired') return 'status-danger';
            return 'status-neutral';
        };

        const getStatusLabel = (status) => {
            const map = {
                'approved': 'Aprovado',
                'paid': 'Pago',
                'pending': 'Pendente',
                'refunded': 'Estornado',
                'cancelled': 'Cancelado',
                'active': 'Ativo',
                'blocked': 'Bloqueado',
                'expired': 'Expirado'
            };
            return map[status] || status;
        };

        const getLogLevelClass = (level) => {
            const l = level ? level.toUpperCase() : 'INFO';
            const classes = {
                'ERROR': 'text-danger fw-bold',
                'CRITICAL': 'text-danger fw-bold bg-dark p-1 rounded',
                'CRÍTICO': 'text-danger fw-bold bg-dark p-1 rounded',
                'WARN': 'text-warning',
                'INFO': 'text-info',
                'SUCCESS': 'text-success'
            };
            return classes[l] || 'text-white';
        };

        const clearNotifications = async () => {
            if (!confirm('ATENÇÃO: Isso apagará TODO o histórico de notificações para todos os usuários. Deseja continuar?')) return;

            try {
                const res = await apiCall('clear_notifications', 'POST', {});
                if (res && res.success) {
                    showToast('success', 'Limpeza Concluída', 'Histórico de notificações apagado.');
                    notifications_history.value = [];
                    await refreshData();
                } else {
                    showToast('danger', 'Erro', 'Falha ao limpar notificações.');
                }
            } catch (e) {
                showToast('danger', 'Erro', 'Erro de conexão');
            }
        }

        const resetDevice = async (lic) => {
            if (!confirm(`Deseja realmente desvincular o dispositivo da licença ${lic.key}? O cliente poderá ativar em um novo aparelho.`)) return;

            try {
                const res = await apiCall('update_status', 'POST', {
                    key: lic.key,
                    status: 'reset_device'
                });

                if (res && res.success) {
                    showToast('success', 'Dispositivo Desvinculado', 'A licença está pronta para nova ativação.');
                    await refreshData();
                } else {
                    showToast('danger', 'Erro', res.error || 'Falha ao resetar');
                }
            } catch (e) {
                showToast('danger', 'Erro', 'Erro de conexão');
            }
        };

        const copyToClipboard = async (text) => {
            try {
                await navigator.clipboard.writeText(text);
                showToast('success', 'Copiado', 'Texto copiado para a área de transferência');
            } catch (err) {
                showToast('danger', 'Erro', 'Não foi possível copiar o texto');
            }
        };

        const copyCheckout = (app) => {
            const link = `https://plenaaplicativos.com.br/checkout.html?prod=${app.slug}&price=${app.price}`;
            copyToClipboard(link);
        };

        const printSaleDetails = () => {
            window.print();
        };

        const openEditAppModal = (app) => {
            console.log("Opening App Edit for:", app);

            // 1. Set Data
            editingApp.value = { ...app };

            // 2. Show Modal (DOM is always ready now)
            if (!editAppModalBS) {
                const el = document.getElementById('editAppModal');
                if (el) {
                    editAppModalBS = new bootstrap.Modal(el);
                } else {
                    alert("Erro Crítico: Modal não encontrado!");
                    return;
                }
            }
            editAppModalBS.show();
        };

        const updateAppConfig = async () => {
            if (!editingApp.value) return;

            const res = await apiCall('update_app', 'POST', {
                slug: editingApp.value.slug,
                name: editingApp.value.name,
                price: editingApp.value.price
            });

            if (res && res.success) {
                showToast('success', 'Configuração Salva', 'Produto atualizado com sucesso!');
                editAppModalBS.hide();
                refreshData();
            }
        };

        const openFinanceModal = () => {
            // Reset form
            newTrans.value = { type: 'expense', amount: '', description: '', category: 'outros' };
            financeModalBS.show();
        };

        const createTransaction = async () => {
            if (!newTrans.value.amount || newTrans.value.amount <= 0) {
                showToast('warning', 'Atenção', 'Informe um valor válido');
                return;
            }
            if (!newTrans.value.description) {
                showToast('warning', 'Atenção', 'Informe uma descrição');
                return;
            }

            const res = await apiCall('finance_add', 'POST', {
                type: newTrans.value.type,
                amount: newTrans.value.amount,
                description: newTrans.value.description,
                category: newTrans.value.category
            });

            if (res && res.success) {
                showToast('success', 'Lançamento Realizado', 'Movimentação registrada com sucesso!');
                financeModalBS.hide();
                refreshData();
            } else {
                showToast('danger', 'Erro', 'Falha ao realizar lançamento');
            }
        };

        // End of Methods (Hooks)

        return {
            // State
            isAuthenticated, loginPassword, loggingIn, sidebarToggled,
            currentTab, chartPeriod,
            newLicense, editingLicense, editingApp, newPartner, editingPartner, newTrans, newLead, // Added editingApp
            selectedSale, saleLogs,
            kpi, vendas, licencas, apps, financeiro, parceiros, leads, logs, realTimeLogs,
            statsLicencas, statsParceiros,
            salesSearch, salesStatusFilter, salesDateFilter, licenseSearch, licenseTypeFilter,
            systemStatus, diagnosisLoading, testEmail, testEmailResult, lastBackup,
            newNotification, notifications_history, sendingNotification,
            topProducts, activeDevicesCount,
            loading, loadingMessage, refreshing, creatingLicense, updatingLicense, savingPartner,
            toasts,

            // Methods
            login, logout, setCurrentTab,
            refreshData, updateChart,
            openNewLicenseModal, createLicense, openEditModal, updateLicense, toggleBlock, renewLicense,
            updateLicenseStats, isExpiringSoon,
            filteredSales, viewSaleDetails, resendSaleEmail, refundSale,
            openPartnerModal, createPartner, updatePartner, editPartner, deletePartner, settlePartner,
            updatePartnerStats, exportPartners,
            runSystemDiagnosis, sendTestEmail,
            sendNotification, getNotificationTypeLabel, clearNotifications,
            openNewLeadModal, saveLead, editLead, getLeadStatusClass,
            openAppDetails, openNewAppModal, openEditAppModal, updateAppConfig, // Replaced saveAppConfig
            openFinanceModal, createTransaction,
            createBackup, clearCache, optimizeDatabase, clearLogs, downloadLogs,
            filteredLicenses,
            showToast, removeToast, getToastIcon,
            addLog,
            getTabTitle, getTabIcon, getTabBadge,
            formatMoney, formatDate, formatDateTime, formatPhone,
            getStatusClass, getStatusLabel, getLogLevelClass,
            copyToClipboard, copyCheckout, printSaleDetails,
            resetDevice
        };
    }
}).mount('#app');