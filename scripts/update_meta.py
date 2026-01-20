import os
import re

def update_metadata():
    apps_dir = "apps.plus"
    if not os.path.exists(apps_dir):
        print(f"Erro: Pasta '{apps_dir}' não encontrada.")
        return

    # Padrões de substituição
    replacements = [
        (r'2025', '2026'),
        (r'tecnologia@plenainformatica\.com\.br', 'tecnologia@plenaaplicativos.com.br')
    ]

    files_updated = 0
    total_found = 0

    for filename in os.listdir(apps_dir):
        if filename.endswith(".html"):
            file_path = os.path.join(apps_dir, filename)
            
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            new_content = content
            made_changes = False

            for pattern, replacement in replacements:
                if re.search(pattern, new_content):
                    new_content = re.sub(pattern, replacement, new_content)
                    made_changes = True

            if made_changes:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Atualizado: {filename}")
                files_updated += 1
            else:
                print(f"Sem alterações: {filename}")

    print(f"\nResumo: {files_updated} arquivos atualizados.")

if __name__ == "__main__":
    update_metadata()
