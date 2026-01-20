import os
import glob
import re

# Configs
APPS_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"
BACKUPS_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\backups"

def deep_clean_apps():
    print(" Iniciando limpeza profunda e remoção de bloqueios...")
    
    html_files = glob.glob(os.path.join(APPS_DIR, "*.html"))
    
    for filepath in html_files:
        filename = os.path.basename(filepath)
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 1. Remove plena-lock.js
        if 'plena-lock.js' in content:
            # Try specific script tag removal
            content = content.replace('<script src="../assets/js/plena-lock.js"></script>', '')
            # Try generic just in case it's different path 
            content = re.sub(r'<script src=".*plena-lock\.js"></script>', '', content)
            
        # 2. Remove Service Worker Registration (Standardized Block)
        sw_pattern = r'<script>\s*if\s*\(\'serviceWorker\'\s*in\s*navigator\)\s*\{\s*navigator\.serviceWorker\.register\(\'\.\./sw\.js\'\);\s*\}\s*</script>'
        content = re.sub(sw_pattern, '', content, flags=re.DOTALL)
        
        # Remove empty lines left behind (optional, but good for cleanliness)
        content = re.sub(r'\n\s*\n', '\n', content)

        if content != original_content:
            print(f"Limpo: {filename}")
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
        else:
            # Check just to be sure
            if 'plena-lock.js' in content:
                print(f"ALERTA: {filename} ainda pode conter plena-lock.js (regex falhou?)")
    
    print("\n Removendo arquivos .bak...")
    
    # Remove .bak in APPS_DIR
    bak_files_apps = glob.glob(os.path.join(APPS_DIR, "*.bak"))
    for bak in bak_files_apps:
        try:
            os.remove(bak)
            print(f"Removido: {os.path.basename(bak)}")
        except Exception as e:
            print(f"Erro ao remover {bak}: {e}")

    # Remove files in BACKUPS_DIR (Assuming user wants those gone too per "exclua todos os arquivos de bak")
    # Be careful, maybe they meant just the ones generated alongside htmls. 
    # But usually "exclua todos" implies cleanup.
    # The previous instruction moved .bak to backups/.
    # So I will clean backups/ folder of .bak files too.
    bak_files_backups = glob.glob(os.path.join(BACKUPS_DIR, "*.bak"))
    for bak in bak_files_backups:
         try:
            os.remove(bak)
            print(f"Removido backup: {os.path.basename(bak)}")
         except Exception as e:
            print(f"Erro ao remover {bak}: {e}")

    print("\nConcluído.")

if __name__ == "__main__":
    deep_clean_apps()
