import os
import re

APP_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"

def fix_files():
    count = 0
    for root, dirs, files in os.walk(APP_DIR):
        for file in files:
            if file == "index.html":
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 1. Torna o texto longo sempre visível
                # Substitui <span class="hidden sm:inline">Texto</span> por <span>Texto</span>
                new_content = re.sub(r'<span class="hidden sm:inline">', '<span>', content)
                
                # 2. Remove o texto curto alternativo
                # Remove <span class="sm:hidden">Texto Curto</span>
                # O flag re.DOTALL não é usado propositalmente para não pegar multilinhas arriscadas demais, 
                # assumindo que esses spans são inline.
                new_content = re.sub(r'\s*<span class="sm:hidden">.*?</span>', '', new_content)
                
                # 3. Ajusta a margem do ícone para ser sempre visível (remove o prefixo sm:)
                new_content = new_content.replace('sm:mr-2', 'mr-2')

                if content != new_content:
                    print(f"Corrigindo: {filepath}")
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    count += 1

    print(f"Total de arquivos corrigidos: {count}")

if __name__ == "__main__":
    fix_files()
