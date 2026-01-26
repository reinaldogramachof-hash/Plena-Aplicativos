import os

APPS_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"
TARGETS = ["plena_pdv", "plena_obras"]

def audit_and_fix(app_name):
    path = os.path.join(APPS_DIR, app_name, "index.html")
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return

    print(f"Checking {app_name}...")
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if lucide.createIcons() is called near the end
    # We look at the last 500 chars
    tail = content[-500:]
    
    if "lucide.createIcons()" in tail:
        print(f"  {app_name} seems to have a trailing createIcons call.")
        # But maybe it's inside a function that isn't called?
        # Let's force it just before </body> to be safe.
    else:
        print(f"  {app_name} missing trailing createIcons call. Injecting...")

    # Injection: Just before </body>
    # We use a robust check for window.lucide
    injection = "\n    <script>\n        // Failsafe Icon Init\n        document.addEventListener('DOMContentLoaded', () => {\n            if(window.lucide) lucide.createIcons();\n        });\n        // Immediate Init for static content\n        if(window.lucide) lucide.createIcons();\n    </script>\n"
    
    if "</body>" in content:
        new_content = content.replace("</body>", injection + "</body>")
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("  Fixed.")
    else:
        print("  Error: Could not find </body> tag.")

def main():
    for app in TARGETS:
        audit_and_fix(app)

if __name__ == "__main__":
    main()
