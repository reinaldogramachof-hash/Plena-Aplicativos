import os
import re

def check_icons():
    directory = 'apps.plus'
    # Padrão recomendado pela Plena Aplicativos
    lucide_cdn = 'https://unpkg.com/lucide@0.378.0/dist/umd/lucide.js'
    
    issues = []

    if not os.path.exists(directory):
        print(f"Diretório {directory} não encontrado.")
        return

    for filename in os.listdir(directory):
        if filename.endswith('.html'):
            filepath = os.path.join(directory, filename)
            
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()
            
            file_issues = []
            
            # 1. Verificar CDN do Lucide
            if 'lucide' in content.lower():
                if lucide_cdn not in content:
                    file_issues.append("CDN Lucide desatualizada ou ausente")
                
                # 2. Verificar se lucide.createIcons() está presente
                if 'lucide.createIcons()' not in content:
                    file_issues.append("Chamada lucide.createIcons() não encontrada")

            # 3. Verificar tags <i> com data-lucide vazios ou mal formados
            lucide_tags = re.findall(r'<i[^>]*data-lucide=["\']\s*["\'][^>]*>', content)
            if lucide_tags:
                file_issues.append(f"{len(lucide_tags)} tags data-lucide vazias detectadas")

            # 4. Verificar tags com data-lucide que podem não ter sido fechadas
            if 'data-lucide' in content and '</i>' not in content:
                 file_issues.append("Possível erro de fechamento de tags <i>")

            if file_issues:
                issues.append({
                    'file': filename,
                    'errors': file_issues
                })

    if issues:
        print("Mapeamento de Erros de Ícones:")
        for issue in issues:
            print(f"\n[!] Arquivo: {issue['file']}")
            for err in issue['errors']:
                print(f"    - {err}")
    else:
        print("Nenhum erro óbvio de ícones detectado.")

if __name__ == "__main__":
    check_icons()
