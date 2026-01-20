import os
import re

def fix_file(file_path):
    print(f"Fixing {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(file_path, 'r', encoding='latin-1') as f:
            content = f.read()

    # 1. Define LICENSE_DATA if missing
    if 'const LICENSE_DATA' not in content:
        license_block = """
        // DADOS DA LICENCA
        const LICENSE_DATA = {
            active: false,
            ownerName: "",
            ownerDoc: ""
        };
"""
        # Insert after <script> tag
        content = re.sub(r'(<script[^>]*>)', r'\1' + license_block, content, count=1)

    # 2. Define injectWatermark if missing
    if 'function injectWatermark' not in content:
        watermark_func = """
        function injectWatermark() {
            // Marca d'agua na Sidebar
            const sidebarNav = document.querySelector('#sidebar nav');
            if (sidebarNav) {
                const watermarkDiv = document.createElement('div');
                watermarkDiv.className = 'mt-auto pt-6 pb-2 text-center opacity-50';
                watermarkDiv.innerHTML = `
                    <div class="test-xs font-mono text-white/40 mb-1">LICENCIADO PARA</div>
                    <div class="text-xs font-bold text-white/60">${LICENSE_DATA.ownerName}</div>
                    <div class="text-[10px] text-white/30">${LICENSE_DATA.ownerDoc}</div>
                `;
                sidebarNav.appendChild(watermarkDiv);
            }

            // Marca d'agua no rodape (visivel apenas na impressao)
            const printWatermark = document.createElement('div');
            printWatermark.className = 'hidden print:block fixed bottom-0 left-0 w-full text-center border-t border-gray-200 pt-2 pb-4 bg-white';
            printWatermark.innerHTML = `
                <p class="text-[10px] text-gray-400 uppercase tracking-widest">
                    Licenciado para ${LICENSE_DATA.ownerName} - Documento: ${LICENSE_DATA.ownerDoc} - Uso Autorizado
                </p>
            `;
            document.body.appendChild(printWatermark);
        }
"""
        # Insert before init() function
        content = re.sub(r'(function init\(\))', watermark_func + r'\n\1', content)

    # 3. Handle setupLicenseFeatures for checklist
    if 'setupLicenseFeatures()' in content and 'function setupLicenseFeatures' not in content:
        setup_func = """
        function setupLicenseFeatures() {
            // Implementacao simplificada para evitar erros
            console.log("License features initialized");
        }
"""
        # Insert before init() function
        content = re.sub(r'(function init\(\))', setup_func + r'\n\1', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed {file_path}")

apps_dir = r'c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus'
target_files = ['plena_checklist.html', 'plena_hamburgueria.html', 'plena_pizzaria.html']

for filename in target_files:
    path = os.path.join(apps_dir, filename)
    if os.path.exists(path):
        fix_file(path)
    else:
        print(f"File not found: {path}")
