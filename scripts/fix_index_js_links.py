
import os
import re
import shutil

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_FILE = os.path.join(ROOT_DIR, 'index.html')

def main():
    print(f"Iniciando correção de links JS em: {INDEX_FILE}")
    
    if not os.path.exists(INDEX_FILE):
        print("Arquivo index.html não encontrado.")
        return

    try:
        with open(INDEX_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Regex to find "apps.plus/slug.html" inside JS strings
        # Capture group 1: slug
        # We look for apps.plus/ followed by alphanumeric/underscore/dash followed by .html
        pattern = re.compile(r'apps\.plus/([\w-]+)\.html', re.IGNORECASE)
        
        matches = pattern.findall(content)
        
        if matches:
            # Backup
            shutil.copy2(INDEX_FILE, INDEX_FILE + '.js_fix.bak')
            
            # Replace
            # apps.plus/slug.html -> apps.plus/slug/
            new_content = pattern.sub(r'apps.plus/\1/', content)
            
            with open(INDEX_FILE, 'w', encoding='utf-8') as f:
                f.write(new_content)
                
            count = len(matches)
            print(f"[CORRIGIDO] index.html: {count} links JS atualizados.")
        else:
            print("[INFO] Nenhum link antigo encontrado em index.html.")
            
    except Exception as e:
        print(f"[ERRO] Falha ao processar index.html: {e}")

if __name__ == "__main__":
    main()
