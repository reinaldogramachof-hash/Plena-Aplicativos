import os
import re

BASE_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"

def fix_app(app_path):
    try:
        with open(app_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        
        # The bad line is exactly: "SISTEMA DE ATUALIZAÇÃO E PWA (ROBUSTO)"
        # It sits at the start of the injected block, likely on its own line or after a newline.
        # We want to ensure it has "// " before it.
        
        # Regex to find it NOT preceded by //
        # Lookbehind is tricky in python re variable length.
        # Easier: simply replace the specific Bad String with Good String.
        # But we must be careful not to double comment if someone fixed it manually?
        # Search for the string. If the 2 chars before it are not "//", then replace.
        
        target = "SISTEMA DE ATUALIZAÇÃO E PWA (ROBUSTO)"
        
        # Naive find loop
        idx = 0
        modified = False
        new_content_parts = []
        last_idx = 0
        
        while True:
            idx = content.find(target, idx)
            if idx == -1:
                break
                
            # Check prefix
            prefix = content[idx-3:idx] # Get 3 chars before
            if "//" in prefix or "// " in prefix:
                # Already commented
                idx += len(target)
                continue
            
            # Not commented. Replace.
            # We want to replace "SISTEMA..." with "// SISTEMA..."
            # But wait, we should do string replacement carefully.
            
            # Actually, simpler approach:
            # Replace "\nSISTEMA DE..." with "\n// SISTEMA DE..."
            # Replace ">SISTEMA DE..." with ">\n// SISTEMA DE..." (if right after script tag)
            
            # Let's count how many we find.
            print(f"  Found syntax error at index {idx}")
            
            # We construct new content.
            new_content_parts.append(content[last_idx:idx])
            new_content_parts.append("// " + target)
            last_idx = idx + len(target)
            idx = last_idx
            modified = True
            
        new_content_parts.append(content[last_idx:])
        
        if modified:
            final_content = "".join(new_content_parts)
            with open(app_path, 'w', encoding='utf-8') as f:
                f.write(final_content)
            print("  Fixed.")
        else:
            print("  No syntax errors found.")

    except Exception as e:
        print(f"Error fixing {app_path}: {e}")

# EXECUTE
for root, dirs, files in os.walk(BASE_DIR):
    for file in files:
        if file == "index.html":
            print(f"Scanning {os.path.basename(root)}...")
            fix_app(os.path.join(root, file))
