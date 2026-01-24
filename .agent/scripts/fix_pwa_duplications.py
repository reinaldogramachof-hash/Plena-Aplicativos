import os
import re

APPS_DIR = r"c:/Users/reina/OneDrive/Desktop/Projetos/Plena Aplicativos/apps.plus"

STANDARD_BLOCK = """<!-- PWA INSTALLATION TOAST (Standardized) -->
<div id="pwa-install-toast" style="display: none; position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background-color: white; color: black; padding: 12px 16px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 9999; align-items: center; gap: 12px; border: 1px solid #e5e7eb; min-width: 300px;">
    <div style="background-color: transparent; padding: 0; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
        <img src="./icons/icon-192.png" alt="App Icon" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;">
    </div>
    <div style="flex: 1;">
        <p style="font-size: 14px; font-weight: bold; margin: 0; color: #1f2937;">Instalar Aplicativo</p>
        <p style="font-size: 12px; color: #6b7280; margin: 0;">Acesso rápido 100% offline</p>
    </div>
    <button onclick="installPWA()" style="background-color: #000; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer; white-space: nowrap;">
        Instalar
    </button>
    <button onclick="dismissInstall()" style="background-color: transparent; border: none; color: #9ca3af; cursor: pointer; padding: 4px; display: flex; align-items: center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
</div>

<script>
    let deferredPrompt;
    
    // Check if installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || document.referrer.includes('android-app://');

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        deferredPrompt = e;
        
        // Show the toast if not already dismissed and not in standalone mode
        if (!localStorage.getItem('pwa_dismissed') && !isStandalone) {
             const toast = document.getElementById('pwa-install-toast');
             if (toast) toast.style.display = 'flex';
        }
    });

    function installPWA() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                deferredPrompt = null;
                dismissInstall();
            });
        }
    }

    function dismissInstall() {
        const toast = document.getElementById('pwa-install-toast');
        if (toast) toast.style.display = 'none';
        localStorage.setItem('pwa_dismissed', 'true');
    }
</script>"""

def clean_app(app_name):
    index_path = os.path.join(APPS_DIR, app_name, 'index.html')
    if not os.path.exists(index_path):
        print(f"Skipping {app_name}: index.html not found")
        return

    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content

        # 1. Remove the EXACT Standard Block first (to avoid matching parts of it with other regexes)
        # We replace it with nothing, effectively removing it. We will add it back at the end.
        # Note: We need to be careful with whitespace sensitive matching.
        # We'll try to match it loosely or just proceed to purge aggressively.
        
        # 2. PURGE: Remove any script that defines 'let deferredPrompt'
        # This covers the standard block AND any old duplicates.
        content = re.sub(r'<script>\s*let deferredPrompt[\s\S]*?</script>', '', content)
        
        # 3. PURGE: Remove any DIV that has id="pwa-install-toast"
        content = re.sub(r'<div[^>]*id=["\']pwa-install-toast["\'][\s\S]*?</div>', '', content)
        
        # 4. PURGE: Remove specific broken fragments like those found in plena_assistencia
        # Matches: <div style="flex: 1;">...Instalar Aplicativo...</div>...<button>Instalar</button>...</div>
        # Using a broad regex for the structure we saw
        bad_fragment_regex = r'<div style="flex: 1;">\s*<p[^>]*>Instalar Aplicativo</p>[\s\S]*?</div>\s*<button onclick="installPWA\(\)"[\s\S]*?</button>\s*<button onclick="dismissInstall\(\)"[\s\S]*?</button>\s*</div>'
        content = re.sub(bad_fragment_regex, '', content)

        # 5. PURGE: Remove any remaining comment marker
        content = content.replace('<!-- PWA INSTALLATION TOAST (Standardized) -->', '')
        content = content.replace('<!-- PWA INSTALLATION TOAST -->', '')

        # 6. INJECT: Add correct block
        if '</body>' in content:
            content = content.replace('</body>', f'\n{STANDARD_BLOCK}\n</body>')
        else:
            print(f"[{app_name}] ERROR: No </body> tag")
            return

        # Check for weird triple newlines or redundant whitespace we might have created
        content = re.sub(r'\n{3,}', '\n\n', content)

        # 7. MANIFEST & LUCIDE CHECKS (Safety)
        manifest_link = '<link rel="manifest" href="manifest.json">'
        lucide_script = '<script src="https://unpkg.com/lucide@latest"></script>'
        
        if 'manifest.json' not in content:
             content = content.replace('</head>', f'    {manifest_link}\n</head>')
             print(f"[{app_name}] Re-added Manifest link")
             
        if 'lucide' not in content:
             content = content.replace('</head>', f'    {lucide_script}\n</head>')
             print(f"[{app_name}] Re-added Lucide script")

        if content != original_content:
            with open(index_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"[{app_name}] FIXED: Duplicates removed and standard block injected.")
        else:
            print(f"[{app_name}] OK: No changes needed.")

    except Exception as e:
        print(f"[{app_name}] ERROR: {e}")

def main():
    if not os.path.exists(APPS_DIR):
        print("Apps directory not found")
        return

    for item in os.listdir(APPS_DIR):
        if os.path.isdir(os.path.join(APPS_DIR, item)):
            clean_app(item)

if __name__ == "__main__":
    main()
