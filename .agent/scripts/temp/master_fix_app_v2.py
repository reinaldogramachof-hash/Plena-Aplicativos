
import os

file_path = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\Mercado Livre\plena-barbearia\app.html"

def fix_content():
    if not os.path.exists(file_path):
        return

    # Lê o arquivo binariamente para evitar problemas de decode inicial
    with open(file_path, "rb") as f:
        raw_data = f.read()

    # Tenta converter para string lidando com possíveis corrupções
    try:
        content = raw_data.decode('utf-8')
    except UnicodeDecodeError:
        content = raw_data.decode('cp1252', errors='replace')

    # 1. Correção de Lógica (CRÍTICO para a tela branca)
    # Substitui a função inexistente pela correta
    content = content.replace("fetchSystemNotifications", "initNotificationSystem")
    
    # 2. Correção de Scripts e URLs
    content = content.replace("../../api_licenca.php", "../api_licenca_ml.php")
    
    # 3. Limpeza de Encoding Degradado (Fixando o que o script anterior pode ter quebrado)
    # Ordem de substituição: do mais específico para o mais geral
    encoding_fixes = [
        ("é£", "ã"),
        ("é§", "ç"),
        ("GestÃ£o", "Gestão"),
        ("ATUALIZAÇéO", "ATUALIZAÇÃO"),
        ("LanÃ§amentos", "Lançamentos"),
        ("ConfiguraÃ§Ãµes", "Configurações"),
        ("Ã£", "ã"),
        ("Ã§", "ç"),
        ("Ã©", "é"),
        ("Ã¡", "á"),
        ("Ãª", "ê"),
        ("Ã­", "í"),
        ("Ã³", "ó")
    ]
    
    for old, new in encoding_fixes:
        content = content.replace(old, new)

    # 4. Segurança do Lucide
    if "if(window.lucide)" not in content:
        content = content.replace("lucide.createIcons();", "if(window.lucide) { lucide.createIcons(); }")

    # 5. Forçar salvamento em UTF-8 SEM BOM para máxima compatibilidade
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    fix_content()
    print("Reparo V2 concluído: Lógica de notificações e encoding restaurados.")
