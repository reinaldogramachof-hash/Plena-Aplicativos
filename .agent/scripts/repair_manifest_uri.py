import os
import re

APPS_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"

def remove_data_uri_manifest(app_name):
    path = os.path.join(APPS_DIR, app_name, "index.html")
    if not os.path.exists(path):
        return
        
    print(f"Repairing {app_name}...")
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to capture the full <link rel="manifest" href='data:...' > 
    # It might span multiple lines.
    # We look for href='data:application/manifest+json... which ends with >
    
    # Simple replace strategy often safer than complex regex if format is consistent.
    # But format might vary slightly in whitespace.
    
    # We'll use a regex that matches the tag start, the specific href data, and the tag end.
    
    pattern = r'<link\s+rel="manifest"\s+href=[\'"]data:application/manifest\+json.*?[\'"]\s*>'
    
    # NOTE: The one in the file had multiple lines.
    # <link rel="manifest"
    #    href='data:...' >
    
    pattern_multiline = r'<link\s+rel="manifest"\s+href=[\'"]data:application/manifest\+json[^>]*?>'
    
    new_content = re.sub(pattern_multiline, '', content, flags=re.DOTALL | re.IGNORECASE)
    
    # Clean up empty lines left behind?
    # Maybe. But functionality is key first.
    
    if len(new_content) < len(content):
        print(f"  Removed Data URI manifest ({len(content) - len(new_content)} bytes).")
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
    else:
        print("  Pattern not matched (Check regex?).")

def main():
    apps = [d for d in os.listdir(APPS_DIR) if os.path.isdir(os.path.join(APPS_DIR, d))]
    for app in apps:
        remove_data_uri_manifest(app)

if __name__ == "__main__":
    main()
