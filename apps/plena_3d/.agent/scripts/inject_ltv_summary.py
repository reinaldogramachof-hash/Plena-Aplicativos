
import os

file_path = r'c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps\plena_3d\index.html'

def inject_ltv(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Target the condition where history > 0
        search_block = """const historyList = _('cli-history-list');
                                                            if (stats.projects.length > 0) {
                                                                historyList.innerHTML = stats.projects.sort((a, b) => new Date(b.date) - new Date(a.date)).map(p => `"""
        
        # We want to insert the LTV header inside the if block, BEFORE the map loop starts building the list string
        # Actually, innerHTML interprets the string.
        # So we can just prepend the header string to the map result.
        # Like: historyList.innerHTML = `<header>...</header>` + stats.projects.map(...)
        
        replacement_block = """const historyList = _('cli-history-list');
                                                            if (stats.projects.length > 0) {
                                                                const ltvHeader = `
<div class="bg-cyan-900/20 border border-cyan-500/30 p-4 rounded-xl mb-4 flex justify-between items-center">
    <div>
        <p class="text-xs text-cyan-400 font-bold uppercase tracking-wider">Total Investido</p>
        <p class="text-xs text-slate-400">Lifetime Value (LTV)</p>
    </div>
    <div class="text-right">
        <p class="text-2xl font-bold text-white font-mono">${fmtMoney(stats.ltv)}</p>
    </div>
</div>`;
                                                                historyList.innerHTML = ltvHeader + stats.projects.sort((a, b) => new Date(b.date) - new Date(a.date)).map(p => `"""

        # Perform replacement
        # Need to handle potential indentation differences again.
        # Use a simpler anchor if possible.
        anchor = "if (stats.projects.length > 0) {\n                                                                historyList.innerHTML = stats.projects.sort"
        
        if anchor in content:
            content = content.replace(anchor, """if (stats.projects.length > 0) {
                                                                const ltvHeader = `
<div class="bg-cyan-900/20 border border-cyan-500/30 p-4 rounded-xl mb-4 flex justify-between items-center">
    <div>
        <p class="text-xs text-cyan-400 font-bold uppercase tracking-wider">Total Investido</p>
        <p class="text-xs text-slate-400">Lifetime Value (LTV)</p>
    </div>
    <div class="text-right">
        <p class="text-2xl font-bold text-white font-mono">${fmtMoney(stats.ltv)}</p>
    </div>
</div>`;
                                                                historyList.innerHTML = ltvHeader + stats.projects.sort""")
            print("LTV header injected via Anchor 1.")
        else:
            print("Anchor 1 failed. Trying broader match.")
            # Trying to replace the exact line read from view_file
            old_line = "historyList.innerHTML = stats.projects.sort((a, b) => new Date(b.date) - new Date(a.date)).map(p => `"
            if old_line in content:
                 content = content.replace(old_line, """const ltvDisplay = `<div class="bg-gradient-to-r from-slate-900 to-slate-800 border border-white/10 p-4 rounded-xl mb-4 flex justify-between items-center shadow-lg">
    <div>
        <p class="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-1"><i data-lucide="wallet" class="w-3 h-3 inline mr-1"></i>Total Investido</p>
        <div class="h-1 w-12 bg-cyan-500/30 rounded-full"></div>
    </div>
    <p class="text-2xl font-bold text-white font-mono tracking-tight">${fmtMoney(stats.ltv)}</p>
</div>`;
                                                                historyList.innerHTML = ltvDisplay + stats.projects.sort((a, b) => new Date(b.date) - new Date(a.date)).map(p => `""")
                 print("LTV header injected via explicit line match.")
            else:
                 print("Critical: Could not find history list render line.")

        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(f"File updated. New size: {len(content)}")

    except Exception as e:
        print(f"Error: {e}")

inject_ltv(file_path)
