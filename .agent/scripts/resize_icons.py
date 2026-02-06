from PIL import Image
import os

source_path = r'c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.personalizados\gastro\icons\icon-512x512.png'
dest_dir = r'c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.personalizados\gastro\icons'

if not os.path.exists(source_path):
    print(f"Erro: Fonte não encontrada em {source_path}")
    exit(1)

try:
    img = Image.open(source_path)
    
    # 192x192
    img_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
    img_192.save(os.path.join(dest_dir, 'icon-192x192.png'))
    print("Gerado icon-192x192.png")
    
    # 152x152
    img_152 = img.resize((152, 152), Image.Resampling.LANCZOS)
    img_152.save(os.path.join(dest_dir, 'icon-152x152.png'))
    print("Gerado icon-152x152.png")
    
except Exception as e:
    print(f"Erro ao processar imagem: {e}")
