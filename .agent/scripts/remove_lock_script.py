import os

# Base directory
BASE_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"
LOCK_SCRIPT_TAG = '<script src="../../assets/js/plena-lock.js"></script>'

def remove_lock_script():
    print("Starting removal of plena-lock.js...")
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

                # Check if injected
                if LOCK_SCRIPT_TAG in content:
                    # Remove the tag (and potentially the newline)
                    new_content = content.replace(LOCK_SCRIPT_TAG + "\n", "").replace(LOCK_SCRIPT_TAG, "")
                    
                    with open(index_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    
                    print(f"SUCCESS: Removed LOCK from {fat_app}")
                    count += 1
                else:
                    print(f"Skipping {fat_app}: Lock script not found.")

            except Exception as e:
                print(f"ERROR processing {fat_app}: {e}")

    print(f"\nRemoval complete. Total apps updated: {count}")

if __name__ == "__main__":
    remove_lock_script()
