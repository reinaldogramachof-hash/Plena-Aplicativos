import os
import zipfile

# Configuration
BASE_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos"
# We need to update EVERYTHING now
DIRS_TO_SCAN = ["apps.plus"] 
# Actually, wait. The user only deployed apps.plus previously. But the scope change applies to ALL apps if they use plena-lock.js.
# BUT, we only moved the lock script to head in apps.plus.
# To be safe and consistent with the user's previous request "only apps.plus", let's keep scanning apps.plus for index.html.
# HOWEVER, we really need to include the BACKEND and ASSETS now.

FILES_TO_INCLUDE = ["index.html"] 
EXTRA_FILES = [
    r"assets\js\plena-lock.js",
    r"assets\js\plena-notifications.js",
    r"assets\js\admin_logic_v1.js",
    r"api_licenca.php",
    r"admin.html"
]
OUTPUT_ZIP = os.path.join(BASE_DIR, "deploy_update.zip")

print(f"Creating FINAL SCOPED update at: {OUTPUT_ZIP}")

with zipfile.ZipFile(OUTPUT_ZIP, 'w', zipfile.ZIP_DEFLATED) as zipf:
    # 1. Add extra critical files (Backend + Assets)
    for extra in EXTRA_FILES:
        full_path = os.path.join(BASE_DIR, extra)
        if os.path.exists(full_path):
            zipf.write(full_path, arcname=extra)
            print(f"Added: {extra}")
        else:
            print(f"WARNING: Missing extra file {extra}")

    # 2. Add apps index.html (Already fixed to head)
    # Keeping to apps.plus as per strict focus
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
    
    print(f"Packed {count} application files from {DIRS_TO_SCAN}.")

print("--- ZIP CREATION COMPLETE ---")
