import os
import re
import sys

# --- CONFIGURAÇÃO DOS TEMPLATES (A FONTE DA VERDADE) ---

TEMPLATE_SIDEBAR_BTN = """
<button @click="currentTab = 'sistema'" 
    :class="currentTab === 'sistema' ? 'bg-plena-{COLOR_NAME} shadow-lg shadow-{COLOR_NAME}-900/50 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'"
    class="w-full flex items-center px-4 py-3 rounded-xl transition-all font-medium mt-auto group relative">
    <i class="fa-solid fa-microchip w-5 h-5 mr-3"></i>
    <span class="font-medium">Sistema</span>
    <span id="sidebar-badge" class="hidden ml-auto flex h-3 w-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
    </span>
</button>
"""

TEMPLATE_SYSTEM_TAB = """
<div v-if="currentTab === 'sistema'" class="animate-fade-in-up">
    <div class="mb-8 flex justify-between items-end">
        <div>
            <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Sistema e Atualizações</h2>
            <p class="text-slate-500 text-sm mt-1">Central de notificações e controle de versão.</p>
        </div>
        <div class="hidden md:flex items-center gap-2 px-3 py-1 bg-{COLOR_NAME}-50 text-{COLOR_NAME}-700 rounded-full text-xs font-bold border border-{COLOR_NAME}-100">
            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-6">
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-slate-700 flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-{COLOR_NAME}-50 flex items-center justify-center text-plena-{COLOR_NAME}">
                            <i class="fa-regular fa-bell"></i>
                        </div>
                        Notificações
                    </h3>
                    <button onclick="window.markAllAsRead()" class="text-xs font-medium text-slate-400 hover:text-plena-{COLOR_NAME} transition flex items-center gap-1">
                        <i class="fa-solid fa-check-double"></i> Limpar
                    </button>
                </div>
                <div id="notification-feed-container" class="space-y-3 min-h-[100px]">
                    <div class="text-center py-8 opacity-50">
                        <i class="fa-solid fa-circle-notch fa-spin text-plena-{COLOR_NAME} mb-2"></i>
                        <p class="text-xs text-slate-400">Sincronizando...</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="space-y-6">
            <div class="bg-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden group">
                <div class="absolute -right-6 -top-6 opacity-5 transform rotate-12"><i class="fa-solid fa-microchip text-[150px]"></i></div>
                <div class="relative z-10">
                    <div class="text-[10px] uppercase tracking-widest font-bold mb-1 text-slate-400">VERSÃO</div>
                    <div class="text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-{COLOR_NAME}-300">v5.3</div>
                    <div class="text-slate-400 text-xs mb-6 border-l-2 border-slate-700 pl-3">Build 2026.01.24<br>Plena Pro</div>
                    <button onclick="window.location.reload()" class="w-full bg-plena-{COLOR_NAME} hover:bg-{COLOR_NAME}-600 text-white font-bold py-3 rounded-xl transition shadow-lg flex items-center justify-center gap-2">
                        <i class="fa-solid fa-rotate"></i> Atualizar
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
"""

TEMPLATE_PWA_TOAST = """
<div id="pwa-install-toast" class="fixed bottom-4 left-4 right-4 z-[9999] hidden animate-slide-in">
    <div class="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-slate-700 max-w-md mx-auto w-full">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-plena-{COLOR_NAME} rounded-xl flex items-center justify-center shrink-0">
                <i class="fa-solid fa-download text-white"></i>
            </div>
            <div>
                <h4 class="font-bold text-sm">Instalar Aplicativo</h4>
                <p class="text-xs text-slate-400">Acesso offline e tela cheia.</p>
            </div>
        </div>
        <div class="flex items-center gap-2">
            <button onclick="dismissInstall()" class="p-2 text-slate-400 hover:text-white transition"><i class="fa-solid fa-xmark"></i></button>
            <button onclick="installPWA()" class="bg-plena-{COLOR_NAME} hover:bg-{COLOR_NAME}-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition shadow-lg">INSTALAR</button>
        </div>
    </div>
</div>
"""

def apply_standard(file_path, color_name):
    print(f">> Padronizando {file_path} com cor '{color_name}'...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Preparar Templates com a cor correta
    sidebar_btn = TEMPLATE_SIDEBAR_BTN.replace("{COLOR_NAME}", color_name)
    system_tab = TEMPLATE_SYSTEM_TAB.replace("{COLOR_NAME}", color_name)
    pwa_toast = TEMPLATE_PWA_TOAST.replace("{COLOR_NAME}", color_name)

    # 1. REMOVER CÓDIGOS ANTIGOS (Limpeza)
    # Remove botão sistema antigo (regex flexível)
    content = re.sub(r'<button[^>]*@click="currentTab\s*=\s*[\'"]sistema[\'"][^>]*>.*?</button>', '', content, flags=re.DOTALL)
    # Remove aba sistema antiga
    content = re.sub(r'<div[^>]*v-if="currentTab\s*=\s*[\'"]sistema[\'"][^>]*>.*?</div>', '', content, flags=re.DOTALL)
    # Remove PWA Toast antigo
    content = re.sub(r'<div[^>]*id="pwa-install-toast"[^>]*>.*?</div>', '', content, flags=re.DOTALL)

    # 2. INJEÇÃO (Inserir versões novas)
    
    # Inserir Botão Sidebar se não existir
    if "currentTab = 'sistema'" not in content:
        # Tenta inserir antes do fechamento da nav
        if '</nav>' in content:
            content = content.replace('</nav>', sidebar_btn + '\n</nav>')
    
    # Inserir Aba Sistema se não existir
    if 'v-if="currentTab === \'sistema\'"' not in content:
        # Tenta inserir antes do fechamento do container principal ou body
        if '</main>' in content:
            content = content.replace('</main>', system_tab + '\n</main>')
        elif '</body>' in content:
            content = content.replace('</body>', system_tab + '\n</body>')

    # Inserir PWA Toast
    if 'id="pwa-install-toast"' not in content:
        content = content.replace('</body>', pwa_toast + '\n</body>')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"[OK] Sucesso! Arquivo {file_path} atualizado.")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python apply_plena_standard.py <caminho_arquivo> <cor>")
    else:
        apply_standard(sys.argv[1], sys.argv[2])
