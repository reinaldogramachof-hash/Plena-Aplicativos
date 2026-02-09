# Arquitetura do Sistema Plena 3D (Refatorado)

Este documento detalha como o sistema foi reorganizado para garantir modularidade, manutenibilidade e escalabilidade, mantendo a simplicidade operacional (sem build steps complexos).

## 1. O Núcleo (Core)
O sistema não é mais um "monólito" (tudo misturado). Ele agora possui camadas claras:

*   **`Database.js` (A Memória):**
    *   Gerencia todo o acesso ao `localStorage`.
    *   Nenhum módulo acessa o `localStorage` diretamente. Eles pedem dados ao `Database`.
    *   **Responsabilidade:** Salvar, Carregar, Backup e Sanitização de dados.

*   **`App.js` (O Maestro):**
    *   É o ponto de entrada da aplicação.
    *   Inicializa todos os Gerentes (Managers).
    *   Controla a navegação (Router) e o ciclo de vida inicial da aplicação.
    *   **Exposto Globalmente:** `window.App` permite que o HTML converse com o JavaScript.

*   **`LegacyBindings.js` (O Tradutor):**
    *   Faz a ponte entre o HTML antigo (`onclick="submitProject()"`) e as novas Classes (`App.projectManager.submit()`).
    *   Isso permitiu manter o HTML quase intocado enquanto modernizávamos o JS.

## 2. Os Módulos (Gerentes Especialistas)
Cada parte do sistema agora tem um "Dono" (Manager). Eles são independentes em sua lógica interna, mas compartilham o mesmo Banco de Dados (`Database.data`).

### Exemplo: `ProjectManager.js`
*   **Sabe tudo sobre:** Projetos, Orçamentos e fila de impressão.
*   **Lógica Exclusiva:** Calcular custo (`calculateCost`), mudar status (`promoteStatus`), renderizar lista de projetos.
*   **Comunicação:** Quando um projeto é concluído, ele *pede* ao `FinancialManager` para registrar a venda.

### Exemplo: `FinancialManager.js`
*   **Sabe tudo sobre:** Dinheiro (Entradas e Saídas).
*   **Lógica Exclusiva:** Adicionar transação, calcular saldo, renderizar tabela financeira.
*   **Independência:** Ele não precisa saber *de onde* veio o dinheiro (se foi de um projeto ou lançamento manual), ele apenas registra.

### Lista de Módulos:
1.  **ProjectManager:** Projetos e Orçamentos.
2.  **FinancialManager:** Fluxo de Caixa.
3.  **InventoryManager:** Estoque (Impressoras, Filamentos, etc.).
4.  **ClientManager:** CRM e Clientes.
5.  **DashboardManager:** KPIs e Visão Geral (lê dados de todos os outros).
6.  **ReportsManager:** Relatórios e Impressão.
7.  **SupportManager:** Área de Suporte/Ajuda.
8.  **SettingsManager:** Configurações Globais da Loja.
9.  **PDVManager:** (Em Desenvolvimento) Frente de Caixa.

## 3. Como Eles Se Comunicam?
A "mágica" acontece via **Instância Global `App`**.

**Cenário Prático: Concluindo um Projeto**
1.  Usuário clica em "Concluir" no HTML.
2.  `LegacyBindings.js` intercepta e chama `App.projectManager.promoteStatus(id)`.
3.  `ProjectManager` altera o status do projeto para "Concluido".
4.  **Comunicação entre Módulos:**
    ```javascript
    // Dentro de ProjectManager.js
    if (nextStatus === 'Concluido') {
        // "Ei Financeiro, registra essa entrada aqui!"
        App.financialManager.addTransaction('income', ...);
    }
    ```
5.  `ProjectManager` salva o `Database`.
6.  `ProjectManager` pede para atualizar a tela (`this.refreshViews()`).

## 4. Benefícios Dessa Estrutura
*   **Organização:** Se der erro no Estoque, você sabe exatamente onde olhar (`InventoryManager.js`).
*   **Segurança:** Variáveis não ficam "soltas" no escopo global.
*   **Escalabilidade:** Para adicionar um novo módulo (ex: PDV), basta criar `PDVManager.js` e instanciá-lo no `App.js`, sem quebrar o resto do sistema.
