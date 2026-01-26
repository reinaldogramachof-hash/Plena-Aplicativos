import os

APPS_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"

def audit():
    print("Scanning for Data URI Manifests...")
    count = 0
    apps = [d for d in os.listdir(APPS_DIR) if os.path.isdir(os.path.join(APPS_DIR, d))]
    
    for app in apps:
        path = os.path.join(APPS_DIR, app, "index.html")
        if not os.path.exists(path):
            continue
            
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if 'href=\'data:application/manifest+json' in content or 'href="data:application/manifest+json' in content:
            print(f"FOUND: {app}")
            count += 1
            
    if count == 0:
        print("No other data URI manifests found.")
    else:
        print(f"Total found: {count}")

if __name__ == "__main__":
    audit()
