
import os
import re
import shutil

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def main():
    print(f"Iniciando correção de links na raiz: {ROOT_DIR}")
    
    # List html files in root only
    files = [f for f in os.listdir(ROOT_DIR) if f.endswith('.html') and os.path.isfile(os.path.join(ROOT_DIR, f))]
    
    total_fixes = 0
    modified_files = 0
    
    # Regex to find href="apps.plus/something.html"
    # Group 1: Quote ( " or ' )
    # Group 2: Slug ( nome_do_app )
    # Group 3: Quote match
    pattern = re.compile(r'href=(["\'])apps\.plus/([\w-]+)\.html(["\'])', re.IGNORECASE)
    
    for filename in files:
        filepath = os.path.join(ROOT_DIR, filename)
        
        # Ignora admin se desejar, mas o user pediu raiz
        if filename == 'admin.html': 
            # Admin pode ter links para apps, melhor checar
            pass
            
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            matches = pattern.findall(content)
            
            if matches:
                # Backup
                shutil.copy2(filepath, filepath + '.bak')
                
                # Replace
                # href="apps.plus/slug/" (linking to folder, server serves index.html)
                new_content = pattern.sub(r'href=\1apps.plus/\2/\3', content)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                    
                count = len(matches)
                print(f"[CORRIGIDO] {filename}: {count} links atualizados.")
                total_fixes += count
                modified_files += 1
            else:
                pass 
                # print(f"[INFO] {filename}: Nenhum link antigo encontrado.")
                
        except Exception as e:
            print(f"[ERRO] Falha ao processar {filename}: {e}")
            
    print(f"\nResumo: {total_fixes} links corrigidos em {modified_files} arquivos.")

if __name__ == "__main__":
    main()
