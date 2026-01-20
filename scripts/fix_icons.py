import os
import re

def fix_icons():
    directory = 'apps.plus'
    lucide_cdn_new = 'https://unpkg.com/lucide@0.378.0/dist/umd/lucide.js'
    
    # Mapeamento de Arquivo -> Ícone Principal (Header/Sidebar)
    theme_mapping = {
        'plena_artesanato.html': 'palette',
        'plena_assistencia.html': 'wrench',
        'plena_card.html': 'credit-card',
        'plena_controle.html': 'settings-2',
        'plena_delivery.html': 'shopping-bag',
        'plena_distribuidora.html': 'boxes',
        'plena_driver.html': 'car',
        'plena_entregas.html': 'package',
        'plena_estoque.html': 'archive',
        'plena_feirante.html': 'shopping-basket',
        'plena_financas.html': 'landmark',
        'plena_motoboy.html': 'bike',
        'plena_motorista.html': 'car',
        'plena_obras.html': 'hard-hat',
        'plena_orcamentos.html': 'file-text',
        'plena_pdv.html': 'shopping-cart',
        'plena_sorveteria.html': 'ice-cream'
    }

    if not os.path.exists(directory):
        print(f"Diretório {directory} não encontrado.")
        return

    for filename in os.listdir(directory):
        if filename.endswith('.html') and filename in theme_mapping:
            filepath = os.path.join(directory, filename)
            
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()
            
            original_content = content
            
            # 1. Atualizar CDN do Lucide
            # Captura variações como lucide@latest, lucide@0.X.X, com ou sem sufixo dist/umd
            content = re.sub(r'src=["\']https://unpkg\.com/lucide(@[\w\.]+)?(/dist/umd/lucide\.js)?["\']', 
                            f'src="{lucide_cdn_new}"', content)

            # 2. Ajuste Temático do Ícone Principal
            # Buscamos o primeiro <i> no sidebar (normalmente perto de PLENA [NOME])
            theme_icon = theme_mapping[filename]
            
            # Padrão: substituir o primeiro data-lucide que aparece logo após PLENA [APPNAME]
            # Ou o primeiro <i> no topo do arquivo que contenha data-lucide
            # Vamos ser mais conservadores e substituir o ícone que costuma estar no Sidebar Header
            def replace_first_icon(match):
                curr_icon = match.group(2)
                # Se for scissors (comum no template) ou se for diferente do planejado
                return f'data-lucide="{theme_icon}"'
            
            # Substitui apenas a primeira ocorrência do data-lucide que for o ícone de marca
            content = re.sub(r'data-lucide=["\'](scissors|calendar|layout-dashboard)["\']', 
                            f'data-lucide="{theme_icon}"', content, count=1)

            # 3. Garantir lucide.createIcons() no init
            if 'lucide.createIcons()' not in content:
                if 'function init()' in content:
                    content = content.replace('function init() {', 'function init() {\n                lucide.createIcons();')
                elif 'document.addEventListener(\'DOMContentLoaded\'' in content:
                    # Tenta injetar antes da função de init ser chamada
                    content = content.replace('DOMContentLoaded\', init)', 'DOMContentLoaded\', () => {\n                lucide.createIcons();\n                init();\n            })')

            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as file:
                    file.write(content)
                print(f"[OK] Corrigido e Tematizado: {filename} (Icon: {theme_icon})")
            else:
                print(f"- Sem alterações necessárias: {filename}")

if __name__ == "__main__":
    fix_icons()
