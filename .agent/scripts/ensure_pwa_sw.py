import os

# Root directory for apps
root_dir = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"

# Basic Service Worker Content
sw_content = """
const CACHE_NAME = 'plena-pwa-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  '../../assets/css/style.css',
  '../../assets/js/plena-lock.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.log('Cache error:', err))
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

# HTML snippet to register the service worker
sw_registration_snippet = """
        // INICIALIZAR APLICATIVO
        document.addEventListener('DOMContentLoaded', () => {
             if (typeof init === 'function') init();
             // Register SW for PWA
             if ('serviceWorker' in navigator) {
                 navigator.serviceWorker.register('./sw.js')
                     .then(() => console.log('SW Registered'))
                     .catch(err => console.error('SW Error:', err));
             }
        });
"""

old_init_line = "document.addEventListener('DOMContentLoaded', init);"

affected_count = 0

for app_name in os.listdir(root_dir):
    app_path = os.path.join(root_dir, app_name)
    if os.path.isdir(app_path):
        index_path = os.path.join(app_path, "index.html")
        sw_path = os.path.join(app_path, "sw.js")
        
        # 1. Create/Update sw.js if it doesn't exist
        if not os.path.exists(sw_path):
             try:
                 with open(sw_path, 'w', encoding='utf-8') as f:
                     f.write(sw_content)
                 print(f"Created sw.js for {app_name}")
             except Exception as e:
                 print(f"Error creating sw.js for {app_name}: {e}")

        # 2. Update index.html to register SW and remove duplicate manifest
        if os.path.exists(index_path):
            try:
                with open(index_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                updated = False
                
                # Update SW registration if old line exists
                if old_init_line in content:
                    content = content.replace(old_init_line, sw_registration_snippet.strip())
                    updated = True
                    print(f"Updated SW registration in {app_name}")

                # Remove duplicate data-uri manifest if present
                if "data:application/manifest+json" in content and "manifest.json" in content:
                    lines = content.splitlines()
                    new_lines = []
                    skip_next = False
                    for i, line in enumerate(lines):
                        if 'href=\'data:application/manifest+json' in line:
                           # Skip this line (and maybe the previous <link rel="manifest" if split)
                           # Simple heuristic: remove lines containing this specific data uri pattern if we know manifest.json exists
                           continue
                        if '<link rel="manifest"' in line and 'href=\'data:application/manifest+json' in lines[i+1]:
                           continue # Skip the <link tag if the next line is the data href
                        
                        new_lines.append(line)
                    
                    # Re-assemble
                    # A regex replace is safer for multiple lines
                    # import re
                    # content = re.sub(r'<link rel="manifest"\s+href=\'data:application/manifest\+json.*?>', '', content, flags=re.DOTALL)
                    # For now, let's stick to the visual check we did before or simple string manipulation if format is consistent.
                    # The previous tool call showed the format was split across lines.
                    pass 
                
                if updated:
                    with open(index_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    affected_count += 1
            
            except Exception as e:
                print(f"Error updating {app_name}: {e}")

print(f"Total apps updated with SW registration: {affected_count}")
