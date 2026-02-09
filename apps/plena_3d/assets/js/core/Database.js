class Database {
    constructor() {
        this.key = 'plena3d_db_v1';
        this.data = {
            projects: [],
            clients: [],
            sales: [], // Future PDV
            financial: [],
            inventory: [], // Impressoras, Filamentos, Resinas, Peças
            inventoryLogs: [],
            settings: { watts: 300, kwh: 0.95, depreciation: 2.0, failure: 10, storeName: 'Plena 3D', storeDoc: '' }
        };
    }

    load() {
        const stored = localStorage.getItem(this.key);
        if (stored) {
            try {
                this.data = JSON.parse(stored);
                // Schema Migration check could go here
                if (!this.data.inventoryLogs) this.data.inventoryLogs = [];
            } catch (e) {
                console.error('Data Corrupted', e);
            }
        }
    }

    save() {
        localStorage.setItem(this.key, JSON.stringify(this.data));
    }

    backup() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.data));
        const anchor = document.createElement('a');
        anchor.setAttribute("href", dataStr);
        anchor.setAttribute("download", "plena3d_backup_" + new Date().toISOString().slice(0, 10) + ".json");
        anchor.click();
    }

    restore(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target.result);
                    if (json.settings && json.projects) {
                        this.data = json;
                        this.save();
                        resolve(true); // Success
                    } else {
                        reject('Arquivo Inválido');
                    }
                } catch (err) {
                    reject('Erro JSON: ' + err);
                }
            };
            reader.readAsText(file);
        });
    }

    // Helper for easier access
    get projects() { return this.data.projects; }
    get clients() { return this.data.clients; }
    get inventory() { return this.data.inventory; }
    get financial() { return this.data.financial; }
    get settings() { return this.data.settings; }
    get inventoryLogs() { return this.data.inventoryLogs; }
}

const DB = new Database(); // Singleton instance
