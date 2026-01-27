import os

# Base directory
BASE_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"
SCRIPT_TAG = '<script src="../../assets/js/plena-notifications.js"></script>'

def inject_script():
    print("Starting injection of plena-notifications.js...")
    count = 0
    
    # Iterate over all directories in apps.plus
    if not os.path.exists(BASE_DIR):
        print(f"Directory not found: {BASE_DIR}")
        return

    for fat_app in os.listdir(BASE_DIR):
        app_path = os.path.join(BASE_DIR, fat_app)
        index_path = os.path.join(app_path, "index.html")

        if os.path.isdir(app_path) and os.path.exists(index_path):
            try:
                with open(index_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Check if already injected
                if "plena-notifications.js" in content:
                    print(f"Skipping {fat_app}: Already injected.")
                    continue

                # Inject before </body>
                if "</body>" in content:
                    new_content = content.replace("</body>", f"{SCRIPT_TAG}\n</body>")
                    
                    with open(index_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    
                    print(f"SUCCESS: Injected into {fat_app}")
                    count += 1
                else:
                    print(f"WARNING: No </body> tag in {fat_app}")

            except Exception as e:
                print(f"ERROR processing {fat_app}: {e}")

    print(f"\nInjection complete. Total apps updated: {count}")

if __name__ == "__main__":
    inject_script()
