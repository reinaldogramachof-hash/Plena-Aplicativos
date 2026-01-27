import os
import zipfile

# Configuration
BASE_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos"
DIRS_TO_SCAN = ["apps.plus"] 

# Include the RESET databases
FILES_TO_INCLUDE = [
    "database_licenses_secure.json",
    "finance_transactions.json",
    "api_licenca.php" # Ensure logic is updated too
]
EXTRA_FILES = [
    r"assets\js\plena-lock.js",
    r"assets\js\plena-notifications.js"
]
OUTPUT_ZIP = os.path.join(BASE_DIR, "deploy_reset_db.zip")

print(f"Creating DB RESET deployment at: {OUTPUT_ZIP}")

with zipfile.ZipFile(OUTPUT_ZIP, 'w', zipfile.ZIP_DEFLATED) as zipf:
    # 1. Add DBs and API
    for file in FILES_TO_INCLUDE:
        full_path = os.path.join(BASE_DIR, file)
        if os.path.exists(full_path):
            zipf.write(full_path, arcname=file)
            print(f"Added (Root): {file}")
        else:
            print(f"WARNING: Missing root file {file}")

    # 2. Add extra critical assets
    for extra in EXTRA_FILES:
        full_path = os.path.join(BASE_DIR, extra)
        if os.path.exists(full_path):
            zipf.write(full_path, arcname=extra)
            print(f"Added: {extra}")
        else:
            print(f"WARNING: Missing extra file {extra}")

    # 3. Add apps index.html (Standard consistency)
    count = 0
    for folder in DIRS_TO_SCAN:
        abs_folder = os.path.join(BASE_DIR, folder)
        if not os.path.exists(abs_folder):
            continue
            
        for root, dirs, files in os.walk(abs_folder):
            for file in files:
                if file.lower() == "index.html":
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, BASE_DIR)
                    zipf.write(full_path, arcname=rel_path)
                    count += 1
    
    print(f"Packed {count} application files.")

print("--- RESET ZIP CREATION COMPLETE ---")
