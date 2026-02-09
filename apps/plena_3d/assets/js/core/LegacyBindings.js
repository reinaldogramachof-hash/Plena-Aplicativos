// Mapeamento de funções globais (do HTML antigo) para a nova arquitetura de classes

// Utils
window._ = _;
window.fmtMoney = fmtMoney;
window.uid = uid;

// Navegação
window.router = (view) => App.router(view);
window.closeModal = (id) => App.closeModal(id);

// ProjectManager
window.openProjectModal = (id) => App.projectManager.openModal(id);
window.submitProject = (e) => App.projectManager.submit(e);
window.renderProjects = (ctx) => App.projectManager.render(ctx);
window.promoteStatus = (id) => App.projectManager.promoteStatus(id);
window.rejectStatus = (id) => App.projectManager.rejectStatus(id);
window.deleteProject = (id) => App.projectManager.delete(id);
window.duplicateProject = (id) => App.projectManager.duplicate(id);
window.openBudgetModal = (id) => App.projectManager.openBudgetModal(id);
window.calculateCost = () => App.projectManager.calculateCost();

// ClientManager
window.openClientModal = () => App.clientManager.openDetails(); // Legacy naming adaptation
window.openClientDetails = (id) => App.clientManager.openDetails(id);
window.submitClient = (e) => App.clientManager.submit(e);
window.renderClients = () => App.clientManager.render();
window.openProjectModalForClient = (id) => App.clientManager.openProjectModalForClient(id);
window.openWhatsappActions = (id) => App.clientManager.openWhatsappActions(id);
window.selectWaTemplate = (idx) => App.clientManager.selectWaTemplate(idx);
window.confirmWhatsappSend = () => App.clientManager.confirmSend();
window.switchClientTab = (tab) => App.clientManager.switchTab(tab);
window.sendWhatsapp = (id) => App.clientManager.sendWhatsapp(id); // Check if this is in Client or Project Manager

// InventoryManager
window.renderInventory = () => App.inventoryManager.render();
window.switchInventoryTab = (tab) => App.inventoryManager.switchTab(tab);
window.editInventoryItem = (id) => App.inventoryManager.editItem(id);
window.deleteInventoryItem = (id) => App.inventoryManager.deleteItem(id);
window.submitFilament = (e) => App.inventoryManager.submitFilament(e); // Legacy, check if exists or if unified in submit
// Unified submit in InventoryManager is 'submit'. Old HTML called submitFilament for filaments?
// Actually in the old code there was submitFilament. In new code it seems to be unified submit.
// We might need to adjust the HTML for this one or map it.
window.openMaintenanceModal = (id) => App.inventoryManager.openMaintenanceModal(id);
window.submitMaintenance = (e) => App.inventoryManager.submitMaintenance(e);
// Map generic inventory actions
window.openInventoryModal = (id) => App.inventoryManager.openModal(id);
window.submitInventory = (e) => App.inventoryManager.submit(e);
window.updateInventoryFormFields = () => App.inventoryManager.updateFormFields();

// FinancialManager
window.openTransactionModal = (id) => App.financialManager.openModal(id);
window.submitTransaction = (e) => App.financialManager.submit(e);
window.deleteTransaction = (id) => App.financialManager.delete(id);
window.renderFinancial = () => App.financialManager.render();

// Dashboard & Reports
window.renderDashboard = () => App.dashboardManager.render();
window.renderReports = () => App.reportsManager.render();
window.printReport = () => App.reportsManager.printReport();

// Settings
window.saveSettings = (e) => App.settingsManager.save(e);
window.seedTestData = () => TestData.seed();
