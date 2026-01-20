import os
import glob
import re

APPS_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"
REPORT = {}

def check_file(filepath):
    filename = os.path.basename(filepath)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    issues = []
    
    if "plena-lock.js" not in content:
        issues.append("Missing plena-lock.js")
    
    if "showNotification" not in content:
        issues.append("Missing showNotification")
        
    if "showCustomConfirm" not in content:
        issues.append("Missing showCustomConfirm")
        
    if "customConfirmModal" not in content:
        issues.append("Missing customConfirmModal")
        
    if "2026" not in content and "2025" in content:
        issues.append("Wrong Year (Found 2025)")
    elif "2026" not in content:
        issues.append("Year 2026 not found")

    if issues:
        REPORT[filename] = issues

def main():
    print(f"Auditing apps in {APPS_DIR}...")
    html_files = glob.glob(os.path.join(APPS_DIR, "plena_*.html"))
    
    for file in html_files:
        check_file(file)
        
    print(f"\nAudit Complete. Found {len(REPORT)} files with issues out of {len(html_files)} files.\n")
    
    if REPORT:
        print("Files needing standardization:")
        for filename, issues in sorted(REPORT.items()):
            print(f"- {filename}: {', '.join(issues)}")
    else:
        print("All files appear to be standardized!")

if __name__ == "__main__":
    main()
