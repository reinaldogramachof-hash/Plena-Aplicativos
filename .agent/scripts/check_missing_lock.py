import os

BASE_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos"
APPS_PLUS_DIR = os.path.join(BASE_DIR, "apps.plus")
LOCK_SCRIPT_NAME = "plena-lock.js"

print(f"Checking directory: {APPS_PLUS_DIR}")

if not os.path.exists(APPS_PLUS_DIR):
    print("ERROR: apps.plus directory does not exist!")
else:
    for root, dirs, files in os.walk(APPS_PLUS_DIR):
        for file in files:
            if file.lower() == "index.html":
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    
                    if LOCK_SCRIPT_NAME not in content:
                        print(f"MISSING: {file_path}")
                    else:
                        print(f"FOUND: {file_path}")
                except Exception as e:
                    print(f"ERROR reading {file_path}: {e}")
