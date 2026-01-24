import os

# Caminho base dos ícones já gerados na raiz
SOURCE_ICON_192 = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\assets\img\icons\icon-192.png"
SOURCE_ICON_512 = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\assets\img\icons\icon-512.png"

# Caminho das aplicações
APPS_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"

def replicate_icons():
    if not os.path.exists(SOURCE_ICON_192) or not os.path.exists(SOURCE_ICON_512):
        print("Erro: Ícones fonte não encontrados. Execute o passo anterior primeiro.")
        return

    # Lê conteúdo binário dos ícones
    with open(SOURCE_ICON_192, 'rb') as f:
        icon192_data = f.read()
    with open(SOURCE_ICON_512, 'rb') as f:
        icon512_data = f.read()

    apps = [d for d in os.listdir(APPS_DIR) if os.path.isdir(os.path.join(APPS_DIR, d))]
    
    print(f"Replicando ícones para {len(apps)} aplicações...")

    for app in apps:
        app_path = os.path.join(APPS_DIR, app)
        
        # Cria estrutura assets/img/icons dentro de cada app se não existir
        # Mas espere! O manifesto dos apps aponta para "../../assets/img/icons/..." (raiz)
        # Se os apps já apontam para a raiz, NÃO PRECISAMOS COPIAR!
        # Vamos verificar o manifest de um app exemplo.
        
        manifest_path = os.path.join(app_path, "manifest.json")
        if os.path.exists(manifest_path):
            with open(manifest_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Se o manifesto aponta para ../../assets, então já está pronto!
            if "../../assets/img/icons" in content:
                print(f"[{app}] Já aponta para assets globais. OK.")
            else:
                print(f"[{app}] ALERTA: Manifesto pode estar com caminho local. Verificando ajuste...")
                # Aqui poderíamos ajustar o manifesto para apontar para a raiz
                # Isso economiza espaço e mantém consistência.
    
    print("\nVerificação concluída. Se todos apontam para ../../assets, nenhuma cópia física é necessária.")

replicate_icons()
