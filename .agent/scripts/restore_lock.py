import os
import re

# Base paths
BASE_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos"
APPS_DIR = os.path.join(BASE_DIR, "apps")
APPS_PLUS_DIR = os.path.join(BASE_DIR, "apps.plus")

# The script we want to ensure is present
LOCK_SCRIPT_NAME = "plena-lock.js"

def get_relative_path_to_assets(file_path):
    """
    Calculates the relative path from the HTML file to the assets/js/plena-lock.js file.
    """
    # Assets are at BASE_DIR/assets/js/plena-lock.js
    assets_path = os.path.join(BASE_DIR, "assets", "js", LOCK_SCRIPT_NAME)
    
    # Get the directory of the current HTML file
    html_dir = os.path.dirname(file_path)
    
    # Calculate relative path
    rel_path = os.path.relpath(assets_path, html_dir)
    return rel_path.replace(os.sep, "/")

def process_file(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except UnicodeDecodeError:
        try:
            with open(file_path, "r", encoding="latin-1") as f:
                content = f.read()
        except:
            print(f"FAILED to read: {file_path}")
            return

    # Check if lock script is already there
    if LOCK_SCRIPT_NAME in content:
        # print(f"Skipping (already present): {file_path}")
        return

    rel_path = get_relative_path_to_assets(file_path)
    script_tag = f'<script src="{rel_path}"></script>'

    # Insertion logic: Try to insert before </head>, or valid alternative
    if "</head>" in content:
        new_content = content.replace("</head>", f"    {script_tag}\n</head>")
    elif "<body>" in content:
        new_content = content.replace("<body>", f"<head>\n    {script_tag}\n</head>\n<body>")
    else:
        # Fallback for very weird files, insert at top
        new_content = f"{script_tag}\n{content}"

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    
    print(f"RESTORED: {file_path}")

def scan_directory(directory):
    if not os.path.exists(directory):
        print(f"Directory not found: {directory}")
        return

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower() == "index.html":
                # Skip backups or odd folders if needed, but for now we process all
                file_path = os.path.join(root, file)
                process_file(file_path)

print("--- STARTING LOCK RESTORATION ---")
scan_directory(APPS_DIR)
scan_directory(APPS_PLUS_DIR)
print("--- COMPLETED ---")
