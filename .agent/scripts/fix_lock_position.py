import os
import re

# Base paths
BASE_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos"
APPS_DIR = os.path.join(BASE_DIR, "apps")
APPS_PLUS_DIR = os.path.join(BASE_DIR, "apps.plus")

LOCK_SCRIPT_NAME = "plena-lock.js"

def get_relative_path_to_assets(file_path):
    assets_path = os.path.join(BASE_DIR, "assets", "js", LOCK_SCRIPT_NAME)
    html_dir = os.path.dirname(file_path)
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

    # 1. Detect if script exists and remove it (to re-insert correctly)
    # Search for <script src="...plena-lock.js"></script>
    # Logic: Find the line/block containing plena-lock.js and remove it.
    
    # Check if present
    if LOCK_SCRIPT_NAME not in content:
        # If not present, we will inject it.
        pass
    else:
        # Regex to remove the existing tag
        # Matches <script ... src="...plena-lock.js" ... > ... </script> or self closing
        # Be careful not to match too much.
        # Simple approach: split lines, filter out the line with plena-lock.js, join back.
        # This assumes the script is on its own line, which is true for our injections and most clean code.
        lines = content.splitlines()
        new_lines = []
        for line in lines:
            if LOCK_SCRIPT_NAME in line and "<script" in line:
                continue # Skip this line
            new_lines.append(line)
        content = "\n".join(new_lines)

    # 2. Prepare new tag
    rel_path = get_relative_path_to_assets(file_path)
    script_tag = f'<script src="{rel_path}"></script>'

    # 3. Insert into HEAD (Validation)
    if "</head>" in content:
        # Insert before closing head
        new_content = content.replace("</head>", f"    {script_tag}\n</head>")
        action = "MOVED/INJECTED to HEAD"
    elif "<body>" in content:
        new_content = content.replace("<body>", f"<head>\n    {script_tag}\n</head>\n<body>")
        action = "CREATED HEAD and INJECTED"
    else:
        new_content = f"{script_tag}\n{content}"
        action = "PREPENDED (Fallback)"

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    
    print(f"{action}: {file_path}")

def scan_directory(directory):
    if not os.path.exists(directory):
        return

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower() == "index.html":
                file_path = os.path.join(root, file)
                process_file(file_path)

print("--- STARTING LOCK RELOCATION ---")
# Prioritize apps.plus as requested, but good to ensure consistency
scan_directory(APPS_PLUS_DIR) 
# scan_directory(APPS_DIR) # User focused on apps.plus in request "apenas com a pasta apps.plus", let's stick to that to be safe/fast/focused
print("--- COMPLETED ---")
