const TestData = {
    seed() {
        if (!confirm('ATENÇÃO: Isso apagará TODOS os dados atuais e gerará um cenário de teste completo com histórico de 6 meses. Deseja continuar?')) return;

        // --- Helpers ---
        const _uid = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
        const _randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const _randArr = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const _randDate = (daysAgo) => {
            const d = new Date();
            d.setDate(d.getDate() - _randInt(0, daysAgo));
            d.setHours(_randInt(8, 18), _randInt(0, 59));
            return d.toISOString();
        };

        console.log('Iniciando geração de dados...');

        // --- 1. Clientes ---
        const clients = [
            { name: 'Roberto Carlos', phone: '11999998888', source: 'Instagram', type: 'PF' },
            { name: 'Mariana Souza Arq', phone: '21988887777', source: 'Indicação', type: 'PJ', notes: 'Paga sempre à vista.' },
            { name: 'Oficina do Zé', phone: '31977776666', source: 'Google', type: 'PJ' },
            { name: 'Ana Clara Cosplay', phone: '41966665555', source: 'Instagram', type: 'PF' },
            { name: 'Ricardo Tech', phone: '51955554444', source: 'Youtube', type: 'PF' },
            { name: 'Studio Decor', phone: '61944443333', source: 'Feira', type: 'PJ' },
            { name: 'Lucas Gamer', phone: '71933332222', source: 'Indicação', type: 'PF' },
            { name: 'Dra. Fernanda Odonto', phone: '81922221111', source: 'Google', type: 'PJ' },
            { name: 'Carlos Engenharia', phone: '91911110000', source: 'Linkedin', type: 'PJ' }
        ].map(c => ({
            id: _uid(),
            ...c,
            email: c.name.split(' ')[0].toLowerCase() + '@email.com',
            joined: _randDate(180)
        }));

        // --- 2. Estoque (Inventory) ---
        const printers = [
            { name: 'Creality K1', brand: 'Creality', cost: 3500, hours: 450 },
            { name: 'Bambu Lab P1S', brand: 'Bambu Lab', cost: 5600, hours: 120 },
            { name: 'Elegoo Mars 4', brand: 'Elegoo', cost: 2200, hours: 80, type: 'Resina' }
        ].map(p => ({
            id: _uid(),
            category: 'impressora',
            name: p.name,
            brand: p.brand,
            quantity: 1,
            cost: p.cost,
            price: 0,
            specs: { model: p.name, status: 'operacional', hoursUsed: p.hours }
        }));

        const filaments = [
            { name: 'PLA Premium Preto', brand: '3D Fila', color: 'Preto', cost: 95, price: 150, qty: 850, min: 200 },
            { name: 'PLA Silk Prata', brand: 'Voolt', color: 'Prata', cost: 130, price: 210, qty: 120, min: 500 }, // Baixo estoque
            { name: 'PETG Azul', brand: 'GTMax', color: 'Azul', cost: 85, price: 140, qty: 900, min: 200 },
            { name: 'ABS Natural', brand: '3D Fila', color: 'Natural', cost: 80, price: 130, qty: 450, min: 1000 }, // Baixo estoque
            { name: 'TPU Flexivel', brand: 'Creality', color: 'Vermelho', cost: 160, price: 250, qty: 800, min: 200 },
            { name: 'PLA Marble', brand: 'Voolt', color: 'Mármore', cost: 110, price: 180, qty: 1000, min: 200 }
        ].map(f => ({
            id: _uid(),
            category: 'filamento',
            name: f.name,
            brand: f.brand,
            quantity: f.qty,
            minStock: f.min,
            cost: f.cost,
            price: f.price,
            weight: 1000,
            unit: 'g',
            remaining: f.qty,
            specs: { type: f.name.split(' ')[0], color: f.color }
        }));

        const products = [
            { name: 'Spray Adesivo', cost: 25, price: 45, qty: 5 },
            { name: 'Bico 0.4mm Brass', cost: 12, price: 25, qty: 15 },
            { name: 'Cola Bastão', cost: 8, price: 18, qty: 10 },
            { name: 'Kit Acabamento', cost: 55, price: 90, qty: 3 }
        ].map(p => ({
            id: _uid(),
            category: 'peca',
            name: p.name,
            brand: 'Genérico',
            quantity: p.qty,
            minStock: 2,
            cost: p.cost,
            price: p.price,
            unit: 'un'
        }));

        const inventory = [...printers, ...filaments, ...products];

        // --- 3. Projetos e Lógica Financeira ---
        const projects = [];
        const transactions = [];

        // Gerar 40 projetos espalhados por 6 meses
        for (let i = 0; i < 40; i++) {
            const client = _randArr(clients);
            const filament = _randArr(filaments);
            const isCompleted = Math.random() > 0.3; // 70% de chance de estar concluído
            const date = _randDate(180);

            // Dados básicos do projeto
            const weight = _randInt(50, 600);
            const time = _randInt(2, 48);
            const materialCost = (filament.cost / 1000) * weight;
            const energyCost = time * 0.50; // Estimativa R$0.50/h
            const cost = materialCost + energyCost;
            const price = cost * _randInt(25, 40) / 10; // Margem 2.5x a 4.0x

            const projectStatus = isCompleted ? 'Concluido' : _randArr(['Orçamento', 'Fila', 'Imprimindo', 'Cancelado']);
            const projectId = _uid();

            projects.push({
                id: projectId,
                name: _randArr(['Busto Action Figure', 'Suporte Headset', 'Vaso Decorativo', 'Peça Técnica Engrenagem', 'Case Raspberry Pi', 'Porta Controle', 'Organizador de Cabos', 'Miniatura RPG']),
                clientId: client.id,
                filamentId: filament.id,
                weight: weight,
                time: time,
                price: parseFloat(price.toFixed(2)),
                cost: parseFloat(cost.toFixed(2)),
                status: projectStatus,
                date: date
            });

            // Se concluído, gera transação financeira (Entrada e Saída de Custo)
            if (projectStatus === 'Concluido') {
                // Entrada (Venda)
                transactions.push({
                    id: _uid(),
                    type: 'income',
                    category: 'Venda',
                    amount: parseFloat(price.toFixed(2)),
                    desc: `Projeto: ${clients.find(c => c.id === client.id).name}`,
                    date: date, // Data do projeto (simplificação)
                    method: _randArr(['Pix', 'Cartão Crédito', 'Dinheiro']),
                    refId: projectId
                });

                // Saída (Custo Material - Simulando reposição ou custo direto)
                // Opcional: nem todo projeto gera compra imediata, mas vamos simular 50% das vezes compra de material
                if (Math.random() > 0.5) {
                    transactions.push({
                        id: _uid(),
                        type: 'expense',
                        category: 'Material',
                        amount: parseFloat((filament.cost).toFixed(2)),
                        desc: `Reposição: ${filament.name}`,
                        date: date,
                        method: 'Boleto',
                        refId: null
                    });
                }
            }
        }

        // --- 4. Custos Fixos Mensais ---
        // Gerar despesas recorrentes para os últimos 6 meses
        for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            d.setDate(5); // Dia 5 de cada mês
            const dateStr = d.toISOString();

            transactions.push(
                { id: _uid(), type: 'expense', category: 'Energia', amount: _randInt(200, 350), desc: 'Conta LUZ', date: dateStr, method: 'Boleto' },
                { id: _uid(), type: 'expense', category: 'Internet', amount: 120, desc: 'Internet Fibra', date: dateStr, method: 'Débito' },
                { id: _uid(), type: 'expense', category: 'Aluguel', amount: 1500, desc: 'Aluguel Studio', date: dateStr, method: 'Transferência' }
            );
        }

        // --- 5. Caixa (PDV Register) ---
        // Criar uma sessão de caixa fechada ontem e uma aberta hoje
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const sessionHistory = {
            id: _uid(),
            openedAt: yesterday.toISOString(),
            closedAt: new Date().toISOString(),
            initialValue: 100,
            finalValue: 450, // Simplificado
            salesPerMethod: { 'Dinheiro': 350 }
        };

        const register = {
            status: 'open',
            currentSessionId: _uid(),
            sessions: [
                sessionHistory,
                { id: _uid(), openedAt: new Date().toISOString(), closedAt: null, initialValue: 100, finalValue: 0, salesPerMethod: {} } // Sessão atual
            ]
        };
        // Atualiza ID da sessão atual
        register.sessions[1].id = register.currentSessionId;


        // Salvar tudo
        const data = {
            projects: projects,
            clients: clients,
            transactions: transactions.sort((a, b) => new Date(b.date) - new Date(a.date)),
            inventory: inventory,
            inventoryLogs: [], // Logs vazio por enquanto
            register: register,
            settings: { watts: 350, kwh: 0.92, depreciation: 2.5, failure: 12, storeName: 'Plena 3D Studio', storeDoc: '12.345.678/0001-90', owner: 'Admin' }
        };

        DB.data = data;
        DB.save();

        console.log('Dados gerados com sucesso!');
        console.log(`Clientes: ${clients.length}`);
        console.log(`Estoque: ${inventory.length} itens`);
        console.log(`Projetos: ${projects.length}`);
        console.log(`Transações: ${transactions.length}`);

        alert('Banco de dados de teste recriado com sucesso! Recarregando...');
        location.reload();
    }
};
