import os
import re

APPS_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"

SW_REGISTER_SCRIPT = """
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(registration => {
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch(err => {
                        console.log('ServiceWorker registration failed: ', err);
                    });
            });
        }
    </script>
"""

MANIFEST_LINK = '    <link rel="manifest" href="manifest.json">'

def fix_app(app_path):
    index_path = os.path.join(app_path, "index.html")
    
    if not os.path.exists(index_path):
        print(f"Skipping {app_path}: index.html not found")
        return

    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content = content
        modified = False

        # 1. Inject Manifest Link if missing
        if "manifest.json" not in new_content:
            # Try to insert before closing head
            if "</head>" in new_content:
                new_content = new_content.replace("</head>", f"{MANIFEST_LINK}\n</head>")
                modified = True
            else:
                print(f"Warning: No </head> tag found in {app_path}")

        # 2. Inject Service Worker Registration if missing
        if "serviceWorker.register" not in new_content and "sw.js" not in new_content:
            # Try to insert before closing body
            if "</body>" in new_content:
                new_content = new_content.replace("</body>", f"{SW_REGISTER_SCRIPT}\n</body>")
                modified = True
            elif "</html>" in new_content:
                 new_content = new_content.replace("</html>", f"{SW_REGISTER_SCRIPT}\n</html>")
                 modified = True
            else:
                print(f"Warning: No </body> or </html> tag found in {app_path}")

        if modified:
            with open(index_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed: {os.path.basename(app_path)}")
        else:
            print(f"No changes needed: {os.path.basename(app_path)}")

    except Exception as e:
        print(f"Error fixing {app_path}: {str(e)}")

def main():
    if not os.path.exists(APPS_DIR):
        print(f"Directory not found: {APPS_DIR}")
        return

    apps = [d for d in os.listdir(APPS_DIR) if os.path.isdir(os.path.join(APPS_DIR, d))]
    
    print(f"Fixing PWA issues for {len(apps)} apps in {APPS_DIR}...\n")

    for app in apps:
        app_path = os.path.join(APPS_DIR, app)
        fix_app(app_path)

    print("\nFix process complete.")

if __name__ == "__main__":
    main()
