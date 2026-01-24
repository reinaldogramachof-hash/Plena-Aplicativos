
import os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPS_PLUS_DIR = os.path.join(ROOT_DIR, 'apps.plus')
TOOLBAR_SCRIPT = '<script src="../../assets/js/plena-toolbar.js"></script>'
LOCK_ANCHOR = 'plena-lock.js"></script>'

def main():
    print(f"Iniciando injeção da Toolbar em: {APPS_PLUS_DIR}")
    
    if not os.path.exists(APPS_PLUS_DIR):
        print("Diretório apps.plus não encontrado.")
        return

    # Scan directories (since apps are now folders)
    dirs = [d for d in os.listdir(APPS_PLUS_DIR) if os.path.isdir(os.path.join(APPS_PLUS_DIR, d))]
    
    count = 0
    for app_dir_name in dirs:
        index_path = os.path.join(APPS_PLUS_DIR, app_dir_name, 'index.html')
        
        if os.path.exists(index_path):
            try:
                with open(index_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check if already injected
                if 'plena-toolbar.js' in content:
                    print(f"[OK] {app_dir_name} já possui Toolbar.")
                    continue
                    
                # Inject After Lock Script
                if LOCK_ANCHOR in content:
                    new_content = content.replace(LOCK_ANCHOR, f'{LOCK_ANCHOR}\n    {TOOLBAR_SCRIPT}')
                    
                    with open(index_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    
                    print(f"[OK] Toolbar injetada em {app_dir_name}")
                    count += 1
                else:
                    print(f"[AVISO] {app_dir_name} não tem script de Lock, injetando antes do body...")
                    if '</body>' in content:
                        new_content = content.replace('</body>', f'    {TOOLBAR_SCRIPT}\n</body>')
                        with open(index_path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"[OK] Toolbar (fallback) injetada em {app_dir_name}")
                        count += 1
                    else:
                        print(f"[ERRO] Não foi possível injetar em {app_dir_name} (sem body tag)")
                        
            except Exception as e:
                print(f"[ERRO] Falha ao processar {app_dir_name}: {e}")
                
    print(f"\nConcluído! Toolbar injetada em {count} apps.")

if __name__ == "__main__":
    main()
