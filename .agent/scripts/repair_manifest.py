import os
import re

APPS_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"

# Group 1: Duplicate Injection (Redeclaration errors)
# We need to remove the FIRST occurrence of the system block, keeping the last one.
DUPLICATE_APPS = [
    "plena_alugueis",
    "plena_orcamentos", 
    "plena_financas",
    "plena_distribuidora",
    "plena_controle",
    "plena_card",
    "plena_beleza",
    "plena_motoboy" # User mentioned errors here too, likely same
]

# Group 2: Unclosed Script Tag (HTML injected inside JS)
UNCLOSED_SCRIPT_APPS = [
    "plena_obras"
]

def fix_duplicates(app_name):
    path = os.path.join(APPS_DIR, app_name, "index.html")
    if not os.path.exists(path):
        return
        
    print(f"Fixing duplicates in {app_name}...")
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Marker for the start of our injected block
    marker = '<!-- Blocking Modal (Secure Broadcast) -->'
    
    # Check count
    count = content.count(marker)
    if count <= 1:
        print(f"  {app_name}: No duplicates found (count={count}).")
        return

    # If duplicates, we want to keep the LAST one.
    # We will find the index of the LAST marker.
    last_idx = content.rfind(marker)
    
    # We want to remove the block associated with the FIRST marker(s).
    # But simply removing from the first marker might leave garbage.
    # A safer strategy for these files (which usually just had the block appended to end):
    # Find the *first* marker.
    # Find the *last* marker.
    # Remove everything between first marker and last marker?
    # No, the first block has HTML and Scripts.
    
    # Robust Strategy: 
    # 1. Identify valid original code end (usually </body> or </html> or just before the FIRST marker).
    # 2. Identify the valid New System Block (the one starting at last_idx).
    # 3. Stitch them together.
    
    first_idx = content.find(marker)
    
    # The content before the first marker is likely the original app code + maybe some junk.
    # We need to be careful. If the duplication is "App Code -> Old Block -> New Block",
    # then cutting at first_idx is safe.
    
    clean_prefix = content[:first_idx]
    
    # Now we need the system block. We can just take from last_idx to end.
    system_block = content[last_idx:]
    
    # Result
    new_content = clean_prefix + "\n" + system_block
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("  Fixed.")

def fix_unclosed_script(app_name):
    path = os.path.join(APPS_DIR, app_name, "index.html")
    if not os.path.exists(path):
        return

    print(f"Fixing unclosed script in {app_name}...")
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Pattern: The injection starts with <!-- Blocking Modal ...
    # It is preceded by JS code, but NO </script> tag.
    # We look for the marker.
    marker = '<!-- Blocking Modal (Secure Broadcast) -->'
    idx = content.find(marker)
    
    if idx == -1:
        print("  Marker not found.")
        return
        
    # Check if </script> exists in the 500 chars before marker
    pre_context = content[max(0, idx-500):idx]
    
    if '</script>' in pre_context:
        print("  Script tag seems closed already. Skipping simple fix.")
        # Might be a different issue, but user error strongly suggests this.
        # Let's check if it's commented out?
        return
        
    # Insert </script> before marker
    new_content = content[:idx] + "\n    </script>\n\n    " + content[idx:]
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("  Fixed: Inserted missing </script> tag.")

def main():
    for app in DUPLICATE_APPS:
        fix_duplicates(app)
        
    for app in UNCLOSED_SCRIPT_APPS:
        fix_unclosed_script(app)

if __name__ == "__main__":
    main()
