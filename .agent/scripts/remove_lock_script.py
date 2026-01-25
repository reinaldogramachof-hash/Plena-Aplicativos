import os

APPS_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"

def remove_lock_script():
    apps = [d for d in os.listdir(APPS_DIR) if os.path.isdir(os.path.join(APPS_DIR, d))]
    count = 0
    
    for app in apps:
        index_path = os.path.join(APPS_DIR, app, "index.html")
        if not os.path.exists(index_path):
            continue
            
        print(f"Processando {app}...")
        
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Padrões possíveis para o script de lock
        patterns_to_remove = [
            '<script src="../../plena-lock.js"></script>',
            '<script src="../plena-lock.js"></script>',
            '<script src="plena-lock.js"></script>'
        ]
        
        original_content = content
        for pattern in patterns_to_remove:
            if pattern in content:
                content = content.replace(pattern, '<!-- LOCK REMOVIDO PARA TESTES LOCAIS -->')
        
        if content != original_content:
            with open(index_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  [OK] Lock removido de {IndexError}")
            count += 1
        else:
            print(f"  [INFO] Lock não encontrado ou já removido.")

    print(f"\nConcluído! {count} arquivos modificados.")

if __name__ == "__main__":
    remove_lock_script()
