import os
import json

APPS_DIR = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\apps.plus"
REPORT_PATH = r"c:\Users\reina\OneDrive\Desktop\Projetos\Plena Aplicativos\pwa_audit_report.txt"

def check_pwa_status(app_path):
    issues = []
    
    # 1. Check file existence
    has_manifest = os.path.exists(os.path.join(app_path, "manifest.json"))
    has_sw = os.path.exists(os.path.join(app_path, "sw.js"))
    has_index = os.path.exists(os.path.join(app_path, "index.html"))
    
    if not has_index:
        return ["CRITICAL: index.html not found"]

    if not has_manifest:
        issues.append("Missing manifest.json")
    if not has_sw:
        issues.append("Missing sw.js")

    # 2. Check index.html content
    try:
        with open(os.path.join(app_path, "index.html"), 'r', encoding='utf-8') as f:
            content = f.read()
            
            if "manifest.json" not in content:
                issues.append("index.html does not link to manifest.json")
            
            if "serviceWorker.register" not in content and "sw.js" not in content:
                issues.append("index.html does not register a Service Worker")
                
    except Exception as e:
        issues.append(f"Error reading index.html: {str(e)}")

    # 3. Check manifest content (basic)
    if has_manifest:
        try:
            with open(os.path.join(app_path, "manifest.json"), 'r', encoding='utf-8') as f:
                manifest = json.load(f)
                required_keys = ["name", "icons", "start_url", "display"]
                missing_keys = [k for k in required_keys if k not in manifest]
                if missing_keys:
                    issues.append(f"manifest.json missing keys: {', '.join(missing_keys)}")
                    
                if "display" in manifest and manifest["display"] not in ["standalone", "fullscreen", "minimal-ui"]:
                     issues.append(f"manifest.json display mode '{manifest['display']}' might not trigger install prompt (preferred: standalone)")

        except json.JSONDecodeError:
             issues.append("manifest.json is invalid JSON")
        except Exception as e:
            issues.append(f"Error reading manifest.json: {str(e)}")

    return issues

def main():
    if not os.path.exists(APPS_DIR):
        print(f"Directory not found: {APPS_DIR}")
        return

    results = {}
    apps = [d for d in os.listdir(APPS_DIR) if os.path.isdir(os.path.join(APPS_DIR, d))]
    
    print(f"Auditing {len(apps)} apps in {APPS_DIR}...\n")

    for app in apps:
        app_path = os.path.join(APPS_DIR, app)
        issues = check_pwa_status(app_path)
        if issues:
            results[app] = issues
        else:
            results[app] = "OK"

    # Generate Report
    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        f.write("PWA READINESS AUDIT REPORT\n")
        f.write("==========================\n\n")
        
        ok_count = 0
        issue_count = 0
        
        for app, status in sorted(results.items()):
            if status == "OK":
                ok_count += 1
            else:
                issue_count += 1
                f.write(f"[FAIL] {app}:\n")
                for issue in status:
                    f.write(f"  - {issue}\n")
                f.write("\n")
        
        f.write("--------------------------\n")
        f.write(f"Total Apps: {len(apps)}\n")
        f.write(f"Ready: {ok_count}\n")
        f.write(f"With Issues: {issue_count}\n")

    print(f"Audit complete. Found {issue_count} apps with issues out of {len(apps)}.")
    print(f"Report saved to: {REPORT_PATH}")

if __name__ == "__main__":
    main()
