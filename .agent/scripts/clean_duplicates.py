import os

APP_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"

def clean_duplicates():
    deleted_count = 0
    errors = 0
    
    # List all items in the directory
    try:
        items = os.listdir(APP_DIR)
    except FileNotFoundError:
        print(f"Directory not found: {APP_DIR}")
        return

    files = [f for f in items if os.path.isfile(os.path.join(APP_DIR, f))]
    dirs = [d for d in items if os.path.isdir(os.path.join(APP_DIR, d))]

    print(f"Analisando pasta: {APP_DIR}")
    print(f"Arquivos encontrados: {len(files)}")
    print(f"Diretórios encontrados: {len(dirs)}")
    print("-" * 30)

    for file in files:
        if file.endswith('.html'):
            # Get the name without extension (e.g., 'plena_barbearia.html' -> 'plena_barbearia')
            app_name = os.path.splitext(file)[0]
            
            # Check if a directory with this name exists
            if app_name in dirs:
                file_path = os.path.join(APP_DIR, file)
                try:
                    os.remove(file_path)
                    print(f"REMOVIDO: {file} (Versão segura existe em ./{app_name}/index.html)")
                    deleted_count += 1
                except Exception as e:
                    print(f"ERRO ao remover {file}: {e}")
                    errors += 1
            else:
                print(f"MANTIDO: {file} (Não encontrei pasta correspondente '{app_name}')")

    print("-" * 30)
    print(f"Concluído. Total removidos: {deleted_count}. Erros: {errors}")

if __name__ == "__main__":
    clean_duplicates()
