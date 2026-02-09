class Utils {
    static uid() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static fmtMoney(n) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
    }

    static fmtDate(dateStr) {
        if (!dateStr) return '';
        return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr));
    }

    static getChartColors() {
        return {
            bg: ['rgba(14, 165, 233, 0.2)', 'rgba(168, 85, 247, 0.2)', 'rgba(34, 197, 94, 0.2)', 'rgba(239, 68, 68, 0.2)', 'rgba(234, 179, 8, 0.2)'],
            border: ['#0ea5e9', '#a855f7', '#22c55e', '#ef4444', '#eab308']
        };
    }
}

// Global Helper to maintain compatibility
const _ = (id) => document.getElementById(id);
const uid = Utils.uid;
const fmtMoney = Utils.fmtMoney;
