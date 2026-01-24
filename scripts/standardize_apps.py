import os
import shutil
import json
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPS_PLUS_DIR = os.path.join(ROOT_DIR, 'apps.plus')

def get_app_name(slug):
    # plena_pizzaria -> Plena Pizzaria
    return slug.replace('_', ' ').replace('-', ' ').title()

def generate_manifest(slug):
    name = get_app_name(slug)
    return {
        "name": name,
        "short_name": name,
        "start_url": "./index.html",
        "display": "standalone",
        "background_color": "#ffffff",
        "theme_color": "#0d6efd",
        "icons": [
            {
                "src": "../../assets/img/icons/icon-192.png",
                "sizes": "192x192",
                "type": "image/png"
            },
             {
                "src": "../../assets/img/icons/icon-512.png",
                "sizes": "512x512",
                "type": "image/png"
            }
        ]
    }

SW_CONTENT = """
const CACHE_NAME = 'plena-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  '../../assets/css/style.css', 
  '../../assets/js/plena-lock.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
"""

def process_html_content(content):
    # 1. Update asset paths
    # Replace "assets/" with "../../assets/" 
    # Logic: Look for src="assets/ or href="assets/ and prepend ../../
    
    def replace_asset_path(match):
        prefix = match.group(1) # src=" or href="
        path = match.group(2)   # assets/...
        quote = match.group(3)  # "
        return f'{prefix}../../{path}{quote}'

    # Common quotes: " or '
    # This regex matches src="assets/..." or href="assets/..."
    content = re.sub(r'(src=["\']|href=["\'])(assets/[^"\']*)(["\'])', replace_asset_path, content, flags=re.IGNORECASE)

    # 2. Inject plena-lock.js
    if 'plena-lock.js' not in content:
        lock_script = '<script src="../../assets/js/plena-lock.js"></script>'
        if '</head>' in content:
            content = content.replace('</head>', f'    {lock_script}\n</head>')
        elif '</body>' in content:
             content = content.replace('</body>', f'    {lock_script}\n</body>')
    
    return content

def main():
    print(f"Iniciando padronização em: {APPS_PLUS_DIR}")
    
    if not os.path.exists(APPS_PLUS_DIR):
        print("Diretório apps.plus não encontrado.")
        return

    # List only .html files
    files = [f for f in os.listdir(APPS_PLUS_DIR) if f.endswith('.html') and os.path.isfile(os.path.join(APPS_PLUS_DIR, f))]
    
    if not files:
        print("Nenhum arquivo .html solto encontrado em apps.plus/")
        return

    count = 0
    for filename in files:
        slug = os.path.splitext(filename)[0]
        original_path = os.path.join(APPS_PLUS_DIR, filename)
        new_dir = os.path.join(APPS_PLUS_DIR, slug)
        new_index_path = os.path.join(new_dir, 'index.html')
        manifest_path = os.path.join(new_dir, 'manifest.json')
        sw_path = os.path.join(new_dir, 'sw.js')
        
        try:
            # Create Directory
            if not os.path.exists(new_dir):
                os.makedirs(new_dir)
            else:
                print(f"⚠️  Diretório {slug} já existe. Pulando criação, mas processando arquivo.")

            # Read Original Content
            with open(original_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Modify Content
            new_content = process_html_content(content)
            
            # Write New Index
            with open(new_index_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
                
            # Remove Original File
            os.remove(original_path)
            
            # Write Manifest
            manifest_data = generate_manifest(slug)
            with open(manifest_path, 'w', encoding='utf-8') as f:
                json.dump(manifest_data, f, indent=4, ensure_ascii=False)
                
            # Write Service Worker
            with open(sw_path, 'w', encoding='utf-8') as f:
                f.write(SW_CONTENT)
                
            print(f"[OK] {slug} migrado para estrutura PWA.")
            count += 1
            
        except Exception as e:
            print(f"[ERRO] Erro ao migrar {filename}: {e}")

    print(f"\nConcluído! {count} apps migrados.")

if __name__ == "__main__":
    main()
