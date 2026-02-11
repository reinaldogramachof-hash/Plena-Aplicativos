
import os

file_path = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\Mercado Livre\plena-barbearia\app.html"

def fix_content():
    if not os.path.exists(file_path):
        print(f"Erro: Arquivo {file_path} não encontrado.")
        return

    # Tenta ler como UTF-8
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except UnicodeDecodeError:
        # Se falhar, tenta ler como ANSI e converter
        with open(file_path, "r", encoding="cp1252") as f:
            content = f.read()

    # 1. Correção de Encoding Comum (Reparo de corrupção prévia)
    replacements = {
        "Ã£": "ã",
        "Ã§": "ç",
        "Ã¡": "á",
        "Ã": "é", # Caso comum de erro em 'é'
        "Ãª": "ê",
        "Ã­": "í",
        "Ã³": "ó",
        "Ãº": "ú",
        "Ã€": "À",
        "ÃŠ": "Ê",
        "GestÃ£o": "Gestão",
        "Barbearia": "Barbearia",
        "ConfiguraÃ§Ãµes": "Configurações",
        "LanÃ§amentos": "Lançamentos",
        "ComissÃµes": "Comissões",
        "RelatÃ³rios": "Relatórios"
    }
    
    for old, new in replacements.items():
        content = content.replace(old, new)

    # 2. Correção de Lógica de Notificações
    # O erro 'fetchSystemNotifications is not defined' trava o JS.
    content = content.replace("fetchSystemNotifications", "initNotificationSystem")
    
    # Corrigir URL da API para o ambiente Mercado Livre (retroceder um nível apenas)
    content = content.replace("const NOTIF_API_URL = '../../api_licenca.php';", "const NOTIF_API_URL = '../api_licenca_ml.php';")
    content = content.replace("const NOTIF_API_URL = '../api_licenca_ml.php';", "const NOTIF_API_URL = '../api_licenca_ml.php';") # Double check

    # 3. Reforço do Lucide
    # Garantir que createIcons seja chamado com segurança
    content = content.replace("lucide.createIcons();", "if(window.lucide) { lucide.createIcons(); } else { console.error('Lucide não carregado'); }")

    # 4. Debugging extra no Console
    if "console.log(\"Forced Render All Views Completed\");" in content:
        content = content.replace("console.log(\"Forced Render All Views Completed\");", "console.log(\"Forced Render All Views Completed\"); console.log(\"Lucide Status:\", typeof lucide);")

    # Salva como UTF-8 limpo
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    
    print("Sucesso: app.html reparado com encoding UTF-8 e correções lógicas.")

if __name__ == "__main__":
    fix_content()
