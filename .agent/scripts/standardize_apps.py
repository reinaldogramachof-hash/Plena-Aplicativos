import os
import re
import json
import glob

# Configurações
APPS_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"
MODAL_HTML_TEMPLATE = """
    <!-- Custom Confirm Modal -->
    <div id="customConfirmModal" class="fixed inset-0 bg-black/50 z-[60] hidden items-center justify-center backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fade-in border border-gray-100">
            <div class="p-6 text-center">
                <div id="confirmIcon" class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="alert-triangle" class="w-8 h-8 text-red-600"></i>
                </div>
                <h3 id="confirmTitle" class="text-xl font-bold text-gray-900 mb-2">Confirmar Ação</h3>
                <p id="confirmMessage" class="text-gray-600 text-sm mb-6">Tem certeza que deseja prosseguir com esta ação?</p>

                <div class="flex gap-3 justify-center">
                    <button onclick="closeConfirmModal(false)" class="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors flex-1">
                        Cancelar
                    </button>
                    <button id="confirmBtn" class="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors flex-1 shadow-lg shadow-red-200">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    </div>
"""

NOTIFICATION_FUNC = """
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
                    <span>${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>
                </div>
            `;

            document.body.appendChild(notification);
            if (window.lucide) lucide.createIcons();

            // Remover após 3 segundos
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
"""

CONFIRM_FUNC = """
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
                confirmBtn.classList.add('bg-plena-blue', 'hover:bg-plena-dark', 'shadow-blue-200');
                iconContainer.classList.add('bg-blue-100');
                icon.classList.add('text-plena-blue');
                icon.setAttribute('data-lucide', 'help-circle');
            }

            confirmBtn.textContent = confirmText;
            confirmBtn.onclick = () => {
                closeConfirmModal(true);
                if (onConfirm) onConfirm();
            };

            if (window.lucide) lucide.createIcons();
            document.getElementById('customConfirmModal').classList.remove('hidden');
            document.getElementById('customConfirmModal').classList.add('flex');
        }

        function closeConfirmModal(confirmed) {
            document.getElementById('customConfirmModal').classList.add('hidden');
            document.getElementById('customConfirmModal').classList.remove('flex');
        }
"""

def extract_manifest(content, filename):
    # Regex to find data URI manifest
    match = re.search(r'href=[\'"]data:application/manifest\+json,({.*?})[\'"]', content)
    if match:
        try:
            json_str = match.group(1)
            # Decode URL encoded chars if any (basic check)
            if '%' in json_str:
                import urllib.parse
                json_str = urllib.parse.unquote(json_str)
            
            manifest_data = json.loads(json_str)
            
            # Clean filename to get base name
            base_name = os.path.basename(filename).replace('.html', '').replace('plena_', '')
            manifest_filename = f"manifest_{base_name}.json"
            
            # Write manifest file
            with open(os.path.join(APPS_DIR, manifest_filename), 'w', encoding='utf-8') as f:
                json.dump(manifest_data, f, indent=4, ensure_ascii=False)
                
            print(f"  [+] Manifesto extraído para {manifest_filename}")
            
            # Replace link in content
            new_link = f'href="{manifest_filename}"'
            content = content.replace(match.group(0), new_link)
            return content
        except Exception as e:
            print(f"  [!] Erro ao extrair manifesto: {e}")
            return content
    return content

def update_file(filepath):
    print(f"Processando: {os.path.basename(filepath)}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 0. Backup
    with open(filepath + '.bak', 'w', encoding='utf-8') as f:
        f.write(content)

    # 1. Manfiest Extraction
    content = extract_manifest(content, filepath)

    # 2. Add Service Worker Registration & Gatekeeper
    if '../sw.js' not in content:
        sw_script = """
    <script src="../assets/js/plena-lock.js"></script>
    <script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('../sw.js');
        }
    </script>
"""
        # Insert before closing head
        if '</head>' in content:
            content = content.replace('</head>', sw_script + '\n</head>')
    
    # Ensure plena-lock is there if logic above failed (e.g. only sw missing)
    if 'plena-lock.js' not in content:
         content = content.replace('<script src="https://cdn.tailwindcss.com"></script>', '<script src="../assets/js/plena-lock.js"></script>\n    <script src="https://cdn.tailwindcss.com"></script>')

    # 3. Update Year
    content = content.replace('2024', '2026').replace('2025', '2026')

    # 4. Remove Old License Logic
    content = re.sub(r'const LICENSE_DATA = \{.*?\};', '', content, flags=re.DOTALL)
    content = re.sub(r'/\* --- SECURITY: INJECTED UTILITIES & LOGIC --- \*/.*?\}\)\(\);', '', content, flags=re.DOTALL)

    # 5. Inject Watermark in init()
    if 'injectWatermark' not in content:
        if 'function init() {' in content:
            content = content.replace('function init() {', 'function init() {\n            injectWatermark();')
        elif 'document.addEventListener(\'DOMContentLoaded\', () => {' in content:
             content = content.replace('document.addEventListener(\'DOMContentLoaded\', () => {', 'document.addEventListener(\'DOMContentLoaded\', () => {\n            injectWatermark();')

    # 6. Replace alert()
    # Simple replace for alert('string')
    content = re.sub(r'alert\((.*?)\)', r'showNotification(\1)', content)
    content = content.replace('window.showNotification', 'showNotification') # Fix over-correction if window.alert existed

    # 7. Inject Modal HTML & Functions
    if 'id="customConfirmModal"' not in content:
        content = content.replace('</body>', MODAL_HTML_TEMPLATE + '\n</body>')
    
    functions_to_inject = ""
    if 'function showNotification' not in content:
        functions_to_inject += NOTIFICATION_FUNC + "\n"
    
    if 'function showCustomConfirm' not in content:
        functions_to_inject += CONFIRM_FUNC + "\n"

    if functions_to_inject:
        # Inject functions before the last script tag close
        if '</script>' in content:
            last_script_idx = content.rfind('</script>')
            if last_script_idx != -1:
                 content = content[:last_script_idx] + functions_to_inject + content[last_script_idx:]

    # Save
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("  [OK] Concluído.")

# Lista de arquivos para processar
# Adicione ou remova arquivos conforme necessidade
files_to_process = [
    # "plena_odonto.html", # Exemplo
    "plena_pdv.html"
]

# Procurando todos os htmls que não sejam os já padronizados
all_htmls = glob.glob(os.path.join(APPS_DIR, "plena_*.html"))
processed_apps = [
    "plena_barbearia.html", 
    "plena_beleza.html", 
    "plena_alugueis.html",
    "plena_artesanato.html",
    "plena_assistencia.html",
    "plena_controle.html"
]

# Filtrar lista
queue = [f for f in all_htmls if os.path.basename(f) not in processed_apps]

print(f"Apps na fila para automação: {len(queue)}")
for app in queue:
    update_file(app)
