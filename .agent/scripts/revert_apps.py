import os

# Configs
APPS_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"
BACKUP_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\backups"

def revert_process():
    print("Iniciando reversão dos aplicativos para o estado pré-padronização...")
    
    # 1. Restore from backups/ folder (Safest)
    if os.path.exists(BACKUP_DIR):
        print(f"Verificando backups em {BACKUP_DIR}")
        for filename in os.listdir(BACKUP_DIR):
            if filename.endswith(".html.bak"):
                original_name = filename.replace(".bak", "")
                target_path = os.path.join(APPS_DIR, original_name)
                source_path = os.path.join(BACKUP_DIR, filename)
                
                print(f"Restaurando {original_name} de {BACKUP_DIR}...")
                with open(source_path, 'r', encoding='utf-8') as src:
                    content = src.read()
                
                with open(target_path, 'w', encoding='utf-8') as dst:
                    dst.write(content)
                print("  [OK]")

    # 2. Check apps.plus/ for .bak files of apps NOT in backups/
    # This acts as a fallback for apps like plena_motoboy.html
    # BUT, we must be careful. If the .bak in apps.plus is also standardized, we are stuck.
    # However, the user asked to "revert locking process".
    # If .bak is also locked, we need to strip the lock manually.
    
    print("Verificando se há arquivos não cobertos pelo backup principal...")
    all_htmls = [f for f in os.listdir(APPS_DIR) if f.endswith(".html")]
    
    for filename in all_htmls:
        # Check if we already restored it (crude check: if it exists in backup dir)
        backup_name = filename + ".bak"
        if os.path.exists(os.path.join(BACKUP_DIR, backup_name)):
            continue # Already handled above
            
        # If not, check if local .bak exists
        local_backup_path = os.path.join(APPS_DIR, backup_name)
        if os.path.exists(local_backup_path):
            print(f"Restaurando backup local para {filename}...")
            # We restore it, but then we MUST sanitize it just in case
            with open(local_backup_path, 'r', encoding='utf-8') as src:
                content = src.read()
            
            # Check if it has lock
            if 'plena-lock.js' in content:
                print(f"  [!] O backup local de {filename} também contém o bloqueio. Tentando remover manualmente...")
                content = remove_lock_code(content)
            
            with open(os.path.join(APPS_DIR, filename), 'w', encoding='utf-8') as dst:
                dst.write(content)
            print("  [OK]")
        else:
            # No backup anywhere. Try to sanitize current file.
            print(f"Sem backup para {filename}. Sanitizando arquivo atual...")
            file_path = os.path.join(APPS_DIR, filename)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'plena-lock.js' in content:
                content = remove_lock_code(content)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print("  [OK] Sanitizado.")
            else:
                print("  [INFO] Arquivo parece limpo ou não modificado.")

def remove_lock_code(content):
    # Removes plena-lock.js script tags
    content = content.replace('<script src="../assets/js/plena-lock.js"></script>', '')
    
    # Removes the Service Worker registration block if it contains plena-lock logic
    # (My standardizer added them together often, or nearby)
    
    # Remove SW block
    sw_block = """
    <script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('../sw.js');
        }
    </script>
"""
    # Try exact match first (indentation varies)
    if sw_block.strip() in content:
         content = content.replace(sw_block.strip(), '')
    
    # Regex for sw block
    import re
    content = re.sub(r'<script>\s*if\s*\(\'serviceWorker\'\s*in\s*navigator\)\s*\{\s*navigator\.serviceWorker\.register\(\'\.\./sw\.js\'\);\s*\}\s*</script>', '', content)

    # Note: We do NOT revert alert() -> showNotification() replacements because that requires complex logic 
    # and might break the app more if we just remove the notification function definition without changing calls back.
    # The user complained about "perderam funções". If notification function is missing (which happens if I restore a partial backup without the function def), that breaks it.
    # So if we are sanitizing, we should KEEP the notification functions defs if they are used, but REMOVE the lock.
    # The lock is the main "travamento".
    
    return content

if __name__ == "__main__":
    revert_process()
